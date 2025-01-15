import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import LogRocket from 'logrocket';
import { getDeviceId } from './lib/deviceId';
import App from './App';
import "./index.css";

LogRocket.init('personal-s2guh/pairmaster');

// Get deviceId and identify user
getDeviceId().then(deviceId => {
  LogRocket.identify(deviceId);
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      <Toaster />
    </QueryClientProvider>
  </StrictMode>,
);
