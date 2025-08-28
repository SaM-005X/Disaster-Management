import React, { useState, useEffect } from 'react';
import { fetchRealTimeAlerts } from '../services/alertService';
import type { Alert, AlertSeverity } from '../types';
import { useTranslate } from '../contexts/TranslationContext';
import { useTTS, type TTSText } from '../contexts/TTSContext';
import { AlertTriangleIcon } from './icons/AlertTriangleIcon';
import { EyeIcon } from './icons/EyeIcon';
import { InfoIcon } from './icons/InfoIcon';

interface LocationAlertsProps {
  location: string;
}

const getAlertStyles = (severity: AlertSeverity): { bg: string; icon: React.ReactNode } => {
  switch (severity) {
    case 'Warning':
      return {
        bg: 'bg-red-100 dark:bg-red-900/50 border-red-500 text-red-800 dark:text-red-200',
        icon: <AlertTriangleIcon className="h-6 w-6 text-red-600 dark:text-red-400" />,
      };
    case 'Watch':
      return {
        bg: 'bg-amber-100 dark:bg-amber-900/50 border-amber-500 text-amber-800 dark:text-amber-200',
        icon: <EyeIcon className="h-6 w-6 text-amber-600 dark:text-amber-400" />,
      };
    case 'Advisory':
      return {
        bg: 'bg-sky-100 dark:bg-sky-900/50 border-sky-500 text-sky-800 dark:text-sky-200',
        icon: <InfoIcon className="h-6 w-6 text-sky-600 dark:text-sky-400" />,
      };
    default:
      return {
        bg: 'bg-gray-100 dark:bg-gray-700 border-gray-500 text-gray-800 dark:text-gray-200',
        icon: <InfoIcon className="h-6 w-6" />,
      };
  }
};

const LocationAlerts: React.FC<LocationAlertsProps> = ({ location }) => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { translate } = useTranslate();
  const { registerTexts } = useTTS();

  useEffect(() => {
    const getAlerts = async () => {
      if (!location) return;
      try {
        setIsLoading(true);
        const fetchedAlerts = await fetchRealTimeAlerts(location);
        setAlerts(fetchedAlerts);
      } catch (error) {
        console.error("Failed to fetch location alerts:", error);
        setAlerts([]); // Clear alerts on error
      } finally {
        setIsLoading(false);
      }
    };
    getAlerts();
  }, [location]);
  
  useEffect(() => {
    if (alerts.length > 0) {
        const textsToRead: TTSText[] = alerts.map((alert, index) => ({
            id: `location-alert-${index}`,
            text: `Alert: ${translate(alert.severity)}. ${translate(alert.title)}. ${translate(alert.details)}`,
        }));
        registerTexts(textsToRead);
    }
  }, [alerts, registerTexts, translate]);

  if (isLoading) {
    return (
      <div className="mb-4 p-4 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse">
        <div className="h-5 w-1/2 bg-gray-300 dark:bg-gray-600 rounded"></div>
      </div>
    );
  }

  if (alerts.length === 0) {
    return (
        <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-900/50 rounded-lg text-emerald-800 dark:text-emerald-200 text-sm font-medium text-center">
            {translate('No active weather alerts for this location.')}
        </div>
    );
  }

  return (
    <div className="mb-4 space-y-3">
      {alerts.map((alert, index) => {
        const { bg, icon } = getAlertStyles(alert.severity);
        return (
          <div key={index} className={`w-full p-4 rounded-lg shadow-sm border-l-4 ${bg}`} role="alert">
            <div className="flex items-start">
              <div className="flex-shrink-0">{icon}</div>
              <div className="ml-3 flex-1">
                <p className="font-bold">{translate(alert.title)}</p>
                <p className="text-sm">{translate(alert.details)}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default LocationAlerts;