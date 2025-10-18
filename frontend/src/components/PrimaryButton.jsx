// .src/components/PrimaryButton.jsx
// Pourpose: A reusable primary button component for the UpNest application. Used for primary actions like submitting forms or confirming actions.

import React from "react";
import Spinner from "./Spinner";

const variantStyles = {
  primary: "btn-primary",
  cancel: "btn-cancel",
  add: "btn-add",
  edit: "btn-edit",
  success: "btn-success",
  ai: "btn-ai",
  danger: "btn-danger",
  logout: "btn-logout",
  default: "btn-primary",
};

/**
 * PrimaryButton component with size variants
 * @param {string} size - Size variant: "default", "compact"
 * @param {JSX.Element} icon - Icon element to display
 * @param {string} iconPosition - Icon position: "left", "right", "only"
 * @param {boolean} showIcon - Whether to show icon (for backward compatibility)
 * @param {boolean} isLoading - Show loading spinner and disable button
 * @param {string} loadingText - Text to show when loading (optional)
 */
const PrimaryButton = ({
  children,
  variant = "default",
  size = "default", // New: "default", "compact"
  icon = null, // New: icon element
  iconPosition = "left", // New: "left", "right", "only"
  showIcon = true, // New: show/hide icon
  isLoading = false, // New: loading state
  loadingText = null, // New: optional loading text
  className = "",
  ...props
}) => {
  // Get base class based on size
  const getBaseClass = () => {
    return size === "compact" ? "btn-base-compact" : "btn-base";
  };

  // Render icon with proper spacing (or loading spinner)
  const renderIcon = () => {
    // Show loading spinner instead of icon when loading
    if (isLoading) {
      const spinnerClasses = iconPosition === "only" ? "" : 
        iconPosition === "right" ? "ml-2" : "mr-2";
      return (
        <Spinner 
          variant="inline" 
          color="white" 
          className={spinnerClasses}
        />
      );
    }
    
    if (!icon || !showIcon) return null;
    
    const iconClasses = iconPosition === "only" ? "" : 
      iconPosition === "right" ? "ml-2" : "mr-2";
    
    return React.cloneElement(icon, {
      className: `w-4 h-4 ${iconClasses} ${icon.props.className || ""}`
    });
  };

  // Determine button content based on iconPosition and loading state
  const getButtonContent = () => {
    const displayText = isLoading && loadingText ? loadingText : children;
    
    if (iconPosition === "only") {
      return renderIcon();
    }
    
    if (iconPosition === "right") {
      return (
        <>
          {displayText}
          {renderIcon()}
        </>
      );
    }
    
    // Default: left position or no icon
    return (
      <>
        {renderIcon()}
        {displayText}
      </>
    );
  };

  return (
    <button
      type={props.type || "button"}
      disabled={isLoading || props.disabled} // Disable when loading or explicitly disabled
      className={
        `${getBaseClass()} ${variantStyles[variant] || variantStyles.default} ${iconPosition === "only" ? "" : "flex items-center justify-center"} ${className}`
      }
      {...props}
    >
      {getButtonContent()}
    </button>
  );
};

export default PrimaryButton;
