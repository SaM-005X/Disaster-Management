import React, { useEffect } from 'react';
import type { User, Institution } from '../types';
import { useTranslate } from '../contexts/TranslationContext';
import { useTTS, TTSText } from '../contexts/TTSContext';
import { ShieldCheckIcon } from './icons/ShieldCheckIcon';
import { AwardIcon } from './icons/AwardIcon';
import { ArrowLeftIcon } from './icons/ArrowLeftIcon';
import { PrinterIcon } from './icons/PrinterIcon';

interface CertificateProps {
  user: User;
  institution: Institution;
  onBack: () => void;
}

const Certificate: React.FC<CertificateProps> = ({ user, institution, onBack }) => {
  const { translate } = useTranslate();
  const { registerTexts, currentlySpokenId } = useTTS();
  const completionDate = new Date().toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const achievementTitle = translate('Mastery in Comprehensive Disaster Preparedness');

  const achievementReason = translate('for successfully completing all simulations and demonstrating mastery across all disaster preparedness topics.');

  useEffect(() => {
    const textsToRead: TTSText[] = [
      { id: 'cert-inst-name', text: translate(institution.name) },
      { id: 'cert-platform-name', text: translate('EduSafe Platform') },
      { id: 'cert-title', text: translate('Certificate of Preparedness') },
      { id: 'cert-presented-to', text: translate('This certificate is proudly presented to') },
      { id: 'cert-user-name', text: user.name },
      { id: 'cert-user-details', text: `${translate(user.role)}: ${translate(user.class)}` },
      { id: 'cert-reason', text: achievementReason },
      { id: 'cert-achievement-title', text: achievementTitle },
      { id: 'cert-date-label', text: translate('Date of Completion') },
      { id: 'cert-date-value', text: completionDate },
      { id: 'cert-auth-label', text: translate('Authorized by') },
      { id: 'cert-auth-value', text: translate('EduSafe Coordination Team') },
    ];
    registerTexts(textsToRead);
  }, [user, institution, achievementTitle, achievementReason, completionDate, registerTexts, translate]);

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
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 md:p-10 max-w-4xl mx-auto border-4 border-teal-500 dark:border-teal-400 certificate-bg">
            <div className="text-center border-b-2 border-gray-300 dark:border-gray-600 pb-6">
                <ShieldCheckIcon className="h-16 w-16 text-teal-600 dark:text-teal-400 mx-auto" />
                <h1 id="cert-inst-name" className={`text-2xl font-bold text-gray-800 dark:text-white mt-4 ${currentlySpokenId === 'cert-inst-name' ? 'tts-highlight' : ''}`}>{translate(institution.name)}</h1>
                <p id="cert-platform-name" className={`text-lg text-gray-500 dark:text-gray-400 ${currentlySpokenId === 'cert-platform-name' ? 'tts-highlight' : ''}`}>{translate('EduSafe Platform')}</p>
            </div>
            <div className="my-10 text-center">
                <p id="cert-title" className={`text-xl text-gray-600 dark:text-gray-300 uppercase tracking-widest ${currentlySpokenId === 'cert-title' ? 'tts-highlight' : ''}`}>{translate('Certificate of Preparedness')}</p>
                <AwardIcon className="h-24 w-24 text-amber-400 mx-auto my-6" />
                <p id="cert-presented-to" className={`text-lg text-gray-600 dark:text-gray-300 ${currentlySpokenId === 'cert-presented-to' ? 'tts-highlight' : ''}`}>{translate('This certificate is proudly presented to')}</p>
                <p id="cert-user-name" className={`text-5xl font-bold text-gray-900 dark:text-white my-2 script-font ${currentlySpokenId === 'cert-user-name' ? 'tts-highlight' : ''}`}>{user.name}</p>
                <p id="cert-user-details" className={`text-xl text-gray-500 dark:text-gray-400 mt-1 mb-4 ${currentlySpokenId === 'cert-user-details' ? 'tts-highlight' : ''}`}>
                    {translate(user.role)}: {translate(user.class)}
                </p>
                <p id="cert-reason" className={`text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto ${currentlySpokenId === 'cert-reason' ? 'tts-highlight' : ''}`}>
                    {achievementReason}
                </p>
                <strong id="cert-achievement-title" className={`text-2xl font-bold text-teal-600 dark:text-teal-400 block mt-2 ${currentlySpokenId === 'cert-achievement-title' ? 'tts-highlight' : ''}`}>{achievementTitle}</strong>
            </div>
            <div className="flex flex-col sm:flex-row justify-between items-center pt-6 border-t-2 border-gray-300 dark:border-gray-600">
                <div>
                    <p id="cert-date-label" className={`font-bold text-gray-700 dark:text-gray-200 ${currentlySpokenId === 'cert-date-label' ? 'tts-highlight' : ''}`}>{translate('Date of Completion')}</p>
                    <p id="cert-date-value" className={`text-gray-600 dark:text-gray-400 ${currentlySpokenId === 'cert-date-value' ? 'tts-highlight' : ''}`}>{completionDate}</p>
                </div>
                 <div>
                    <p id="cert-auth-label" className={`font-bold text-gray-700 dark:text-gray-200 mt-4 sm:mt-0 text-center ${currentlySpokenId === 'cert-auth-label' ? 'tts-highlight' : ''}`}>{translate('Authorized by')}</p>
                    <p id="cert-auth-value" className={`text-gray-600 dark:text-gray-400 text-center italic ${currentlySpokenId === 'cert-auth-value' ? 'tts-highlight' : ''}`}>{translate('EduSafe Coordination Team')}</p>
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