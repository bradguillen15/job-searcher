import { createHashRouter } from "react-router-dom";
import AppShell from "@/components/AppShell";
import ScoutScreen from "@/screens/ScoutScreen";
import ResultsScreen from "@/screens/ResultsScreen";
import PipelineScreen from "@/screens/PipelineScreen";
import BoardsScreen from "@/screens/BoardsScreen";
import ResumeScreen from "@/screens/ResumeScreen";
import SettingsScreen from "@/screens/SettingsScreen";

export const router = createHashRouter([
  {
    path: "/",
    element: <AppShell />,
    children: [
      { index: true, element: <ScoutScreen /> },
      { path: "results", element: <ResultsScreen /> },
      { path: "pipeline", element: <PipelineScreen /> },
      { path: "boards", element: <BoardsScreen /> },
      { path: "resume", element: <ResumeScreen /> },
      { path: "settings", element: <SettingsScreen /> },
    ],
  },
]);
