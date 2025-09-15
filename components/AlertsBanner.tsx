import React, { useState, useEffect, useRef } from 'react';
import { fetchRealTimeAlerts } from '../services/alertService';
import type { Alert, AlertSeverity } from '../types';
import { useTranslate } from '../contexts/TranslationContext';
import { useTTS } from '../contexts/TTSContext';
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
  const { rate, pitch, isSupported } = useTTS();
  const hasSpokenAlertsRef = useRef(false);

  useEffect(() => {
    if (!isOnline) {
      setIsLoading(false);
      hasSpokenAlertsRef.current = false; // Reset when offline
      return;
    }
    const getAlerts = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const fetchedAlerts = await fetchRealTimeAlerts(location);
        setAlerts(fetchedAlerts);
        setCurrentAlertIndex(0); // Reset index on new data
        hasSpokenAlertsRef.current = false; // Reset for new alerts, allowing them to be spoken
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

  // Effect for audible alerts
  useEffect(() => {
    // Conditions: TTS is supported, not loading, alerts haven't been spoken for this batch, and there are alerts to speak.
    if (isSupported && !isLoading && !hasSpokenAlertsRef.current && alerts.length > 0) {
      // Find the highest severity alert to announce.
      const severityOrder: Record<AlertSeverity, number> = { 'Warning': 3, 'Watch': 2, 'Advisory': 1 };
      const highestSeverityAlert = alerts.reduce((prev, current) => {
        return severityOrder[current.severity] > severityOrder[prev.severity] ? current : prev;
      }, alerts[0]);

      // Only speak for critical alerts ('Watch' is included as it's a type of advisory).
      if (highestSeverityAlert.severity === 'Warning' || highestSeverityAlert.severity === 'Watch' || highestSeverityAlert.severity === 'Advisory') {
        const synth = window.speechSynthesis;
        // Cancel any ongoing page reading to prioritize the alert.
        if (synth.speaking) {
          synth.cancel();
        }

        const alertText = `${translate(highestSeverityAlert.severity)}: ${translate(highestSeverityAlert.title)}. ${translate(highestSeverityAlert.details)}`;
        const utterance = new SpeechSynthesisUtterance(alertText);

        // Customize tone based on severity.
        if (highestSeverityAlert.severity === 'Warning') {
          utterance.pitch = Math.min(pitch * 1.3, 2);   // Higher pitch for urgency, capped at max value.
          utterance.rate = Math.min(rate * 1.2, 10); // Slightly faster, capped at max value.
        } else {
          utterance.pitch = pitch;
          utterance.rate = rate;
        }

        synth.speak(utterance);
        hasSpokenAlertsRef.current = true; // Mark as spoken to prevent re-announcing on visual cycle.
      }
    }
  }, [alerts, isLoading, isSupported, pitch, rate, translate]);

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
