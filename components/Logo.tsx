import React from 'react';

export const Logo: React.FC<{ className?: string }> = ({ className = "h-16 w-auto" }) => {
  return (
    <svg 
      viewBox="0 0 100 130" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={className}
    >
      {/* Shield Base */}
      <path d="M50 5L10 25V75C10 95 50 120 50 120C50 120 90 95 90 75V25L50 5Z" fill="#0b1a32" />
      
      {/* Accent Border */}
      <path d="M50 12L18 28V72C18 88 50 108 50 108C50 108 82 88 82 72V28L50 12Z" fill="#001529" stroke="#00a4e4" strokeWidth="2" />
      
      {/* Crown Icon */}
      <path d="M35 35L42.5 45L50 35L57.5 45L65 35V55H35V35Z" fill="white" />
      
      {/* Decorative Stripes */}
      <rect x="35" y="60" width="30" height="3" rx="1" fill="#00a4e4" />
      
      {/* Main Text */}
      <text x="50" y="95" textAnchor="middle" fill="white" style={{ fontSize: '24px', fontWeight: 900, fontFamily: 'system-ui, sans-serif', letterSpacing: '1px' }}>SPL</text>
      
      {/* Subtitle */}
      <text x="50" y="112" textAnchor="middle" fill="#00a4e4" style={{ fontSize: '8px', fontWeight: 800, fontFamily: 'system-ui, sans-serif', textTransform: 'uppercase', letterSpacing: '2px' }}>Premiere</text>
    </svg>
  );
};
