import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { User, Institution } from '../types';
import { UserRole } from '../types';
import { useTranslate } from '../contexts/TranslationContext';
import { useTTS, TTSText } from '../contexts/TTSContext';
import { ArrowLeftIcon } from './icons/ArrowLeftIcon';
import { SchoolIcon } from './icons/SchoolIcon';
import { LocationIcon } from './icons/LocationIcon';
import { PhoneIcon } from './icons/PhoneIcon';
import { UserCircleIcon } from './icons/UserCircleIcon';
import { PencilIcon } from './icons/PencilIcon';
import { CameraIcon } from './icons/CameraIcon';
import { TrashIcon } from './icons/TrashIcon';
import VoiceInputButton from './VoiceInputButton';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';

interface ProfileProps {
  user: User;
  institution: Institution;
  onBack: () => void;
  onSave: (updatedUser: User, updatedInstitution: Institution) => void;
  backButtonText?: string;
}

const InfoRow: React.FC<{
    icon: React.ReactNode;
    label: string;
    value: string;
    isEditing: boolean;
    name: string;
    onChange: (name: string, value: string) => void;
    id: string;
    isHighlighted: boolean;
    labelId: string;
    labelIsHighlighted: boolean;
    isVoiceSupported: boolean;
    isVoiceListening: boolean;
    onToggleVoice: () => void;
}> = ({ icon, label, value, isEditing, name, onChange, id, isHighlighted, labelId, labelIsHighlighted, isVoiceSupported, isVoiceListening, onToggleVoice }) => (
    <div className="flex items-start py-4">
        <div className="text-teal-500 mr-4 mt-1 flex-shrink-0">{icon}</div>
        <div className="w-full">
            <p id={labelId} className={`text-sm text-gray-500 dark:text-gray-400 ${labelIsHighlighted ? 'tts-highlight' : ''}`}>{label}</p>
            {isEditing ? (
                 <div className="relative mt-1">
                    <input
                        type="text"
                        name={name}
                        value={value}
                        onChange={(e) => onChange(name, e.target.value)}
                        className="w-full text-lg font-semibold text-gray-800 dark:text-white bg-transparent border-b-2 border-gray-300 dark:border-gray-600 focus:outline-none focus:border-teal-500 transition-colors pr-10"
                        aria-labelledby={labelId}
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center">
                        {isVoiceSupported && <VoiceInputButton onTranscript={() => {}} isListening={isVoiceListening} toggleListening={onToggleVoice} />}
                    </div>
                </div>
            ) : (
                <p id={id} className={`text-lg font-semibold text-gray-800 dark:text-white break-words ${isHighlighted ? 'tts-highlight' : ''}`}>{value}</p>
            )}
        </div>
    </div>
);


