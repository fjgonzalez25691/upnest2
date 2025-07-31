// src/components/TextBox.jsx
import React from "react";

/**
 * TextBox: Versatile component for input, select, or read-only display.
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
  ...props
}) => {
  // Determines the base class according to type and state
  const getTextboxClasses = () => {
    if (!editable) return `textbox-readonly ${className}`;
    if (type === "number") return `textbox-input-edit-number ${className}`;
    if (type === "select") return `textbox-select ${className}`;
    return `textbox-input-edit ${className}`;
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

  return (
    <div className="textbox-group">
      {label && (
        <label htmlFor={name} className={`textbox-label${required ? " textbox-label-required" : ""}`}>
          {label}
        </label>
      )}

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