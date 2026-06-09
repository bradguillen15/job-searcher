import React from "react";
import ReactDOM from "react-dom/client";
import "./i18n";
import { applyInitialTheme } from "./hooks/theme";
import "./styles/globals.css";
import App from "./App";

applyInitialTheme();

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element #root not found in DOM");
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
