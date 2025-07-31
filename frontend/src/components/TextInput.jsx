// src/components/ui/TextInput.jsx
import React from 'react';

const TextInput = ({
  label,
  name,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
  disabled = false,
  readOnly = false,
  variant = 'default', // 'default', 'numeric', 'edit', 'edit-numeric'
  error,
  suffix,
  min,
  max,
  className = '',
  ...props
}) => {
  // Elige la clase según el tipo de input
  const getInputClasses = () => {
    if (readOnly) return `input-readonly ${className}`;
    switch (variant) {
      case 'numeric':
        return `input-numeric ${className}`;
      case 'edit':
        return `input-edit ${className}`;
      case 'edit-numeric':
        return `input-edit-numeric ${className}`;
      default:
        return `input-default ${className}`;
    }
  };

  return (
    <div className="input-group">
      {label && (
        <label
          htmlFor={name}
          className={`input-label${required ? ' input-label-required' : ''}`}
        >
          {label}
        </label>
      )}
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
          min={min}
          max={max}
          className={getInputClasses()}
          {...props}
        />
        {suffix && (
          <span className="input-suffix">{suffix}</span>
        )}
      </div>
      {error && (
        <p className="input-error-message">{error}</p>
      )}
    </div>
  );
};

export default TextInput;