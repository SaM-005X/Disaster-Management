import React from 'react';

export const FireIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
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
    <path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.8-2.5-5 C 15.5 8.2 14.25 6 12 6 9.75 6 8.5 8.2 7.5 9.5c-1.5 1.2-2.5 3-2.5 5a7 7 0 0 0 7 7z" />
    <path d="M12 6c1.5-1.5 3-2 3-3 0-1.5-1.5-3-3-3s-3 1.5-3 3c0 1 1.5 1.5 3 3z" />
  </svg>
);