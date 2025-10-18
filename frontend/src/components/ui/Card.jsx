import React from 'react';
import clsx from 'clsx';

/**
 * Card Component - Flexible card container with multiple variants
 * 
 * @param {Object} props - Component props
 * @param {'elevated'|'interactive'|'basic'|'compact'} props.variant - Card style variant
 * @param {'default'|'success'|'danger'|'secondary'|'neutral'} props.color - Border color variant
 * @param {boolean} props.bordered - Add border (default: true for elevated)
 * @param {string} props.className - Additional CSS classes
 * @param {React.ReactNode} props.children - Card content
 * @param {React.ReactNode} props.header - Card header content
 * @param {React.ReactNode} props.actions - Card actions content
 * @param {boolean} props.interactive - Enable hover effects
 * @param {Function} props.onClick - Click handler for interactive cards
 */
const Card = ({
  variant = 'elevated',
  color = 'default',
  bordered = variant === 'elevated' || variant === 'compact',
  className,
  children,
  header,
  actions,
  interactive = variant === 'interactive',
  onClick,
  ...props
}) => {
  // Base class mapping
  const variantClasses = {
    elevated: 'card-elevated',
    interactive: 'card-interactive', 
    basic: 'card-basic',
    compact: 'card-compact'
  };

  // Color class mapping for bordered cards
  const colorClasses = {
    default: bordered ? '--bordered' : '',
    success: '--success',
    danger: '--danger', 
    secondary: '--secondary',
    neutral: '--neutral'
  };

  // Build the CSS class string
  const cardClass = clsx(
    variantClasses[variant],
    bordered && colorClasses[color] && `${variantClasses[variant]}${colorClasses[color]}`,
    interactive && 'cursor-pointer',
    className
  );

  return (
    <div 
      className={cardClass}
      onClick={onClick}
      {...props}
    >
      {header && (
        <div className="card__header">
          {header}
        </div>
      )}
      
      <div className="card__content">
        {children}
      </div>
      
      {actions && (
        <div className="card__actions">
          {actions}
        </div>
      )}
    </div>
  );
};

// Pre-configured card variants for common use cases
export const ElevatedCard = (props) => (
  <Card variant="elevated" {...props} />
);

export const InteractiveCard = (props) => (
  <Card variant="interactive" {...props} />
);

export const BasicCard = (props) => (
  <Card variant="basic" {...props} />
);

export const CompactCard = (props) => (
  <Card variant="compact" {...props} />
);

// Header component for consistent card headers
export const CardHeader = ({ title, subtitle, icon, className, ...props }) => (
  <div className={clsx("card__header", className)} {...props}>
    <div className="text-center">
      {icon && <div className="text-4xl mb-2">{icon}</div>}
      {title && <h1 className="card__title">{title}</h1>}
      {subtitle && <p className="card__subtitle">{subtitle}</p>}
    </div>
  </div>
);

export default Card;