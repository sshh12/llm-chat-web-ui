import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import * as serviceWorkerRegistration from "./serviceWorkerRegistration";
import App from "./App";

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  window.pwaInstall = event;
});

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

serviceWorkerRegistration.register();
