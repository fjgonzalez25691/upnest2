import React from "react";
import { useAuth } from "react-oidc-context";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ element }) => {
  const auth = useAuth();

  if (auth.isLoading) {
    return <div>Loading...</div>;
  }

  if (!auth.isAuthenticated) {
    // Redirige a la página de login o landing si no está autenticado
    return <Navigate to="/" replace />;
  }

  return element;
};

export default ProtectedRoute;