const Profile: React.FC<ProfileProps> = ({ user, institution, onBack, onSave, backButtonText }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editableUser, setEditableUser] = useState<User>(user);
    const [editableInstitution, setEditableInstitution] = useState<Institution>(institution);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { translate } = useTranslate();
    const { registerTexts, currentlySpokenId } = useTTS();

    const [voiceTarget, setVoiceTarget] = useState<string | null>(null);

    const handleTranscript = useCallback((transcript: string) => {
        if (!voiceTarget) return;

        const updateFunctions: Record<string, (prev: any) => any> = {
            userName: (prev: User) => ({ ...prev, name: prev.name ? prev.name + transcript : transcript }),
            userClass: (prev: User) => ({ ...prev, class: prev.class ? prev.class + transcript : transcript }),
            instName: (prev: Institution) => ({ ...prev, name: prev.name ? prev.name + transcript : transcript }),
            address: (prev: Institution) => ({ ...prev, address: prev.address ? prev.address + transcript : transcript }),
            phoneNumber: (prev: Institution) => ({ ...prev, phoneNumber: prev.phoneNumber ? prev.phoneNumber + transcript : transcript }),
        };

        if (voiceTarget in updateFunctions) {
            if (['userName', 'userClass'].includes(voiceTarget)) {
                setEditableUser(updateFunctions[voiceTarget]);
            } else {
                setEditableInstitution(updateFunctions[voiceTarget]);
            }
        }
    }, [voiceTarget]);

    const { isListening, toggleListening, isSupported } = useSpeechRecognition(handleTranscript);

    const toggleListeningFor = (target: string) => {
        if (isListening && voiceTarget !== target) {
            return;
        }
        setVoiceTarget(target);
        toggleListening();
    };


    const infoHeader = user.role === UserRole.TEACHER 
        ? translate('Teacher Information') 
        : translate('Student Information');

    const classLabel = user.role === UserRole.TEACHER ? translate('Department / Subject') : translate('Class');
    const backText = backButtonText || translate('Back to Dashboard');


    useEffect(() => {
        setEditableUser(user);
        setEditableInstitution(institution);
    }, [user, institution]);

    useEffect(() => {
        if (!isEditing) {
            const textsToRead: TTSText[] = [
                { id: 'profile-name', text: translate(user.name) },
                { id: 'profile-role', text: translate(user.role) },
                { id: 'profile-info-header', text: infoHeader },
                { id: 'profile-class-label', text: classLabel },
                { id: 'profile-class', text: translate(user.class) },
                { id: 'profile-inst-details-header', text: translate('Institution Details') },
                { id: 'profile-inst-name-label', text: translate('Institution Name') },
                { id: 'profile-inst-name', text: translate(institution.name) },
                { id: 'profile-inst-address-label', text: translate('Address') },
                { id: 'profile-inst-address', text: translate(institution.address) },
                { id: 'profile-inst-contact-label', text: translate('Contact') },
                { id: 'profile-inst-contact', text: institution.phoneNumber },
            ];
            registerTexts(textsToRead);
        } else {
            registerTexts([]);
        }
    }, [user, institution, isEditing, registerTexts, translate, infoHeader, classLabel]);


    const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            const file = event.target.files[0];
            const newAvatarUrl = URL.createObjectURL(file);
            setEditableUser(prev => {
                if (prev.avatarUrl && prev.avatarUrl.startsWith('blob:')) {
                    URL.revokeObjectURL(prev.avatarUrl);
                }
                return { ...prev, avatarUrl: newAvatarUrl };
            });
        }
    };

    const handleUserChange = (name: string, value: string) => {
        setEditableUser(prev => ({ ...prev, [name]: value }));
    };

    const handleInstitutionChange = (name: string, value: string) => {
        setEditableInstitution(prev => ({ ...prev, [name]: value }));
    };

    const handleCancel = () => {
        if (editableUser.avatarUrl && editableUser.avatarUrl.startsWith('blob:')) {
            URL.revokeObjectURL(editableUser.avatarUrl);
        }
        setEditableUser(user);
        setEditableInstitution(institution);
        setIsEditing(false);
    };

    const handleSave = () => {
        let finalUser = { ...editableUser };
        // If the avatarUrl is a blob, it means it's a temporary new image.
        // In a real app, you would upload this blob to a server and get back a permanent URL.
        // For this demo, we'll keep the blob URL, but if the user removed the image, ensure it's an empty string.
        if (editableUser.avatarUrl === '') {
             finalUser.avatarUrl = '';
        }
        onSave(finalUser, editableInstitution);
        setIsEditing(false);
    };
    
    const avatarUrl = isEditing ? editableUser.avatarUrl : user.avatarUrl;


    return (
        <div className="max-w-4xl mx-auto">
             <div className="flex justify-between items-center mb-6">
                <button
                    onClick={onBack}
                    className="flex items-center space-x-2 text-teal-600 dark:text-teal-400 hover:underline font-semibold"
                    aria-label={backText}
                >
                    <ArrowLeftIcon className="h-5 w-5" />
                    <span>{backText}</span>
                </button>
                
                {isEditing ? (
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={handleCancel}
                            className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-full hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 transition-colors"
                        >
                            {translate('Cancel')}
                        </button>
                        <button
                            onClick={handleSave}
                            className="bg-teal-600 text-white font-bold py-2 px-4 rounded-full hover:bg-teal-700 transition-colors"
                        >
                            {translate('Save')}
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="flex items-center space-x-2 bg-teal-600 text-white font-bold py-2 px-4 rounded-full hover:bg-teal-700 transition-colors"
                    >
                        <PencilIcon className="h-5 w-5" />
                        <span>{translate('Edit Profile')}</span>
                    </button>
                )}
            </div>


            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
                <div className="p-6 md:p-8 bg-gray-50 dark:bg-gray-800/50">
                    <div className="flex flex-col sm:flex-row items-center">
                        <div className="relative">
                           {avatarUrl ? (
                                <img
                                    src={avatarUrl}
                                    alt={user.name}
                                    className="h-28 w-28 rounded-full border-4 border-teal-500 object-cover shadow-lg"
                                    key={avatarUrl}
                                />
                            ) : (
                                <div className="h-28 w-28 rounded-full border-4 border-teal-500 object-cover bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                    <UserCircleIcon className="h-24 w-24 text-gray-400 dark:text-gray-500" />
                                </div>
                            )}
                            
                            {isEditing && (
                                <>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleAvatarChange}
                                        accept="image/*"
                                        className="hidden"
                                    />
                                    <div className="absolute -bottom-2 -right-2 flex items-center space-x-1">
                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            className="bg-white dark:bg-gray-700 p-2 rounded-full shadow-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                            aria-label={translate("Change profile picture")}
                                        >
                                            <CameraIcon className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                                        </button>
                                        {editableUser.avatarUrl && (
                                            <button
                                                onClick={() => setEditableUser(prev => ({ ...prev, avatarUrl: '' }))}
                                                className="bg-white dark:bg-gray-700 p-2 rounded-full shadow-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                                aria-label={translate("Remove profile picture")}
                                            >
                                                <TrashIcon className="h-5 w-5 text-red-600 dark:text-red-400" />
                                            </button>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                        <div className="mt-4 sm:mt-0 sm:ml-6 text-center sm:text-left">
                           {isEditing ? (
                               <div className="relative">
                                    <input
                                        type="text"
                                        name="name"
                                        value={editableUser.name}
                                        onChange={(e) => handleUserChange(e.target.name, e.target.value)}
                                        className="text-4xl font-bold text-gray-900 dark:text-white bg-transparent border-b-2 border-gray-300 dark:border-gray-600 focus:outline-none focus:border-teal-500 w-full pr-12"
                                        aria-label={translate("Your Name")}
                                    />
                                    <div className="absolute inset-y-0 right-0 flex items-center">
                                        {isSupported && <VoiceInputButton onTranscript={() => {}} isListening={isListening && voiceTarget === 'userName'} toggleListening={() => toggleListeningFor('userName')} />}
                                    </div>
                               </div>
                            ) : (
                                <h1 id="profile-name" className={`text-4xl font-bold text-gray-900 dark:text-white ${currentlySpokenId === 'profile-name' ? 'tts-highlight' : ''}`}>{user.name}</h1>
                            )}
                            <p id="profile-role" className={`text-lg text-gray-600 dark:text-gray-400 ${currentlySpokenId === 'profile-role' ? 'tts-highlight' : ''}`}>{translate(user.role)}</p>
                        </div>
                    </div>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700">
                    <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                        <div>
                           <h2 id="profile-info-header" className={`text-xl font-bold text-gray-800 dark:text-white mb-2 ${currentlySpokenId === 'profile-info-header' ? 'tts-highlight' : ''}`}>{infoHeader}</h2>
                           <div className="divide-y divide-gray-200 dark:divide-gray-700">
                                <InfoRow 
                                    id="profile-class"
                                    labelId="profile-class-label"
                                    isHighlighted={currentlySpokenId === 'profile-class'} 
                                    labelIsHighlighted={currentlySpokenId === 'profile-class-label'}
                                    icon={<UserCircleIcon className="h-6 w-6" />}
                                    label={classLabel}
                                    value={isEditing ? editableUser.class : user.class}
                                    name="class"
                                    onChange={handleUserChange}
                                    isEditing={isEditing}
                                    isVoiceSupported={isSupported}
                                    isVoiceListening={isListening && voiceTarget === 'userClass'}
                                    onToggleVoice={() => toggleListeningFor('userClass')}
                                />
                           </div>
                        </div>
                        <div>
                            <h2 id="profile-inst-details-header" className={`text-xl font-bold text-gray-800 dark:text-white mb-2 ${currentlySpokenId === 'profile-inst-details-header' ? 'tts-highlight' : ''}`}>{translate('Institution Details')}</h2>
                            <div className="divide-y divide-gray-200 dark:divide-gray-700">
                                <InfoRow
                                    id="profile-inst-name"
                                    labelId="profile-inst-name-label"
                                    isHighlighted={currentlySpokenId === 'profile-inst-name'}
                                    labelIsHighlighted={currentlySpokenId === 'profile-inst-name-label'}
                                    icon={<SchoolIcon className="h-6 w-6" />}
                                    label={translate('Institution Name')}
                                    value={isEditing ? editableInstitution.name : institution.name}
                                    name="name"
                                    onChange={handleInstitutionChange}
                                    isEditing={isEditing} 
                                    isVoiceSupported={isSupported}
                                    isVoiceListening={isListening && voiceTarget === 'instName'}
                                    onToggleVoice={() => toggleListeningFor('instName')}
                                />
                                <InfoRow
                                    id="profile-inst-address"
                                    labelId="profile-inst-address-label"
                                    isHighlighted={currentlySpokenId === 'profile-inst-address'}
                                    labelIsHighlighted={currentlySpokenId === 'profile-inst-address-label'}
                                    icon={<LocationIcon className="h-6 w-6" />}
                                    label={translate('Address')}
                                    value={isEditing ? editableInstitution.address : institution.address}
                                    name="address"
                                    onChange={handleInstitutionChange}
                                    isEditing={isEditing}
                                    isVoiceSupported={isSupported}
                                    isVoiceListening={isListening && voiceTarget === 'address'}
                                    onToggleVoice={() => toggleListeningFor('address')}
                                />
                                <InfoRow
                                    id="profile-inst-contact"
                                    labelId="profile-inst-contact-label"
                                    isHighlighted={currentlySpokenId === 'profile-inst-contact'}
                                    labelIsHighlighted={currentlySpokenId === 'profile-inst-contact-label'}
                                    icon={<PhoneIcon className="h-6 w-6" />}
                                    label={translate('Contact')}
                                    value={isEditing ? editableInstitution.phoneNumber : institution.phoneNumber}
                                    name="phoneNumber"
                                    onChange={handleInstitutionChange}
                                    isEditing={isEditing}
                                    isVoiceSupported={isSupported}
                                    isVoiceListening={isListening && voiceTarget === 'phoneNumber'}
                                    onToggleVoice={() => toggleListeningFor('phoneNumber')}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
