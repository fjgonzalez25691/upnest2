import React from 'react';

const Spinner = ({ 
  variant = 'basic',     // 'basic', 'premium', 'inline'
  size = 'md',           // 'sm', 'md', 'lg', 'xl'
  color = 'primary',     // 'primary', 'blue', 'white', 'custom'
  message,               // Texto opcional (para basic e inline)
  message1,              // Línea 1 para premium (azul)
  message2,              // Línea 2 para premium
  message3,              // Línea 3 para premium
  overlay = false,       // Modal overlay para spinner premium
  particles = true,      // Solo para variant='premium'
  className = ''
}) => {
  // Size mappings
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16'
  };

  // Color mappings
  const colorClasses = {
    primary: 'border-primary',
    blue: 'border-blue-500',
    white: 'border-white',
    custom: 'border-current'
  };

  // Basic spinner component
  const BasicSpinner = () => (
    <div className={`animate-spin rounded-full border-b-2 ${colorClasses[color]} ${sizeClasses[size]} ${className}`} />
  );

  // Inline spinner with SVG
  const InlineSpinner = () => (
    <svg className={`animate-spin ${sizeClasses.sm} ${color === 'white' ? 'text-white' : 'text-blue-600'}`} viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
    </svg>
  );

  // Premium spinner (basado en el de percentiles)
  const PremiumSpinner = () => (
    <div className="mb-6 flex justify-center">
      <div className="relative">
        {/* Outer rotating ring with gradient effect */}
        <div className="w-16 h-16 rounded-full animate-spin">
          <div className="w-full h-full rounded-full border-4 border-transparent bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-border"></div>
          <div className="absolute inset-1 bg-white rounded-full"></div>
        </div>
        {/* Inner pulsing core */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-4 h-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full animate-ping"></div>
        </div>
        {/* Floating particles */}
        {particles && (
          <div className="absolute -inset-6">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce absolute top-0 left-1/2 transform -translate-x-1/2 opacity-75" style={{animationDelay: '0s'}}></div>
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce absolute top-1/2 right-0 transform -translate-y-1/2 opacity-75" style={{animationDelay: '0.2s'}}></div>
            <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce absolute bottom-0 left-1/2 transform -translate-x-1/2 opacity-75" style={{animationDelay: '0.4s'}}></div>
            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce absolute top-1/2 left-0 transform -translate-y-1/2 opacity-75" style={{animationDelay: '0.6s'}}></div>
          </div>
        )}
      </div>
    </div>
  );

  // Render different variants
  const renderSpinner = () => {
    switch (variant) {
      case 'inline':
        return <InlineSpinner />;
      case 'premium':
        return <PremiumSpinner />;
      case 'basic':
      default:
        return <BasicSpinner />;
    }
  };

  // Premium overlay wrapper
  if (variant === 'premium' && overlay) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-pink-500/20 backdrop-blur-md"
        role="alert"
        aria-busy="true"
        aria-live="assertive"
      >
        <div className="bg-white/90 backdrop-blur-sm shadow-2xl rounded-3xl p-8 border border-white/30 max-w-md w-full text-center transform animate-pulse">
          {renderSpinner()}
          
          <div className="space-y-3">
            <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {message1 || 'Processing...'}
            </h2>
            <div className="h-1 w-32 mx-auto bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 rounded-full animate-pulse"></div>
          </div>
          
          <div className="text-center space-y-3 mt-5">
            {message2 && (
              <p className="text-gray-700 text-sm leading-relaxed font-medium">
                {message2}
              </p>
            )}
            {message3 && (
              <p className="text-gray-600 text-xs leading-relaxed">
                {message3}
              </p>
            )}
          </div>
          
          <div className="mt-4 flex items-center justify-center space-x-2 text-xs text-gray-500">
            <svg className="w-4 h-4 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <span>Please don't close this tab or navigate away</span>
          </div>
        </div>
      </div>
    );
  }

  // Standard spinner with optional message
  if (message && variant !== 'inline') {
    return (
      <div className="text-center">
        {renderSpinner()}
        <p className="text-gray-600 mt-2">{message}</p>
      </div>
    );
  }

  // Inline spinner with message
  if (message && variant === 'inline') {
    return (
      <span className="flex items-center gap-2">
        {renderSpinner()}
        {message}
      </span>
    );
  }

  // Just the spinner
  return renderSpinner();
};

export default Spinner;