// .src/components/PrimaryButton.jsx
// Purpose: A reusable primary button component for the UpNest application. Used for primary actions like submitting forms or confirming actions.

import React from "react";

const variantClasses = {
  primary: "btn-base btn-primary",
  add: "btn-base btn-add",
  success: "btn-base btn-success",
  danger: "btn-base btn-danger",
  ai: "btn-base btn-ai",
  cancel: "btn-base btn-cancel",
  default: "btn-base btn-primary"
};

const PrimaryButton = ({
  children,
  variant = "default",
  className = "",
  ...props
}) => (
  <button
    type={props.type || "button"}
    className={`${variantClasses[variant] || variantClasses.default} ${className}`}
    {...props}
  >
    {children}
  </button>
);

export default PrimaryButton;
