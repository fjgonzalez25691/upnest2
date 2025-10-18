import React from 'react';

/**
 * Skeleton loading component for displaying loading states
 * @param {string} variant - Type of skeleton: 'text', 'avatar', 'button', 'card', 'custom'
 * @param {string} size - Size variant: 'sm', 'md', 'lg', 'xl'
 * @param {string} width - Width variant for text: 'quarter', 'half', 'three-quarters', 'full'
 * @param {string} className - Additional CSS classes
 * @param {string} animation - Animation speed: 'normal', 'slow', 'fast'
 * @param {React.ReactNode} children - Child elements for custom skeletons
 */
const Skeleton = ({
  variant = 'text',
  size = 'md',
  width = 'full',
  className = '',
  animation = 'normal',
  children,
  ...props
}) => {
  // Build base classes
  const getSkeletonClasses = () => {
    let classes = ['skeleton'];
    
    // Animation variants
    if (animation === 'slow') classes.push('skeleton--slow');
    if (animation === 'fast') classes.push('skeleton--fast');
    
    // Variant-specific classes
    switch (variant) {
      case 'text':
        classes.push(`skeleton-text${size !== 'md' ? `-${size}` : ''}`);
        if (width !== 'full') classes.push(`skeleton-text--${width}`);
        break;
      case 'avatar':
        classes.push(`skeleton-avatar${size !== 'md' ? `-${size}` : ''}`);
        break;
      case 'button':
        if (size === 'compact') classes.push('skeleton-button-compact');
        else if (size === 'wide') classes.push('skeleton-button-wide');
        else classes.push('skeleton-button');
        break;
      case 'card':
        classes.push(size === 'compact' ? 'skeleton-card-compact' : 'skeleton-card');
        break;
      case 'input':
        classes.push('skeleton-input');
        break;
      case 'measurement':
        classes.push('skeleton-measurement');
        break;
      case 'baby-card':
        classes.push('skeleton-baby-card');
        break;
      case 'custom':
        // Just apply base skeleton class for custom variants
        break;
      default:
        classes.push('skeleton-text');
    }
    
    return classes.join(' ');
  };

  if (variant === 'custom' && children) {
    return (
      <div className={`${getSkeletonClasses()} ${className}`} {...props}>
        {children}
      </div>
    );
  }

  return <div className={`${getSkeletonClasses()} ${className}`} {...props} />;
};

// Pre-built skeleton patterns
export const SkeletonProfile = ({ size = 'md', className = '' }) => (
  <div className={`skeleton-profile ${className}`}>
    <Skeleton variant="avatar" size={size} />
    <div className="flex-1">
      <Skeleton variant="text" size="lg" width="half" />
      <Skeleton variant="text" size="sm" width="three-quarters" />
    </div>
  </div>
);

export const SkeletonPost = ({ className = '' }) => (
  <div className={`skeleton-post ${className}`}>
    <SkeletonProfile />
    <div className="mt-4">
      <Skeleton variant="text" width="full" />
      <Skeleton variant="text" width="full" />
      <Skeleton variant="text" width="three-quarters" />
    </div>
    <div className="mt-4 flex gap-2">
      <Skeleton variant="button" size="compact" />
      <Skeleton variant="button" size="compact" />
    </div>
  </div>
);

export const SkeletonCard = ({ compact = false, className = '' }) => (
  <div className={`${compact ? 'skeleton-card-compact' : 'skeleton-card'} ${className}`}>
    <Skeleton variant="text" size="xl" width="half" />
    <Skeleton variant="text" width="full" />
    <Skeleton variant="text" width="three-quarters" />
    <div className="flex gap-2 mt-4">
      <Skeleton variant="button" />
      <Skeleton variant="button" size="compact" />
    </div>
  </div>
);

export const SkeletonList = ({ items = 3, className = '' }) => (
  <div className={`skeleton-list ${className}`}>
    {Array.from({ length: items }).map((_, index) => (
      <div key={index} className="skeleton-list-item">
        <div className="skeleton-flex">
          <Skeleton variant="avatar" size="sm" />
          <div className="flex-1">
            <Skeleton variant="text" width="half" />
            <Skeleton variant="text" size="sm" width="three-quarters" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

export const SkeletonForm = ({ fields = 3, className = '' }) => (
  <div className={`space-y-4 ${className}`}>
    {Array.from({ length: fields }).map((_, index) => (
      <div key={index} className="skeleton-form-field">
        <Skeleton variant="text" size="sm" width="quarter" />
        <Skeleton variant="input" />
      </div>
    ))}
    <div className="flex gap-2 mt-6">
      <Skeleton variant="button" />
      <Skeleton variant="button" size="compact" />
    </div>
  </div>
);

// App-specific skeletons
export const SkeletonMeasurementCard = ({ className = '' }) => (
  <div className={`skeleton-measurement ${className}`} />
);

export const SkeletonBabyCard = ({ className = '' }) => (
  <div className={`skeleton-baby-card ${className}`} />
);

export default Skeleton;