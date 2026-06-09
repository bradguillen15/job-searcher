import React from "react";
import AiSettingsSection from "@/components/settings/AiSettingsSection";
import AppearanceSection from "@/components/settings/AppearanceSection";
import DataSection from "@/components/settings/DataSection";
import ScoutDefaultsSection from "@/components/settings/ScoutDefaultsSection";

function SettingsScreen(): React.JSX.Element {
  return (
    <div className="flex flex-col gap-6 p-6">
      <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
      <AppearanceSection />
      <ScoutDefaultsSection />
      <AiSettingsSection />
      <DataSection />
    </div>
  );
}

export default SettingsScreen;
