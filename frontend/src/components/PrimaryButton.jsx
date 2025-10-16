// .src/components/PrimaryButton.jsx
// Pourpose: A reusable primary button component for the UpNest application. Used for primary actions like submitting forms or confirming actions.

import React from "react";

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
 */
const PrimaryButton = ({
  children,
  variant = "default",
  size = "default", // New: "default", "compact"
  icon = null, // New: icon element
  iconPosition = "left", // New: "left", "right", "only"
  showIcon = true, // New: show/hide icon
  className = "",
  ...props
}) => {
  // Get base class based on size
  const getBaseClass = () => {
    return size === "compact" ? "btn-base-compact" : "btn-base";
  };

  // Render icon with proper spacing
  const renderIcon = () => {
    if (!icon || !showIcon) return null;
    
    const iconClasses = iconPosition === "only" ? "" : 
      iconPosition === "right" ? "ml-2" : "mr-2";
    
    return React.cloneElement(icon, {
      className: `w-4 h-4 ${iconClasses} ${icon.props.className || ""}`
    });
  };

  // Determine button content based on iconPosition
  const getButtonContent = () => {
    if (iconPosition === "only") {
      return renderIcon();
    }
    
    if (iconPosition === "right") {
      return (
        <>
          {children}
          {renderIcon()}
        </>
      );
    }
    
    // Default: left position or no icon
    return (
      <>
        {renderIcon()}
        {children}
      </>
    );
  };

  return (
    <button
      type={props.type || "button"}
      className={
        `${getBaseClass()} ${variantStyles[variant] || variantStyles.default} ${iconPosition === "only" ? "" : "flex items-center"} ${className}`
      }
      {...props}
    >
      {getButtonContent()}
    </button>
  );
};

export default PrimaryButton;
