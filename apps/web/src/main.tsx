import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "./index.css";
import App from "./App.tsx";
import { getAppEnv } from "./config/env";
import { initializeFirebasePlatform } from "./infrastructure/firebase";

// Firebase platform foundation (ENG-P1-001) — initialized once at boot,
// before anything renders. No business logic depends on this yet; it
// establishes the shared app/auth/firestore/storage/App Check instances
// future domain services will reuse.
initializeFirebasePlatform(getAppEnv());

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
