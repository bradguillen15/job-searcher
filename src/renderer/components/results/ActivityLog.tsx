import React from "react";
import type { Activity } from "@/types/job";

interface ActivityLogProps {
  activities: Activity[];
  loading?: boolean;
}

function formatActivityText(activity: Activity): string {
  if (activity.type === "status_change") {
    return `Status: ${activity.notes ?? ""}`;
  }
  return activity.notes ?? "";
}

function ActivityLog({
  activities,
  loading = false,
}: ActivityLogProps): React.JSX.Element {
  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading activities…</p>;
  }

  if (activities.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No activities yet.</p>
    );
  }

  return (
    <ul className="space-y-2">
      {activities.map((activity) => (
        <li key={activity.id} className="text-sm">
          <span className="font-mono text-xs text-muted-foreground">
            {new Date(activity.created_at).toLocaleString()}
          </span>
          <p>{formatActivityText(activity)}</p>
        </li>
      ))}
    </ul>
  );
}

export default ActivityLog;
