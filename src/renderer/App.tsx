import React from "react";
import { useTranslation } from "react-i18next";

function App(): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <div className="app">
      <h1>{t("app.title")}</h1>
    </div>
  );
}

export default App;
