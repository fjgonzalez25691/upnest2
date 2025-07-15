"""
JWT token validation utilities for Cognito authentication.
Validates JWT tokens and extracts user information.
"""

import jwt
import json
import requests
from typing import Dict, Any, Optional
import os
import logging
from urllib.parse import urljoin
from functools import lru_cache

logger = logging.getLogger(__name__)

class JWTValidator:
    """JWT token validator for AWS Cognito."""
    
    def __init__(self):
        """Initialize JWT validator with Cognito configuration."""
        self.user_pool_id = os.environ.get('COGNITO_USER_POOL_ID')
        self.client_id = os.environ.get('COGNITO_CLIENT_ID')
        self.region = os.environ.get('COGNITO_REGION', 'eu-south-2')
        
        if not self.user_pool_id or not self.client_id:
            raise ValueError("Missing Cognito configuration environment variables")
        
        self.jwks_url = f"https://cognito-idp.{self.region}.amazonaws.com/{self.user_pool_id}/.well-known/jwks.json"
        self.issuer = f"https://cognito-idp.{self.region}.amazonaws.com/{self.user_pool_id}"
    
    @lru_cache(maxsize=1)
    def get_jwks(self) -> Dict[str, Any]:
        """Get JWKS (JSON Web Key Set) from Cognito."""
        try:
            response = requests.get(self.jwks_url, timeout=10)
            response.raise_for_status()
            return response.json()
        except requests.RequestException as e:
            logger.error(f"Error fetching JWKS: {e}")
            raise
    
    def get_public_key(self, token_header: Dict[str, Any]) -> str:
        """Get public key for token verification."""
        jwks = self.get_jwks()
        kid = token_header.get('kid')
        
        for key in jwks.get('keys', []):
            if key['kid'] == kid:
                return jwt.algorithms.RSAAlgorithm.from_jwk(json.dumps(key))
        
        raise ValueError(f"Unable to find public key for kid: {kid}")
    
    def validate_token(self, token: str) -> Dict[str, Any]:
        """
        Validate JWT token and return user information.
        
        Args:
            token: JWT token string
            
        Returns:
            Dict containing user information (sub, email, etc.)
            
        Raises:
            ValueError: If token is invalid
        """
        try:
            # Decode header without verification to get kid
            unverified_header = jwt.get_unverified_header(token)
            
            # Get public key
            public_key = self.get_public_key(unverified_header)
            
            # Verify and decode token
            payload = jwt.decode(
                token,
                public_key,
                algorithms=['RS256'],
                audience=self.client_id,
                issuer=self.issuer
            )
            
            # Validate token type
            token_use = payload.get('token_use')
            if token_use not in ['access', 'id']:
                raise ValueError(f"Invalid token use: {token_use}")
            
            return payload
            
        except jwt.ExpiredSignatureError:
            raise ValueError("Token has expired")
        except jwt.InvalidTokenError as e:
            raise ValueError(f"Invalid token: {str(e)}")
        except Exception as e:
            logger.error(f"Error validating token: {e}")
            raise ValueError("Token validation failed")
    
    def extract_user_id(self, token: str) -> str:
        """
        Extract user ID (sub) from JWT token.
        
        Args:
            token: JWT token string
            
        Returns:
            User ID (Cognito sub)
        """
        payload = self.validate_token(token)
        user_id = payload.get('sub')
        
        if not user_id:
            raise ValueError("Token does not contain user ID")
        
        return user_id
    
    def extract_user_info(self, token: str) -> Dict[str, Any]:
        """
        Extract complete user information from JWT token.
        
        Args:
            token: JWT token string
            
        Returns:
            Dict with user information (sub, email, name, etc.)
        """
        payload = self.validate_token(token)
        
        return {
            'user_id': payload.get('sub'),
            'email': payload.get('email'),
            'name': payload.get('name'),
            'email_verified': payload.get('email_verified'),
            'token_use': payload.get('token_use'),
            'auth_time': payload.get('auth_time'),
            'exp': payload.get('exp')
        }

def extract_token_from_event(event: Dict[str, Any]) -> Optional[str]:
    """
    Extract JWT token from API Gateway event.
    
    Args:
        event: API Gateway event
        
    Returns:
        JWT token string or None if not found
    """
    # Check Authorization header
    headers = event.get('headers', {})
    auth_header = headers.get('Authorization') or headers.get('authorization')
    
    if auth_header and auth_header.startswith('Bearer '):
        return auth_header[7:]  # Remove 'Bearer ' prefix
    
    # Check query parameters as fallback
    query_params = event.get('queryStringParameters') or {}
    return query_params.get('token')

# Global instance (lazy loading)
_jwt_validator = None

def get_jwt_validator():
    global _jwt_validator
    if _jwt_validator is None:
        _jwt_validator = JWTValidator()
    return _jwt_validator
