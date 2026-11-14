import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource-variable/hanken-grotesk";
import "./styles/tokens.css";
import "./styles/base.css";
import App from "./App";
import { Provider } from "jotai";
import { appStore } from "./store/appStore";
// Loaded here for its listeners, so every page follows a live change of the
// system theme, also a page that shows no theme switch.
import "./store/themeAtoms";
import { wireApi } from "./store/wireApi";

// Before the first render: a stored token that has run out is ended here.
wireApi();

const rootElement = document.getElementById("root");

if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <Provider store={appStore}>
        <App />
      </Provider>
    </StrictMode>,
  );
}
