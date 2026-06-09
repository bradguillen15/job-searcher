import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface ProfileRecord {
  id: string;
  name: string;
  lastUsedAt?: string;
  active?: boolean;
}

interface ProfileView {
  id: string;
  name: string;
  active: boolean;
}

function mapProfiles(records: ProfileRecord[]): ProfileView[] {
  if (records.length === 0) {
    return [];
  }

  const explicitActive = records.find((profile) => profile.active === true);
  const activeId =
    explicitActive?.id ??
    records.reduce((latestId, profile) => {
      const latestProfile = records.find((p) => p.id === latestId);
      if (!latestProfile?.lastUsedAt || !profile.lastUsedAt) {
        return latestId;
      }
      return profile.lastUsedAt > latestProfile.lastUsedAt ? profile.id : latestId;
    }, records[0]?.id ?? "");

  return records.map((profile) => ({
    id: profile.id,
    name: profile.name,
    active: profile.id === activeId,
  }));
}

function ProfileSwitcher(): React.JSX.Element {
  const [profiles, setProfiles] = useState<ProfileView[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadProfiles(): Promise<void> {
      try {
        const result = await window.api.invoke("profiles:list");
        if (cancelled) {
          return;
        }
        const records = result as ProfileRecord[];
        setProfiles(mapProfiles(records));
        setError(null);
      } catch {
        if (!cancelled) {
          setError("Unable to load profiles");
          setProfiles([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadProfiles();

    return () => {
      cancelled = true;
    };
  }, []);

  const activeProfile = useMemo(
    () => profiles.find((profile) => profile.active) ?? profiles[0],
    [profiles]
  );

  const handleSwitch = useCallback(async (profileId: string): Promise<void> => {
    try {
      await window.api.invoke("profiles:switch", profileId);
      window.location.reload();
    } catch {
      setError("Unable to switch profile");
    }
  }, []);

  if (error !== null) {
    return (
      <div
        className={cn(
          "px-3 py-2 text-sm text-destructive [-webkit-app-region:no-drag]"
        )}
        role="alert"
      >
        {error}
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={loading}
        className={cn(
          "flex w-full items-center justify-between rounded-md px-3 py-2 text-sm",
          "text-foreground hover:bg-background/50 [-webkit-app-region:no-drag]"
        )}
      >
        <span className="truncate">{activeProfile?.name ?? "Profile"}</span>
        <ChevronDown className="size-4 shrink-0 opacity-70" aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[var(--sidebar-width)]">
        {profiles.map((profile) => (
          <DropdownMenuItem
            key={profile.id}
            onClick={() => {
              if (!profile.active) {
                void handleSwitch(profile.id);
              }
            }}
          >
            {profile.name}
            {profile.active ? " (active)" : ""}
          </DropdownMenuItem>
        ))}
        <DropdownMenuItem disabled>New profile</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default ProfileSwitcher;
