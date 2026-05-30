import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { WalletProvider, useWallet } from "./context/WalletContext";

import LandingPage from "./pages/LandingPage";
import DashboardPage from "./pages/DashboardPage";
import IssuerPage from "./pages/IssuerPage";
import VerifierPage from "./pages/VerifierPage";
import ProfilePage from "./pages/ProfilePage";
import ActivityPage from "./pages/ActivityPage";

const ProtectedRoute = ({ children }) => {
  const { isConnected } = useWallet();
  return isConnected ? children : <Navigate to="/" replace />;
};

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<LandingPage />} />
    <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
    <Route path="/issuer" element={<ProtectedRoute><IssuerPage /></ProtectedRoute>} />
    <Route path="/verifier" element={<VerifierPage />} />
    <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
    <Route path="/activity" element={<ProtectedRoute><ActivityPage /></ProtectedRoute>} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

export default function App() {
  return (
    <WalletProvider>
      <BrowserRouter>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "#091420",
              color: "#fff",
              border: "1px solid rgba(0,229,207,0.2)",
              fontFamily: "JetBrains Mono, monospace",
              fontSize: "13px",
            },
            success: { iconTheme: { primary: "#00e5cf", secondary: "#020408" } },
            error: { iconTheme: { primary: "#ef4444", secondary: "#020408" } },
          }}
        />
      </BrowserRouter>
    </WalletProvider>
  );
}
