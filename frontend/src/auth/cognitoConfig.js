// AWS Cognito configuration for React
import { config } from "../config/index.js";

export const cognitoConfig = {
  // Authority using the Cognito Identity Provider
  authority: `https://cognito-idp.${config.cognito.region}.amazonaws.com/${config.cognito.userPoolId}`,

  // App Client ID
  client_id: config.cognito.clientId,
  
  // Redirect URIs - Use configuration manager
  redirect_uri: config.redirectUrls?.signIn || config.redirectSignIn,
  post_logout_redirect_uri: config.redirectUrls?.signOut || config.redirectSignOut,
  silent_redirect_uri: config.redirectUrls?.silentRenew || config.redirectSilentRenew,
  
  // OAuth configuration
  response_type: 'code',
  scope: 'email openid profile',
  
  // Additional configuration
  automaticSilentRenew: true,
  loadUserInfo: true,
  
  // Cognito domain
  cognitoDomain: `https://${config.cognito.domain}`,
  
  // Manual metadata configuration (required for AWS Cognito)
  metadata: {
    issuer: `https://cognito-idp.${config.cognito.region}.amazonaws.com/${config.cognito.userPoolId}`,
    authorization_endpoint: `https://${config.cognito.domain}/oauth2/authorize`,
    token_endpoint: `https://${config.cognito.domain}/oauth2/token`,
    userinfo_endpoint: `https://${config.cognito.domain}/oauth2/userInfo`,
    end_session_endpoint: `https://${config.cognito.domain}/logout`,
    jwks_uri: `https://cognito-idp.${config.cognito.region}.amazonaws.com/${config.cognito.userPoolId}/.well-known/jwks.json`
  }
};
