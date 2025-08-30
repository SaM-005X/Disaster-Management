import React from 'react';
import { useTranslate } from '../contexts/TranslationContext';
import { ShieldCheckIcon } from './icons/ShieldCheckIcon';
import { AwardIcon } from './icons/AwardIcon';
import { LockIcon } from './icons/LockIcon';
import type { User } from '../types';

interface DemoCertificateProps {
  user: User;
}

const DemoCertificate: React.FC<DemoCertificateProps> = ({ user }) => {
  const { translate } = useTranslate();

  return (
    <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 md:p-10 max-w-4xl mx-auto border-4 border-gray-300 dark:border-gray-600 certificate-bg overflow-hidden">
        {/* The certificate content (grayed out) */}
        <div className="opacity-20 filter grayscale">
            <div className="text-center border-b-2 border-gray-300 dark:border-gray-600 pb-6">
                <ShieldCheckIcon className="h-16 w-16 text-gray-500 mx-auto" />
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white mt-4">{translate(user.institutionName)}</h1>
                <p className="text-lg text-gray-500 dark:text-gray-400">{translate('EduSafe Platform')}</p>
            </div>
            <div className="my-10 text-center">
                <p className="text-xl text-gray-600 dark:text-gray-300 uppercase tracking-widest">{translate('Certificate of Preparedness')}</p>
                <AwardIcon className="h-24 w-24 text-gray-400 mx-auto my-6" />
                <p className="text-lg text-gray-600 dark:text-gray-300">{translate('This certificate is proudly presented to')}</p>
                <p className="text-5xl font-bold text-gray-900 dark:text-white my-4 script-font">{user.name}</p>
                <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                    {translate('for successfully completing all simulations and demonstrating mastery in disaster preparedness.')}
                </p>
            </div>
             <div className="flex flex-col sm:flex-row justify-between items-center pt-6 border-t-2 border-gray-300 dark:border-gray-600">
                <div>
                    <p className="font-bold text-gray-700 dark:text-gray-200">{translate('Date of Completion')}</p>
                    <p className="text-gray-600 dark:text-gray-400">--/--/----</p>
                </div>
                 <div>
                    <p className="font-bold text-gray-700 dark:text-gray-200 mt-4 sm:mt-0 text-center">{translate('Authorized by')}</p>
                    <p className="text-gray-600 dark:text-gray-400 text-center italic">{translate('EduSafe Coordination Team')}</p>
                </div>
            </div>
        </div>

        {/* Lock Overlay */}
        <div className="absolute inset-0 bg-gray-500 bg-opacity-50 dark:bg-gray-900 dark:bg-opacity-60 flex flex-col items-center justify-center text-center p-4 backdrop-blur-sm">
            <LockIcon className="h-20 w-20 text-white" />
            <h2 className="text-3xl font-bold text-white mt-4">{translate('Certificate Locked')}</h2>
            <p className="text-lg text-white mt-2 max-w-md">{translate('Complete all lab simulations with a passing score of 75% or higher to unlock and earn your official "Disaster Ready" certificate.')}</p>
        </div>

        <style>
        {`
            @import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&display=swap');
            .script-font {
                font-family: 'Dancing Script', cursive;
            }
            .certificate-bg {
                background-image:
                    linear-gradient(45deg, rgba(156, 163, 175, 0.05) 25%, transparent 25%),
                    linear-gradient(-45deg, rgba(156, 163, 175, 0.05) 25%, transparent 25%),
                    linear-gradient(45deg, transparent 75%, rgba(156, 163, 175, 0.05) 75%),
                    linear-gradient(-45deg, transparent 75%, rgba(156, 163, 175, 0.05) 75%);
                background-size: 20px 20px;
            }
            .dark .certificate-bg {
                 background-image:
                    linear-gradient(45deg, rgba(107, 114, 128, 0.05) 25%, transparent 25%),
                    linear-gradient(-45deg, rgba(107, 114, 128, 0.05) 25%, transparent 25%),
                    linear-gradient(45deg, transparent 75%, rgba(107, 114, 128, 0.05) 75%),
                    linear-gradient(-45deg, transparent 75%, rgba(107, 114, 128, 0.05) 75%);
            }
        `}
        </style>
    </div>
  );
};

export default DemoCertificate;