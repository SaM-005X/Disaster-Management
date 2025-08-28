import React from 'react';

// Individual icon components defined internally for clarity
const SunIcon: React.FC = () => (
    <g className="sun-group">
        <circle cx="12" cy="12" r="5" />
        <line x1="12" y1="1" x2="12" y2="3" />
        <line x1="12" y1="21" x2="12" y2="23" />
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
        <line x1="1" y1="12" x2="3" y2="12" />
        <line x1="21" y1="12" x2="23" y2="12" />
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </g>
);

const CloudIcon: React.FC = () => <path className="cloud" d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />;

const CloudRainIcon: React.FC = () => (
    <g>
        <path className="cloud" d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25" />
        <line className="rain-drop rain-drop-1" x1="8" y1="19" x2="8" y2="21" />
        <line className="rain-drop rain-drop-2" x1="12" y1="21" x2="12" y2="23" />
        <line className="rain-drop rain-drop-3" x1="16" y1="19" x2="16" y2="21" />
    </g>
);

const CloudLightningIcon: React.FC = () => (
    <g>
        <path className="cloud" d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25" />
        <polyline className="lightning" points="13 11 9 17 15 17 11 23" />
    </g>
);

const CloudDrizzleIcon: React.FC = () => (
     <g>
        <path className="cloud" d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25" />
        <path className="rain-drop rain-drop-1" d="M8 19v2" />
        <path className="rain-drop rain-drop-3" d="M8 13v2" />
        <path className="rain-drop rain-drop-2" d="M16 19v2" />
        <path className="rain-drop rain-drop-1" d="M16 13v2" />
        <path className="rain-drop rain-drop-3" d="M12 21v2" />
        <path className="rain-drop rain-drop-2" d="M12 15v2" />
    </g>
);


interface WeatherIconProps extends React.SVGProps<SVGSVGElement> {
  condition: string;
}

export const WeatherIcon: React.FC<WeatherIconProps> = ({ condition, ...props }) => {
  const renderIcon = () => {
    const lowerCondition = condition.toLowerCase();
    if (lowerCondition.includes('thunder') || lowerCondition.includes('storm')) return <CloudLightningIcon />;
    if (lowerCondition.includes('rain') || lowerCondition.includes('showers')) return <CloudRainIcon />;
    if (lowerCondition.includes('drizzle')) return <CloudDrizzleIcon />;
    if (lowerCondition.includes('cloud')) return <CloudIcon />;
    if (lowerCondition.includes('sun') || lowerCondition.includes('clear')) return <SunIcon />;
    // Default icon
    return <CloudIcon />;
  };

  return (
    <>
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
      {renderIcon()}
    </svg>
    <style>{`
        @keyframes sun-pulse {
            0%, 100% { transform: scale(1); transform-origin: center; }
            50% { transform: scale(1.05); transform-origin: center; }
        }
        .sun-group {
            animation: sun-pulse 3s ease-in-out infinite;
        }

        @keyframes cloud-drift {
            0%, 100% { transform: translateX(0); }
            50% { transform: translateX(1px); }
        }
        .cloud {
            animation: cloud-drift 4s ease-in-out infinite;
        }

        @keyframes rain-fall {
            0% { transform: translateY(-2px); opacity: 0; }
            50% { opacity: 1; }
            100% { transform: translateY(2px); opacity: 0; }
        }
        .rain-drop {
            animation: rain-fall 1.5s linear infinite;
        }
        .rain-drop-1 { animation-delay: 0s; }
        .rain-drop-2 { animation-delay: 0.5s; }
        .rain-drop-3 { animation-delay: 1s; }
        
        @keyframes lightning-flash {
            0%, 100% { opacity: 0.3; }
            50% { opacity: 1; }
        }
        .lightning {
            animation: lightning-flash 2s steps(1, end) infinite;
        }
    `}</style>
    </>
  );
};