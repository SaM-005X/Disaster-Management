import React, { useState, useEffect } from 'react';
import { WifiIcon } from './icons/WifiIcon';
import { WifiOffIcon } from './icons/WifiOffIcon';
import { useTranslate } from '../contexts/TranslationContext';

const ConnectivityStatusIndicator: React.FC = () => {
  const { translate } = useTranslate();
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const statusText = isOnline ? translate('Online') : translate('Offline');
  const icon = isOnline ? <WifiIcon className="h-6 w-6 text-emerald-500" /> : <WifiOffIcon className="h-6 w-6 text-gray-400" />;
  
  const divClasses = "p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors";

  return (
    <div title={statusText} className={divClasses} aria-label={statusText}>
      {icon}
    </div>
  );
};

export default ConnectivityStatusIndicator;