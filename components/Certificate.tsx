import React, { useEffect } from 'react';
import type { User } from '../types';
import { UserRole } from '../types';
import { useTranslate } from '../contexts/TranslationContext';
import { useTTS, TTSText } from '../contexts/TTSContext';
import { ShieldCheckIcon } from './icons/ShieldCheckIcon';
import { AwardIcon } from './icons/AwardIcon';
import { ArrowLeftIcon } from './icons/ArrowLeftIcon';
import { PrinterIcon } from './icons/PrinterIcon';
import { IndianFlagIcon } from './icons/IndianFlagIcon';

interface CertificateProps {
  user: User;
  onBack: () => void;
}

const Certificate: React.FC<CertificateProps> = ({ user, onBack }) => {
  const { translate } = useTranslate();
  const { registerTexts, currentlySpokenId } = useTTS();
  const completionDate = new Date().toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const achievementTitle = translate('Mastery in Comprehensive Disaster Preparedness');
  const achievementReason = translate('for successfully completing all simulations and demonstrating mastery across all disaster preparedness topics.');
  
  // Role-aware labels for certificate details
  const classLabel = user.role === UserRole.TEACHER 
    ? translate('Department / Subject') 
    : user.role === UserRole.GOVERNMENT_OFFICIAL
    ? translate('Department')
    : user.role === UserRole.USER
    ? translate('Community / Group')
    : translate('Class / Grade');

  const institutionLabel = user.role === UserRole.GOVERNMENT_OFFICIAL
    ? translate('Ministry')
    : user.role === UserRole.USER
    ? translate('City / Region')
    : translate('Institution');

  useEffect(() => {
    const textsToRead: TTSText[] = [
      { id: 'cert-platform-name', text: translate('AlertIQ Platform') },
      { id: 'cert-title', text: translate('Certificate of Preparedness') },
      { id: 'cert-presented-to', text: translate('This certificate is proudly presented to') },
      { id: 'cert-user-name', text: user.name },
      { id: 'cert-user-role', text: `${translate('Role')}: ${translate(user.role)}` },
      { id: 'cert-user-class', text: `${classLabel}: ${translate(user.class)}` },
      { id: 'cert-user-institution', text: `${institutionLabel}: ${translate(user.institutionName)}` },
      { id: 'cert-reason', text: achievementReason },
      { id: 'cert-achievement-title', text: achievementTitle },
      { id: 'cert-date-label', text: translate('Date of Completion') },
      { id: 'cert-date-value', text: completionDate },
      { id: 'cert-issued-by', text: translate('Issued in collaboration with') },
      { id: 'cert-gov-of-india', text: translate('Government of India') },
      { id: 'cert-auth-label', text: translate('Authorized by') },
      { id: 'cert-auth-value', text: translate('AlertIQ Platform & NDMA') },
    ];
    registerTexts(textsToRead);
  }, [user, achievementTitle, achievementReason, completionDate, classLabel, institutionLabel, registerTexts, translate]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div>
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-center gap-4 print:hidden">
            <button
                onClick={onBack}
                className="flex items-center space-x-2 text-teal-600 dark:text-teal-400 hover:underline font-semibold"
            >
                <ArrowLeftIcon className="h-5 w-5" />
                <span>{translate('Back to Lab Dashboard')}</span>
            </button>
            <button
                onClick={handlePrint}
                className="flex items-center space-x-2 bg-teal-600 text-white font-bold py-2 px-4 rounded-full hover:bg-teal-700 transition-colors"
            >
                <PrinterIcon className="h-5 w-5" />
                <span>{translate('Print Certificate')}</span>
            </button>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 md:p-10 max-w-4xl mx-auto border-4 border-teal-500 dark:border-teal-400 certificate-bg relative">
            <div className="absolute inset-0 flex items-center justify-center z-0">
                <IndianFlagIcon className="h-64 w-64 opacity-10" />
            </div>
            <div className="relative z-10">
                <div className="text-center border-b-2 border-gray-300 dark:border-gray-600 pb-6">
                    <ShieldCheckIcon className="h-16 w-16 text-teal-600 dark:text-teal-400 mx-auto" />
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white mt-4">{translate('AlertIQ Platform')}</h1>
                    <p id="cert-platform-name" className={`text-lg text-gray-500 dark:text-gray-400 ${currentlySpokenId === 'cert-platform-name' ? 'tts-highlight' : ''}`}>{translate('Certificate of Preparedness')}</p>
                </div>
                <div className="my-8 text-center">
                    <AwardIcon className="h-24 w-24 text-amber-400 mx-auto my-6" />
                    <p id="cert-presented-to" className={`text-lg text-gray-600 dark:text-gray-300 ${currentlySpokenId === 'cert-presented-to' ? 'tts-highlight' : ''}`}>{translate('This certificate is proudly presented to')}</p>
                    <p id="cert-user-name" className={`text-3xl md:text-5xl font-bold text-gray-900 dark:text-white my-2 script-font ${currentlySpokenId === 'cert-user-name' ? 'tts-highlight' : ''}`}>{user.name}</p>
                    
                    <div className="mt-2 mb-4 text-gray-600 dark:text-gray-400 text-base space-y-1">
                        <p id="cert-user-role"><strong>{translate('Role')}:</strong> {translate(user.role)}</p>
                        <p id="cert-user-class"><strong>{classLabel}:</strong> {translate(user.class)}</p>
                        <p id="cert-user-institution"><strong>{institutionLabel}:</strong> {translate(user.institutionName)}</p>
                    </div>

                    <p id="cert-reason" className={`text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto ${currentlySpokenId === 'cert-reason' ? 'tts-highlight' : ''}`}>
                        {achievementReason}
                    </p>
                    <strong id="cert-achievement-title" className={`text-2xl font-bold text-teal-600 dark:text-teal-400 block mt-2 ${currentlySpokenId === 'cert-achievement-title' ? 'tts-highlight' : ''}`}>{achievementTitle}</strong>
                </div>
                <div className="flex flex-col sm:flex-row justify-between items-center pt-6 border-t-2 border-gray-300 dark:border-gray-600">
                    <div className="text-center sm:text-left">
                        <p id="cert-date-label" className={`font-bold text-gray-700 dark:text-gray-200 ${currentlySpokenId === 'cert-date-label' ? 'tts-highlight' : ''}`}>{translate('Date of Completion')}</p>
                        <p id="cert-date-value" className={`text-gray-600 dark:text-gray-400 ${currentlySpokenId === 'cert-date-value' ? 'tts-highlight' : ''}`}>{completionDate}</p>
                    </div>
                     <div className="text-center my-4 sm:my-0">
                        <IndianFlagIcon className="h-12 w-12 mx-auto" />
                        <p id="cert-issued-by" className={`text-xs mt-1 text-gray-600 dark:text-gray-400 ${currentlySpokenId === 'cert-issued-by' ? 'tts-highlight' : ''}`}>{translate('Issued in collaboration with')}</p>
                        <p id="cert-gov-of-india" className={`font-semibold text-gray-800 dark:text-white ${currentlySpokenId === 'cert-gov-of-india' ? 'tts-highlight' : ''}`}>{translate('Government of India')}</p>
                     </div>
                     <div className="text-center sm:text-right">
                        <p id="cert-auth-label" className={`font-bold text-gray-700 dark:text-gray-200 ${currentlySpokenId === 'cert-auth-label' ? 'tts-highlight' : ''}`}>{translate('Authorized by')}</p>
                        <p id="cert-auth-value" className={`text-gray-600 dark:text-gray-400 italic ${currentlySpokenId === 'cert-auth-value' ? 'tts-highlight' : ''}`}>{translate('AlertIQ Platform & NDMA')}</p>
                    </div>
                </div>
            </div>
        </div>

        <style>
        {`
            @import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&display=swap');
            .script-font {
                font-family: 'Dancing Script', cursive;
            }
            .certificate-bg {
                background-image:
                    linear-gradient(45deg, rgba(20, 184, 166, 0.05) 25%, transparent 25%),
                    linear-gradient(-45deg, rgba(20, 184, 166, 0.05) 25%, transparent 25%),
                    linear-gradient(45deg, transparent 75%, rgba(20, 184, 166, 0.05) 75%),
                    linear-gradient(-45deg, transparent 75%, rgba(20, 184, 166, 0.05) 75%);
                background-size: 20px 20px;
            }
            .dark .certificate-bg {
                 background-image:
                    linear-gradient(45deg, rgba(45, 212, 191, 0.05) 25%, transparent 25%),
                    linear-gradient(-45deg, rgba(45, 212, 191, 0.05) 25%, transparent 25%),
                    linear-gradient(45deg, transparent 75%, rgba(45, 212, 191, 0.05) 75%),
                    linear-gradient(-45deg, transparent 75%, rgba(45, 212, 191, 0.05) 75%);
            }
            @media print {
                body * {
                    visibility: hidden;
                }
                .certificate-bg, .certificate-bg * {
                    visibility: visible;
                }
                .certificate-bg {
                    position: absolute;
                    left: 0;
                    top: 0;
                    width: 100%;
                    height: 100%;
                    margin: 0;
                    padding: 20px;
                    box-shadow: none;
                    border-radius: 0;
                }
            }
        `}
        </style>
    </div>
  );
};

export default Certificate;