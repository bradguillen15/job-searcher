import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { loadAiSettings, saveSetting, SETTING_KEYS } from "@/lib/settings-db";
import {
  AI_BACKEND_OPTIONS,
  type AiBackend,
} from "@/types/settings";

const ANTHROPIC_KEY_PLACEHOLDER = "sk-ant-…";

function isOllamaListError(
  result: unknown
): result is { error: string } {
  return (
    typeof result === "object" &&
    result !== null &&
    "error" in result &&
    typeof (result as { error: string }).error === "string"
  );
}

function isSaveKeyError(
  result: unknown
): result is { error: string } {
  return isOllamaListError(result);
}

function validateOllamaBaseUrl(url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed) {
    return "Ollama base URL is required";
  }
  if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
    return "Ollama base URL must start with http:// or https://";
  }
  return null;
}

function AiSettingsSection(): React.JSX.Element {
  const [backend, setBackend] = useState<AiBackend>("ollama");
  const [ollamaBaseUrl, setOllamaBaseUrl] = useState("http://localhost:11434");
  const [ollamaModel, setOllamaModel] = useState("llama3.2");
  const [models, setModels] = useState<string[]>([]);
  const [modelsError, setModelsError] = useState<string | null>(null);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [anthropicKeyInput, setAnthropicKeyInput] = useState("");
  const [anthropicConfigured, setAnthropicConfigured] = useState(false);
  const [aiSaveError, setAiSaveError] = useState<string | null>(null);
  const [aiSaveSuccess, setAiSaveSuccess] = useState(false);
  const [keySaveError, setKeySaveError] = useState<string | null>(null);
  const [keySaveSuccess, setKeySaveSuccess] = useState(false);
  const [loading, setLoading] = useState(true);

  const modelOptions = useMemo(() => {
    const combined = new Set(models);
    if (ollamaModel) {
      combined.add(ollamaModel);
    }
    return Array.from(combined);
  }, [models, ollamaModel]);

  const fetchModels = useCallback(async (baseUrl: string): Promise<void> => {
    setModelsLoading(true);
    setModelsError(null);
    const result = await window.api.invoke("ollama:list", {
      baseUrl: baseUrl.trim(),
    });
    if (isOllamaListError(result)) {
      setModels([]);
      setModelsError(result.error);
    } else {
      const list = result as { models?: string[] };
      setModels(list.models ?? []);
    }
    setModelsLoading(false);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load(): Promise<void> {
      try {
        const [aiSettings, keyStatus] = await Promise.all([
          loadAiSettings(),
          window.api.invoke("settings:anthropicKeyStatus"),
        ]);

        if (cancelled) {
          return;
        }

        setBackend(aiSettings.backend);
        setOllamaBaseUrl(aiSettings.ollamaBaseUrl);
        setOllamaModel(aiSettings.ollamaModel);

        if (
          typeof keyStatus === "object" &&
          keyStatus !== null &&
          "configured" in keyStatus
        ) {
          setAnthropicConfigured(
            Boolean((keyStatus as { configured: boolean }).configured)
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (backend !== "ollama" || loading) {
      return;
    }

    const timer = setTimeout(() => {
      void fetchModels(ollamaBaseUrl);
    }, 300);

    return () => clearTimeout(timer);
  }, [backend, ollamaBaseUrl, loading, fetchModels]);

  const handleSaveAiSettings = async (): Promise<void> => {
    setAiSaveError(null);
    setAiSaveSuccess(false);

    const urlError = validateOllamaBaseUrl(ollamaBaseUrl);
    if (urlError) {
      setAiSaveError(urlError);
      return;
    }

    try {
      await Promise.all([
        saveSetting(SETTING_KEYS.aiBackend, backend),
        saveSetting(SETTING_KEYS.ollamaBaseUrl, ollamaBaseUrl.trim()),
        saveSetting(SETTING_KEYS.ollamaModel, ollamaModel),
      ]);
      setAiSaveSuccess(true);
    } catch (err) {
      setAiSaveError((err as Error).message);
    }
  };

  const handleSaveApiKey = async (): Promise<void> => {
    setKeySaveError(null);
    setKeySaveSuccess(false);

    const result = await window.api.invoke("settings:saveAnthropicKey", {
      apiKey: anthropicKeyInput,
    });

    if (isSaveKeyError(result)) {
      setKeySaveError(result.error);
      return;
    }

    setAnthropicKeyInput("");
    setAnthropicConfigured(true);
    setKeySaveSuccess(true);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI matching</CardTitle>
        <CardDescription>
          Configure the AI backend used for resume matching.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label>AI backend</Label>
          <RadioGroup
            value={backend}
            onValueChange={(value) => {
              if ((AI_BACKEND_OPTIONS as readonly string[]).includes(value)) {
                setBackend(value as AiBackend);
              }
            }}
            disabled={loading}
            className="flex flex-row gap-4"
          >
            <label className="flex items-center gap-2 text-sm">
              <RadioGroupItem value="ollama" />
              Ollama
            </label>
            <label className="flex items-center gap-2 text-sm">
              <RadioGroupItem value="anthropic" />
              Anthropic
            </label>
          </RadioGroup>
        </div>

        {backend === "ollama" ? (
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="ollama-base-url">Ollama base URL</Label>
              <Input
                id="ollama-base-url"
                value={ollamaBaseUrl}
                onChange={(event) => setOllamaBaseUrl(event.target.value)}
                className="font-mono"
                disabled={loading}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="ollama-model">Model</Label>
              <Select
                value={ollamaModel}
                onValueChange={(value) => {
                  if (value) {
                    setOllamaModel(value);
                  }
                }}
                disabled={loading || modelsLoading}
              >
                <SelectTrigger id="ollama-model" className="w-full">
                  <SelectValue placeholder="Select a model" />
                </SelectTrigger>
                <SelectContent>
                  {modelOptions.map((model) => (
                    <SelectItem key={model} value={model}>
                      {model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {modelsError ? (
              <p className="text-sm text-destructive" role="alert">
                {modelsError}
              </p>
            ) : null}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-muted-foreground">
              API key status:{" "}
              <span className="font-medium text-foreground">
                {anthropicConfigured ? "Configured" : "Not configured"}
              </span>
            </p>
            <div className="flex flex-col gap-2">
              <Label htmlFor="anthropic-api-key">Anthropic API key</Label>
              <Input
                id="anthropic-api-key"
                type="password"
                value={anthropicKeyInput}
                onChange={(event) => setAnthropicKeyInput(event.target.value)}
                placeholder={ANTHROPIC_KEY_PLACEHOLDER}
                disabled={loading}
                autoComplete="off"
              />
            </div>
            {keySaveError ? (
              <p className="text-sm text-destructive" role="alert">
                {keySaveError}
              </p>
            ) : null}
            {keySaveSuccess ? (
              <p className="text-sm text-green-600 dark:text-green-400">
                API key saved.
              </p>
            ) : null}
            <Button
              size="sm"
              onClick={() => {
                void handleSaveApiKey();
              }}
              disabled={loading || !anthropicKeyInput.trim()}
            >
              Save API key
            </Button>
          </div>
        )}

        {aiSaveError ? (
          <p className="text-sm text-destructive" role="alert">
            {aiSaveError}
          </p>
        ) : null}
        {aiSaveSuccess ? (
          <p className="text-sm text-green-600 dark:text-green-400">
            AI settings saved.
          </p>
        ) : null}

        <Button
          size="sm"
          onClick={() => {
            void handleSaveAiSettings();
          }}
          disabled={loading}
        >
          Save AI settings
        </Button>
      </CardContent>
    </Card>
  );
}

export default AiSettingsSection;
