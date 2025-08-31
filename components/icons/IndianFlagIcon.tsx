import React from 'react';

export const IndianFlagIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 100 100"
    fill="none"
  >
    <g clipPath="url(#clip0_indian_flag_icon)">
      {/* Saffron Stripe */}
      <rect width="100" height="33.33" fill="#FF9933"/>
      {/* White Stripe */}
      <rect y="33.33" width="100" height="33.34" fill="#FFFFFF"/>
      {/* Green Stripe */}
      <rect y="66.67" width="100" height="33.33" fill="#138808"/>
      {/* Ashoka Chakra */}
      <circle cx="50" cy="50" r="16" fill="none" stroke="#000080" strokeWidth="2"/>
      <circle cx="50" cy="50" r="1.5" fill="#000080"/>
      {/* 24 Spokes of the Chakra */}
      {Array.from({ length: 24 }).map((_, i) => (
        <line
          key={i}
          x1="50"
          y1="50"
          x2="50"
          y2="34"
          stroke="#000080"
          strokeWidth="1.5"
          transform={`rotate(${i * 15}, 50, 50)`}
        />
      ))}
    </g>
    <defs>
      <clipPath id="clip0_indian_flag_icon">
        <circle cx="50" cy="50" r="50"/>
      </clipPath>
    </defs>
  </svg>
);
