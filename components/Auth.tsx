

import React, { useState } from 'react';
import { ShieldCheckIcon } from './icons/ShieldCheckIcon';
import { UserRole } from '../types';
import { useTranslate } from '../contexts/TranslationContext';
import type { User } from '../types';

interface AuthProps {
    allUsers: User[];
    onLogin: (user: User) => void;
    onSignUp: (newUserData: Omit<User, 'id' | 'avatarUrl' | 'rollNumber' | 'avatarStyle' | 'homeAddress' | 'institutionAddress' | 'institutionPhone'>) => void;
}

const Auth: React.FC<AuthProps> = ({ allUsers, onLogin, onSignUp }) => {
    const [isLoginView, setIsLoginView] = useState(true);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    
    // Form state
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<UserRole>(UserRole.STUDENT);
    const [institutionName, setInstitutionName] = useState('');
    const [classOrDept, setClassOrDept] = useState('');

    const { translate } = useTranslate();

    const titleText = translate('Disaster Ready');
    const subtitleText = isLoginView ? translate('Sign in to continue') : translate('Create a new account');
    
    const resetForm = () => {
        setName('');
        setPassword('');
        setRole(UserRole.STUDENT);
        setInstitutionName('');
        setClassOrDept('');
        setError('');
    };

    const handleSignIn = (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const foundUser = allUsers.find(
            user => user.name.toLowerCase() === name.toLowerCase() &&
                    user.password === password &&
                    user.role === role
        );

        setTimeout(() => { // Simulate network delay
            if (foundUser) {
                onLogin(foundUser);
            } else {
                setError(translate('Invalid username, password, or role. Please try again.'));
            }
            setLoading(false);
        }, 500);
    };
    
    const handleSignUp = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !password.trim() || !institutionName.trim() || !classOrDept.trim()) {
            setError(translate('All fields are required.'));
            return;
        }
        setLoading(true);
        setError('');

        const existingUser = allUsers.find(user => user.name.toLowerCase() === name.toLowerCase());

        setTimeout(() => { // Simulate network delay
             if (existingUser) {
                setError(translate('A user with this name already exists. Please choose another name or sign in.'));
                setLoading(false);
                return;
            }
            
            onSignUp({
                name: name.trim(),
                password,
                role,
                institutionName: institutionName.trim(),
                class: classOrDept.trim(),
            });
            // App.tsx will handle the login, so we don't need to setLoading(false) here.
        }, 500);
    };

    const toggleView = () => {
        setIsLoginView(!isLoginView);
        resetForm();
    };

    const classLabel = role === UserRole.STUDENT 
    ? translate('Class / Grade') 
    : role === UserRole.TEACHER 
    ? translate('Department / Subject') 
    : translate('Department Name');

    const institutionLabel = role === UserRole.GOVERNMENT_OFFICIAL 
        ? translate('Ministry Name') 
        : translate('Institution Name');

    return (
        <div className="fixed inset-0 bg-gray-100/70 dark:bg-gray-900/70 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-sm p-8">
                <div className="flex flex-col items-center mb-6">
                    <ShieldCheckIcon className="h-12 w-12 text-teal-600 dark:text-teal-400" />
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-white mt-2">{titleText}</h1>
                    <p className="text-gray-600 dark:text-gray-400">{subtitleText}</p>
                </div>

                <form onSubmit={isLoginView ? handleSignIn : handleSignUp} className="space-y-4">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            {translate('Username')}
                        </label>
                        <input
                            type="text"
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-teal-500 focus:border-teal-500 text-gray-900 dark:text-gray-200"
                        />
                    </div>
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            {translate('Password')}
                        </label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-teal-500 focus:border-teal-500 text-gray-900 dark:text-gray-200"
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{isLoginView ? translate('Sign in as:') : translate('I am a:')}</label>
                        <div className="mt-2 grid grid-cols-3 gap-2">
                            <label className="flex items-center cursor-pointer">
                                <input type="radio" name="role" value={UserRole.STUDENT} checked={role === UserRole.STUDENT} onChange={() => setRole(UserRole.STUDENT)} className="h-4 w-4 text-teal-600 border-gray-300 focus:ring-teal-500" />
                                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">{translate('Student')}</span>
                            </label>
                            <label className="flex items-center cursor-pointer">
                                <input type="radio" name="role" value={UserRole.TEACHER} checked={role === UserRole.TEACHER} onChange={() => setRole(UserRole.TEACHER)} className="h-4 w-4 text-teal-600 border-gray-300 focus:ring-teal-500" />
                                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">{translate('Teacher')}</span>
                            </label>
                            <label className="flex items-center cursor-pointer">
                                <input type="radio" name="role" value={UserRole.GOVERNMENT_OFFICIAL} checked={role === UserRole.GOVERNMENT_OFFICIAL} onChange={() => setRole(UserRole.GOVERNMENT_OFFICIAL)} className="h-4 w-4 text-teal-600 border-gray-300 focus:ring-teal-500" />
                                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">{translate('Official')}</span>
                            </label>
                        </div>
                    </div>

                    {!isLoginView && (
                         <>
                            <div>
                                <label htmlFor="institutionName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    {institutionLabel}
                                </label>
                                <input type="text" id="institutionName" value={institutionName} onChange={(e) => setInstitutionName(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-teal-500 focus:border-teal-500 text-gray-900 dark:text-gray-200" />
                            </div>
                            <div>
                                <label htmlFor="classOrDept" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    {classLabel}
                                </label>
                                <input type="text" id="classOrDept" value={classOrDept} onChange={(e) => setClassOrDept(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-teal-500 focus:border-teal-500 text-gray-900 dark:text-gray-200" />
                            </div>
                        </>
                    )}
                    
                    {error && <p className="text-sm text-red-600 dark:text-red-400 text-center">{error}</p>}

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-full shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:bg-gray-400"
                        >
                            {loading ? translate('Processing...') : (isLoginView ? translate('Sign In') : translate('Sign Up & Continue'))}
                        </button>
                    </div>
                </form>

                <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
                    {isLoginView ? translate("Don't have an account?") : translate('Already have an account?')}
                    <button onClick={toggleView} className="font-medium text-teal-600 hover:text-teal-500 dark:text-teal-400 dark:hover:text-teal-300 ml-1">
                        {isLoginView ? translate('Sign Up') : translate('Sign In')}
                    </button>
                </p>
            </div>
        </div>
    );
};

export default Auth;