// .src/components/PrimaryButton.jsx
// Pourpose: A reusable primary button component for the UpNest application. Used for primary actions like submitting forms or confirming actions.
/*
- 🔵 **primary** — Ver/editar
- 🟢 **add** — Crear/agregar
- 🟢 **success** — Confirmaciones
- 🟢 **ai** — AI Assistant
- 🔴 **danger** — Eliminar
- ⚫ **cancel** — Cancelar
*/


import React from "react";

const variantStyles = {
  primary: "btn-primary",
  cancel: "btn-cancel",
  add: "btn-add",
  edit: "btn-edit",
  success: "btn-success",
  ai: "btn-ai",
  danger: "btn-danger",
  default: "btn-primary",
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
      `btn-base ${variantStyles[variant] || variantStyles.default} ${className}`
    }
    {...props}
  >
    {children}
  </button>
);

export default PrimaryButton;
