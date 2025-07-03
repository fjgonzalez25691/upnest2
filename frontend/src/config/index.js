// Configuration manager for different environments
export const config = {
  // API Configuration
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'https://8l68gypmvb.execute-api.eu-south-2.amazonaws.com/Prod',
  
  // Cognito Configuration
  cognito: {
    userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID || 'eu-south-2_WInbcDDjo',
    clientId: import.meta.env.VITE_COGNITO_CLIENT_ID || '75g0r5a7bbp1mgpmqrg3e1iibm',
    domain: import.meta.env.VITE_COGNITO_DOMAIN || 'eu-south-2winbcddjo.auth.eu-south-2.amazoncognito.com',
    region: import.meta.env.VITE_AWS_REGION || 'eu-south-2',
  },
  
  // Redirect URLs
  redirectUrls: {
    signIn: import.meta.env.VITE_REDIRECT_SIGN_IN || window.location.origin,
    signOut: import.meta.env.VITE_REDIRECT_SIGN_OUT || window.location.origin,
    silentRenew: import.meta.env.VITE_REDIRECT_SILENT_RENEW || window.location.origin,
  },
  
  // Environment flags
  isDevelopment: import.meta.env.VITE_DEV_MODE === 'true',
  isDebugMode: import.meta.env.VITE_DEBUG === 'true',
  
  // Current environment
  environment: import.meta.env.MODE || 'development',
  
  // Logging configuration
  logging: {
    level: import.meta.env.VITE_DEBUG === 'true' ? 'debug' : 'info',
    console: import.meta.env.VITE_DEV_MODE === 'true',
  }
};

// Helper functions
export const isProduction = () => config.environment === 'production';
export const isStaging = () => config.environment === 'staging';
export const isDevelopment = () => config.environment === 'development';

// Log configuration on startup (only in development)
if (config.isDevelopment) {
  console.log('🔧 App Configuration:', {
    environment: config.environment,
    apiBaseUrl: config.apiBaseUrl,
    isDevelopment: config.isDevelopment,
    isDebugMode: config.isDebugMode,
  });
}

export default config;
