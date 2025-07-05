import React from "react";
import { useAuth } from "react-oidc-context";
import { Route, Routes } from "react-router-dom";

// Components
import Header from "./components/Header.jsx";
import Footer from "./components/Footer.jsx";
import AuthTokenSetup from "./auth/AuthTokenSetup.jsx";

// Auth
import ProtectedRoute from "./auth/ProtectedRoute.jsx";

// Pages
import Landing from "./pages/Landing.jsx";
import Dashboard from "./pages/Dashboard.jsx";

export default function App() {
  return (
    <>
      <AuthTokenSetup />
      <Header />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/dashboard" element={<ProtectedRoute element={<Dashboard />} />} />
        {/* Puedes agregar más rutas protegidas aquí */}
      </Routes>
      <Footer />
    </>
  );
}
