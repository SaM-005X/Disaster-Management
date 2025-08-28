import React from 'react';
import { RefreshCwIcon } from './icons/RefreshCwIcon';
import { WifiOffIcon } from './icons/WifiOffIcon';
import { XIcon } from './icons/XIcon';
import { useTranslate } from '../contexts/TranslationContext';

interface OfflineStatusToastProps {
  type: 'offlineReady' | 'updateAvailable';
  onClose: () => void;
  onRefresh?: () => void;
}

const OfflineStatusToast: React.FC<OfflineStatusToastProps> = ({ type, onClose, onRefresh }) => {
  const { translate } = useTranslate();

  const isUpdate = type === 'updateAvailable';
  const message = isUpdate 
    ? translate('A new version is available. Refresh to update.')
    : translate('Ready for offline use. Content is now cached.');
  
  const icon = isUpdate ? <RefreshCwIcon className="h-6 w-6" /> : <WifiOffIcon className="h-6 w-6" />;
  const bgClass = isUpdate ? 'bg-amber-500' : 'bg-emerald-500';

  return (
    <div
      className={`fixed bottom-28 left-1/2 -translate-x-1/2 z-50 flex items-center justify-between gap-4 w-full max-w-sm p-4 rounded-xl text-white shadow-lg ${bgClass} animate-fade-in-up`}
      role="status"
    >
      <div className="flex items-center gap-3">
        {icon}
        <p className="font-semibold text-sm">{message}</p>
      </div>
      <div className="flex items-center gap-2">
        {isUpdate && onRefresh && (
          <button
            onClick={onRefresh}
            className="font-bold text-sm py-1 px-3 bg-white/20 rounded-full hover:bg-white/30"
          >
            {translate('Refresh')}
          </button>
        )}
        <button
          onClick={onClose}
          className="p-1.5 rounded-full hover:bg-white/20"
          aria-label={translate('Close notification')}
        >
          <XIcon className="h-4 w-4" />
        </button>
      </div>
      <style>{`
        @keyframes fade-in-up {
            0% { opacity: 0; transform: translate(-50%, 20px); }
            100% { opacity: 1; transform: translate(-50%, 0); }
        }
        .animate-fade-in-up {
            animation: fade-in-up 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default OfflineStatusToast;
