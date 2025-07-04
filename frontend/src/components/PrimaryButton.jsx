// .src/components/PrimaryButton.jsx
// Pourpose: A reusable primary button component for the UpNest application. Used for primary actions like submitting forms or confirming actions.

import React from "react";

const variantStyles = {
  save:
    "[background:var(--color-primary)] text-white " +
    "hover:[background:color-mix(in_srgb,var(--color-primary)80%,black_20%)]",
  cancel:
    "[background:var(--color-cancel)] text-white " +
    "hover:[background:color-mix(in_srgb,var(--color-cancel)80%,black_20%)]",
  danger:
    "[background:var(--color-danger)] text-white " +
    "hover:[background:color-mix(in_srgb,var(--color-danger)80%,black_20%)]",
  default:
    "[background:var(--color-primary)] text-white " +
    "hover:[background:color-mix(in_srgb,var(--color-primary)80%,black_20%)]",
  blue: 
    "bg-gradient-to-r from-blue-500 to-blue-600 text-white border border-blue-400 " +
    "hover:from-blue-600 hover:to-blue-700 hover:border-blue-500",
  purple:
    "bg-gradient-to-r from-purple-500 to-purple-600 text-white border border-purple-400 " +
    "hover:from-purple-600 hover:to-purple-700 hover:border-purple-500",
  green:
    "bg-gradient-to-r from-green-500 to-green-600 text-white border border-green-400 " +
    "hover:from-green-600 hover:to-green-700 hover:border-green-500",
  emerald:
    "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white border border-emerald-400 " +
    "hover:from-emerald-600 hover:to-emerald-700 hover:border-emerald-500",
  red:
    "bg-gradient-to-r from-red-500 to-red-600 text-white border border-red-400 " +
    "hover:from-red-600 hover:to-red-700 hover:border-red-500",
  gray:
    "bg-gradient-to-r from-gray-500 to-gray-600 text-white border border-gray-400 " +
    "hover:from-gray-600 hover:to-gray-700 hover:border-gray-500"
};
;


const PrimaryButton = ({
  children,
  variant = "default",
  className = "",
  ...props
}) => (
  <button
    type={props.type || "button"}
    className={
      `rounded-xl px-6 py-4 font-semibold transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${variantStyles[variant] || variantStyles.default} ${className}`
    }
    {...props}
  >
    {children}
  </button>
);

export default PrimaryButton;
