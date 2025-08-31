import React, { useState, useEffect } from 'react';
import { fetchRealTimeAlerts } from '../services/alertService';
import type { Alert, AlertSeverity } from '../types';
import { useTranslate } from '../contexts/TranslationContext';
import { AlertTriangleIcon } from './icons/AlertTriangleIcon';
import { XIcon } from './icons/XIcon';
import { InfoIcon } from './icons/InfoIcon';
import { EyeIcon } from './icons/EyeIcon';

interface AlertsBannerProps {
  location: string;
  onClose: () => void;
  isOnline: boolean;
}

const getAlertStyles = (severity: AlertSeverity): { bg: string; icon: React.ReactNode } => {
  switch (severity) {
    case 'Warning':
      return {
        bg: 'bg-red-500/90 dark:bg-red-800/90 border-red-700 dark:border-red-600',
        icon: <AlertTriangleIcon className="h-6 w-6" />,
      };
    case 'Watch':
      return {
        bg: 'bg-amber-400/90 dark:bg-amber-700/90 border-amber-600 dark:border-amber-500',
        icon: <EyeIcon className="h-6 w-6" />,
      };
    case 'Advisory':
      return {
        bg: 'bg-sky-500/90 dark:bg-sky-800/90 border-sky-700 dark:border-sky-600',
        icon: <InfoIcon className="h-6 w-6" />,
      };
    default:
      return {
        bg: 'bg-gray-500/90 dark:bg-gray-700/90 border-gray-700 dark:border-gray-500',
        icon: <InfoIcon className="h-6 w-6" />,
      };
  }
};

const AlertsBanner: React.FC<AlertsBannerProps> = ({ location, onClose, isOnline }) => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [currentAlertIndex, setCurrentAlertIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { translate } = useTranslate();

  useEffect(() => {
    if (!isOnline) {
      setIsLoading(false);
      return;
    }
    const getAlerts = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const fetchedAlerts = await fetchRealTimeAlerts(location);
        setAlerts(fetchedAlerts);
        setCurrentAlertIndex(0); // Reset index on new data to prevent race conditions
      } catch (err) {
        console.error("Failed to fetch alerts:", err);
        if (err instanceof Error) {
            setError(err.message);
        } else {
            setError(translate("An unknown error occurred while fetching alerts."));
        }
        setAlerts([]); // Clear alerts on error
        setCurrentAlertIndex(0);
      } finally {
        setIsLoading(false);
      }
    };
    getAlerts();
  }, [location, translate, isOnline]);

  useEffect(() => {
    if (alerts.length > 1) {
      const timer = setInterval(() => {
        setCurrentAlertIndex((prevIndex) => (prevIndex + 1) % alerts.length);
      }, 7000); // Change alert every 7 seconds
      return () => clearInterval(timer);
    }
  }, [alerts.length]);

  if (!isOnline) {
    return (
        <div className="relative w-full p-4 rounded-lg text-white shadow-lg backdrop-blur-md border bg-gray-500/90 dark:bg-gray-700/90 border-gray-700 dark:border-gray-500" role="status">
            <div className="flex items-center">
                <div className="flex-shrink-0"><InfoIcon className="h-6 w-6" /></div>
                <div className="ml-3 flex-1">
                    <p className="font-bold">{translate('You are currently offline')}</p>
                    <p className="text-sm">{translate('Alerts are unavailable offline.')}</p>
                </div>
            </div>
        </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-4 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse">
        <div className="h-6 w-3/4 bg-gray-300 dark:bg-gray-600 rounded"></div>
      </div>
    );
  }

  if (error) {
    return (
        <div
            className={`relative w-full p-4 rounded-lg text-white shadow-lg backdrop-blur-md border bg-red-500/90 dark:bg-red-800/90 border-red-700 dark:border-red-600`}
            role="alert"
        >
            <div className="flex items-center">
                <div className="flex-shrink-0"><AlertTriangleIcon className="h-6 w-6" /></div>
                <div className="ml-3 flex-1">
                    <p className="font-bold">{translate('Could Not Load Alerts')}</p>
                    <p className="text-sm">{translate(error)}</p>
                </div>
                <button
                    onClick={onClose}
                    className="ml-4 p-1.5 rounded-full hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white"
                    aria-label={translate("Dismiss alert")}
                >
                    <XIcon className="h-5 w-5" />
                </button>
            </div>
        </div>
    );
  }

  if (alerts.length === 0 || currentAlertIndex >= alerts.length) {
    return null; // No alerts to display or index is out of bounds
  }

  const currentAlert = alerts[currentAlertIndex];
  const { bg, icon } = getAlertStyles(currentAlert.severity);

  return (
    <div
      className={`relative w-full p-4 rounded-lg text-white shadow-lg backdrop-blur-md border ${bg}`}
      role="alert"
    >
      <div className="flex items-center">
        <div className="flex-shrink-0">{icon}</div>
        <div className="ml-3 flex-1">
          <p className="font-bold">{translate(currentAlert.title)}</p>
          <p className="text-sm">{translate(currentAlert.details)}</p>
        </div>
        <button
          onClick={onClose}
          className="ml-4 p-1.5 rounded-full hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white"
          aria-label={translate("Dismiss alerts")}
        >
          <XIcon className="h-5 w-5" />
        </button>
      </div>
      {alerts.length > 1 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex space-x-2">
          {alerts.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentAlertIndex(index)}
              className={`h-2 w-2 rounded-full transition-colors ${
                index === currentAlertIndex ? 'bg-white' : 'bg-white/50 hover:bg-white/75'
              }`}
              aria-label={`${translate('Go to alert')} ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default AlertsBanner;
