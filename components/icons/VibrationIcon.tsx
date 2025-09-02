import React from 'react';

export const VibrationIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M2 8L4 10L2 12L4 14L2 16" />
    <path d="M22 8L20 10L22 12L20 14L22 16" />
    <rect x="6" y="4" width="12" height="16" rx="2" />
  </svg>
);