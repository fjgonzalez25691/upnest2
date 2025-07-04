// src/auth/useAuthAxios.js
// Purpose: Custom Axios instance for authenticated requests in the UpNest application.
import { useAuth } from 'react-oidc-context';
import axiosClient from '../services/axiosClient.js';
import { useMemo } from 'react';

export function useAuthAxios() {
  const auth = useAuth();

  // Use useMemo to avoid adding multiple interceptors on every render
  const instance = useMemo(() => {
    const client = axiosClient; // You can clone if you prefer a separate instance

    client.interceptors.request.use(
      (cfg) => {
        // If the user is authenticated, add the token to the Authorization header
        if (auth.isAuthenticated && auth.user?.access_token) {
          cfg.headers.Authorization = `Bearer ${auth.user.access_token}`;
        }
        return cfg;
      },
      (error) => Promise.reject(error)
    );

    return client;
    // Only recreate if the token changes
  }, [auth.isAuthenticated, auth.user?.access_token]);

  return instance;
}