import React, { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { getResume, ResumeDbError } from "@/lib/resume-db";
import { cn } from "@/lib/utils";
import type { Resume } from "@/types/resume";

type ResumeUploadResult =
  | { cancelled: true }
  | { resume: Resume }
  | { error: string };

function formatUploadDate(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return isoDate;
  }
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function ResumeScreen(): React.JSX.Element {
  const [resume, setResume] = useState<Resume | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const refreshResume = useCallback(async (): Promise<void> => {
    const row = await getResume();
    setResume(row);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadResume(): Promise<void> {
      try {
        const row = await getResume();
        if (!cancelled) {
          setResume(row);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          const message =
            err instanceof ResumeDbError
              ? err.message
              : "Unable to load resume";
          setError(message);
          setResume(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadResume();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleUpload = useCallback(async (): Promise<void> => {
    setUploading(true);
    setError(null);

    try {
      const result = (await window.api.invoke(
        "resume:upload"
      )) as ResumeUploadResult;

      if ("cancelled" in result && result.cancelled) {
        return;
      }

      if ("error" in result && result.error) {
        setError(result.error);
        return;
      }

      if ("resume" in result && result.resume) {
        await refreshResume();
        setError(null);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to upload resume"
      );
    } finally {
      setUploading(false);
    }
  }, [refreshResume]);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Resume</h1>
        {!loading && resume !== null ? (
          <Button
            type="button"
            disabled={uploading}
            onClick={() => {
              void handleUpload();
            }}
          >
            {uploading ? "Uploading…" : "Replace resume"}
          </Button>
        ) : null}
      </div>

      {error !== null ? (
        <div
          className={cn(
            "rounded-md border border-destructive/40 px-3 py-2 text-sm text-destructive"
          )}
          role="alert"
        >
          {error}
        </div>
      ) : null}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading resume…</p>
      ) : resume === null ? (
        <div className="space-y-4 rounded-lg border border-border p-6">
          <p className="text-sm text-muted-foreground">
            No resume uploaded yet. Upload a PDF, DOCX, or TXT file to get
            started.
          </p>
          <Button
            type="button"
            disabled={uploading}
            onClick={() => {
              void handleUpload();
            }}
          >
            {uploading ? "Uploading…" : "Upload resume"}
          </Button>
        </div>
      ) : (
        <div className="space-y-6 rounded-lg border border-border p-6">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Filename</p>
            <p className="text-lg font-semibold">{resume.filename}</p>
          </div>

          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">
              Upload date
            </p>
            <p className="text-sm">{formatUploadDate(resume.updated_at)}</p>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">
              Skill profile
            </p>
            {resume.skill_profile !== null ? (
              <p className="whitespace-pre-wrap text-sm">{resume.skill_profile}</p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Skill profile not yet available. It will be generated after AI
                matching is configured.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ResumeScreen;
