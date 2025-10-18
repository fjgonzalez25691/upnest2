import React from 'react';
import PropTypes from 'prop-types';

/**
 * Avatar component with semantic sizing and thematic gradients
 * 
 * Uses the optimized CSS system from /styles/components/avatar.css
 * Replaces repetitive className patterns with semantic properties
 * 
 * @example
 * // Basic avatar with image
 * <Avatar src="/user.jpg" alt="User Name" size="lg" gradient="pink" />
 * 
 * // Avatar with initials
 * <Avatar initials="AB" size="md" gradient="blue" />
 * 
 * // Interactive avatar with online status
 * <Avatar 
 *   src="/user.jpg" 
 *   alt="User" 
 *   size="lg" 
 *   gradient="pink" 
 *   interactive 
 *   online 
 * />
 */
const Avatar = ({
  src,
  alt,
  initials,
  size = 'md',
  gradient = 'pink',
  interactive = false,
  online = false,
  notification = false,
  bordered = false,
  skeleton = false,
  editable = false,
  responsive = false,
  className = '',
  onClick,
  role,
  ...props
}) => {
  // Build CSS classes
  const baseClasses = ['avatar'];
  
  // Size classes
  if (responsive) {
    baseClasses.push('avatar-responsive');
  } else {
    baseClasses.push(`avatar-${size}`);
  }
  
  // Gradient classes
  baseClasses.push(`avatar-gradient-${gradient}`);
  
  // State classes
  if (interactive) baseClasses.push('avatar-interactive');
  if (online) baseClasses.push('avatar-online');
  if (notification) baseClasses.push('avatar-notification');
  if (bordered) baseClasses.push('avatar-bordered');
  if (skeleton) baseClasses.push('avatar-skeleton');
  if (editable) baseClasses.push('avatar-editable');
  
  // Initials support
  if (initials && !src) {
    baseClasses.push('avatar-initials');
  }
  
  // Combine all classes
  const finalClassName = [...baseClasses, className].filter(Boolean).join(' ');
  
  // Determine role
  const avatarRole = role || (initials && !src ? 'img' : 'presentation');
  
  // Event handlers
  const handleClick = (e) => {
    if (interactive && onClick) {
      onClick(e);
    }
  };
  
  const handleKeyDown = (e) => {
    if (interactive && onClick && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onClick(e);
    }
  };
  
  // If showing initials without image
  if (initials && !src) {
    return (
      <div
        className={finalClassName}
        role={avatarRole}
        aria-label={alt || `Avatar for ${initials}`}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        tabIndex={interactive ? 0 : -1}
        {...props}
      >
        <span>{initials}</span>
      </div>
    );
  }
  
  // Image avatar
  return (
    <img
      src={src}
      alt={alt}
      className={finalClassName}
      role={avatarRole}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={interactive ? 0 : -1}
      {...props}
    />
  );
};

Avatar.propTypes = {
  /** Image source URL */
  src: PropTypes.string,
  
  /** Alt text for accessibility */
  alt: PropTypes.string,
  
  /** Initials to display when no image (e.g., "AB") */
  initials: PropTypes.string,
  
  /** Avatar size */
  size: PropTypes.oneOf(['xs', 'sm', 'md', 'lg', 'xl', '2xl']),
  
  /** Gradient theme */
  gradient: PropTypes.oneOf(['pink', 'blue', 'green', 'orange', 'purple', 'gray']),
  
  /** Enable interactive states (hover, focus, click) */
  interactive: PropTypes.bool,
  
  /** Show online indicator */
  online: PropTypes.bool,
  
  /** Show notification badge */
  notification: PropTypes.bool,
  
  /** Add thematic border */
  bordered: PropTypes.bool,
  
  /** Show skeleton loading state */
  skeleton: PropTypes.bool,
  
  /** Enable editable overlay */
  editable: PropTypes.bool,
  
  /** Use responsive sizing */
  responsive: PropTypes.bool,
  
  /** Additional CSS classes */
  className: PropTypes.string,
  
  /** Click handler (requires interactive=true) */
  onClick: PropTypes.func,
  
  /** ARIA role override */
  role: PropTypes.string,
};

export default Avatar;

/**
 * Avatar Stack component for overlapping avatars
 * 
 * @example
 * <AvatarStack>
 *   <Avatar src="/user1.jpg" alt="User 1" size="sm" gradient="pink" />
 *   <Avatar src="/user2.jpg" alt="User 2" size="sm" gradient="blue" />
 *   <Avatar src="/user3.jpg" alt="User 3" size="sm" gradient="green" />
 * </AvatarStack>
 */
export const AvatarStack = ({ children, className = '', ...props }) => {
  return (
    <div className={`avatar-stack ${className}`} {...props}>
      {children}
    </div>
  );
};

AvatarStack.propTypes = {
  /** Avatar components to stack */
  children: PropTypes.node.isRequired,
  
  /** Additional CSS classes */
  className: PropTypes.string,
};

/**
 * Avatar List component for horizontal avatar lists
 * 
 * @example
 * <AvatarList>
 *   <Avatar src="/user1.jpg" alt="User 1" size="md" gradient="pink" />
 *   <Avatar src="/user2.jpg" alt="User 2" size="md" gradient="blue" />
 * </AvatarList>
 */
export const AvatarList = ({ children, className = '', ...props }) => {
  return (
    <div className={`avatar-list ${className}`} {...props}>
      {children}
    </div>
  );
};

AvatarList.propTypes = {
  /** Avatar components to list */
  children: PropTypes.node.isRequired,
  
  /** Additional CSS classes */
  className: PropTypes.string,
};

/**
 * Avatar Grid component for grid layout
 * 
 * @example
 * <AvatarGrid>
 *   <Avatar src="/user1.jpg" alt="User 1" size="lg" gradient="pink" />
 *   <Avatar src="/user2.jpg" alt="User 2" size="lg" gradient="blue" />
 *   <Avatar src="/user3.jpg" alt="User 3" size="lg" gradient="green" />
 * </AvatarGrid>
 */
export const AvatarGrid = ({ children, className = '', ...props }) => {
  return (
    <div className={`avatar-grid ${className}`} {...props}>
      {children}
    </div>
  );
};

AvatarGrid.propTypes = {
  /** Avatar components for grid */
  children: PropTypes.node.isRequired,
  
  /** Additional CSS classes */
  className: PropTypes.string,
};