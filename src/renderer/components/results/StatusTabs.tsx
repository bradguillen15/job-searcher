import React from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { JobStatus, StatusTabKey } from "@/types/job";
import { formatStatusLabel } from "@/types/job";

const STATUS_TABS: { key: StatusTabKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "new", label: "New" },
  { key: "applying", label: "Applying" },
  { key: "applied", label: "Applied" },
  { key: "interviewing", label: "Interviewing" },
  { key: "offer", label: "Offer" },
  { key: "accepted", label: "Accepted" },
  { key: "rejected", label: "Rejected" },
];

interface StatusTabsProps {
  value: StatusTabKey;
  onChange: (value: StatusTabKey) => void;
}

function StatusTabs({ value, onChange }: StatusTabsProps): React.JSX.Element {
  return (
    <Tabs
      value={value}
      onValueChange={(next) => {
        if (next === "all" || STATUS_TABS.some((tab) => tab.key === next)) {
          onChange(next as StatusTabKey);
        }
      }}
    >
      <TabsList className="max-w-full overflow-x-auto">
        {STATUS_TABS.map((tab) => (
          <TabsTrigger key={tab.key} value={tab.key}>
            {tab.key === "all"
              ? tab.label
              : formatStatusLabel(tab.key as JobStatus)}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}

export default StatusTabs;
