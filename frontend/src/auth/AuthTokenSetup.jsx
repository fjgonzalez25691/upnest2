// src/auth/AuthTokenSetup.jsx
import { useEffect } from 'react';
import { useAuth } from 'react-oidc-context';
import { setAuthToken } from '../services/axiosClient';

/**
 * Component to automatically set authentication token in axios client
 * This should be used at the app level to ensure all API calls are authenticated
 */
export const AuthTokenSetup = () => {
    const auth = useAuth();

    useEffect(() => {
        if (auth.user?.id_token) {
            // Set the token in axios client
            setAuthToken(auth.user.id_token);
            console.log('✅ Auth token set in axios client:', auth.user.id_token.substring(0, 20) + '...');
        } else {
            // Clear token if user is not authenticated
            setAuthToken(null);
            console.log('❌ Auth token cleared from axios client');
        }
    }, [auth.user?.id_token]);

    // This component doesn't render anything
    return null;
};

export default AuthTokenSetup;
