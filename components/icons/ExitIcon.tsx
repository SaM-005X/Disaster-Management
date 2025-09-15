import React from 'react';

export const ExitIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
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
    <path d="M10 12h10" />
    <path d="M16 8l4 4-4 4" />
    <path d="M4 4v16a2 2 0 0 0 2 2h4" />
    <path d="M12 15a3 3 0 0 0-3-3" />
    <circle cx="7.5" cy="7.5" r="1.5" />
    <path d="M9 12v-1.5a3 3 0 0 0-3-3" />
  </svg>
);