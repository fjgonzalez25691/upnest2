import React from 'react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';

/**
 * BackLink - Basic component for back navigation links
 * 
 * Replaces the repeated pattern of:
 * - text-blue-600 hover:text-blue-800 flex items-center mb-4 transition-colors
 * 
 * Used in: BabyProfile, GrowthTracking, PercentilesView, EditMeasurement, etc.
 * 
 * @param {string} to - Destination route (default: "..")
 * @param {string} children - Link text content
 * @param {string} className - Additional CSS classes
 */
const BackLink = ({ 
  to = "..", 
  children, 
  className = '',
  ...props 
}) => {
  return (
    <Link
      to={to}
      className={clsx('back-link', className)}
      {...props}
    >
      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
      </svg>
      {children}
    </Link>
  );
};

export default BackLink;