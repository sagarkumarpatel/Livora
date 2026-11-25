import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "@fortawesome/fontawesome-free/css/all.min.css";
import "leaflet/dist/leaflet.css";
import "./styles/app.css";

import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import { FlashProvider } from "./context/FlashContext";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <FlashProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </FlashProvider>
    </BrowserRouter>
  </StrictMode>
);
