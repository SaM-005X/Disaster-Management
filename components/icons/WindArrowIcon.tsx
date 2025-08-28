import React from 'react';

interface WindArrowIconProps extends React.SVGProps<SVGSVGElement> {
  direction: string; // e.g., 'N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'
}

const getRotation = (direction: string): number => {
    const dir = direction.toUpperCase();
    switch (dir) {
        case 'N': return 0;
        case 'NE': return 45;
        case 'E': return 90;
        case 'SE': return 135;
        case 'S': return 180;
        case 'SW': return 225;
        case 'W': return 270;
        case 'NW': return 315;
        default: return 0;
    }
};

export const WindArrowIcon: React.FC<WindArrowIconProps> = ({ direction, ...props }) => {
  const rotation = getRotation(direction);

  return (
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
      style={{ transform: `rotate(${rotation}deg)` }}
    >
      <path d="M12 19V5" />
      <path d="m5 12 7-7 7 7" />
    </svg>
  );
};