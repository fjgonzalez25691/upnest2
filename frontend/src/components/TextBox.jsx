// src/components/TextBox.jsx
import React from "react";

/**
 * TextBox: Versatile component for input, select, or read-only display.
 * @param {string} labelPosition - Position of label: "top" (default), "inline", "none"
 * @param {string} size - Size variant: "default", "compact"
 */
const TextBox = ({
  label,
  name,
  value,
  onChange,
  editable = false,
  type = "text",
  options = [],
  required = false,
  disabled = false,
  readOnly = false,
  placeholder = "",
  suffix,
  error,
  className = "",
  renderValue,
  labelPosition = "top", // New: "top", "inline", "none"
  size = "default", // New: "default", "compact"
  ...props
}) => {
  // Determines the base class according to type and state
  const getTextboxClasses = () => {
    let baseClass = "";
    
    if (!editable) {
      baseClass = "textbox-readonly";
    } else if (type === "number") {
      baseClass = "textbox-input-edit-number";
    } else if (type === "select") {
      baseClass = size === "compact" ? "textbox-select-compact" : "textbox-select";
    } else {
      baseClass = "textbox-input-edit";
    }
    
    return `${baseClass} ${className}`;
  };

  // Maps type to read-only background class
  const typeToBgClass = {
    number: "textbox-bg-number",
    date: "textbox-bg-date",
    select: "textbox-bg-select",
    string: "textbox-bg-string",
    text: "textbox-bg-string",
    default: "textbox-bg-default"
  };

  // Render label based on position
  const renderLabel = () => {
    if (!label || labelPosition === "none") return null;
    
    return (
      <label htmlFor={name} className={`textbox-label${required ? " textbox-label-required" : ""} ${labelPosition === "inline" ? "whitespace-nowrap" : ""}`}>
        {label}
      </label>
    );
  };

  // Main container class based on label position
  const containerClass = labelPosition === "inline" ? "flex items-center gap-3" : "textbox-group";

  return (
    <div className={containerClass}>
      {labelPosition === "top" && renderLabel()}
      {labelPosition === "inline" && renderLabel()}

      {/* Editable field */}
      {editable ? (
        type === "select" ? (
          <select
            id={name}
            name={name}
            value={value}
            onChange={onChange}
            required={required}
            disabled={disabled}
            className={getTextboxClasses()}
            {...props}
          >
            <option value="">Select...</option>
            {options.map(opt =>
              typeof opt === "object" ? (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ) : (
                <option key={opt} value={opt}>{opt}</option>
              )
            )}
          </select>
        ) : (
          <div className="relative">
            <input
              id={name}
              name={name}
              type={type}
              value={value}
              onChange={onChange}
              placeholder={placeholder}
              required={required}
              disabled={disabled}
              readOnly={readOnly}
              className={getTextboxClasses()}
              {...props}
            />
            {suffix && <span className="textbox-suffix">{suffix}</span>}
          </div>
        )
      ) : (
        // Read-only visual block
        <div className={`textbox-readonly-block ${typeToBgClass[type] || typeToBgClass.default}`}>
          <span>
            {renderValue
              ? renderValue(value)
              : (value || <span className="text-gray-400">Not set</span>)}
          </span>
        </div>
      )}

      {error && <p className="textbox-error-message">{error}</p>}
    </div>
  );
};

export default TextBox;