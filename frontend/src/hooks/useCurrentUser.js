// src/hooks/useCurrentUser.js
import { useAuth } from "react-oidc-context";

/**
 * Custom hook to get current user information
 * Returns user data including the sub (user ID) for database operations
 */
export const useCurrentUser = () => {
  const auth = useAuth();

  const getCurrentUserId = () => {
    return auth.user?.profile?.sub || null;
  };

  const getCurrentUserEmail = () => {
    return auth.user?.profile?.email || null;
  };

  const getCurrentUserName = () => {
    const profile = auth.user?.profile;
    if (!profile) return null;
    
    // Try different name fields in order of preference
    return profile.name || 
           profile.given_name || 
           profile.family_name || 
           profile.preferred_username ||
           (profile.email ? profile.email.split('@')[0] : null);
  };

  const isAuthenticated = auth.isAuthenticated;
  const isLoading = auth.isLoading;

  return {
    userId: getCurrentUserId(),
    email: getCurrentUserEmail(),
    name: getCurrentUserName(),
    isAuthenticated,
    isLoading,
    user: auth.user,
    // Helper methods
    getCurrentUserId,
    getCurrentUserEmail,
    getCurrentUserName
  };
};
