import React, { useState } from 'react';
import { ShieldCheckIcon } from './icons/ShieldCheckIcon';
import { UserRole } from '../types';
import { useTranslate } from '../contexts/TranslationContext';
import { supabase } from '../services/supabaseClient';


const Auth: React.FC = () => {
    const [isLoginView, setIsLoginView] = useState(true);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    
    // Form state
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<UserRole>(UserRole.STUDENT);
    const [institutionName, setInstitutionName] = useState('');
    const [classOrDept, setClassOrDept] = useState('');

    const { translate } = useTranslate();

    const titleText = translate('Surksha');
    const subtitleText = isLoginView ? translate('Sign in to continue') : translate('Create a new account');
    
    const resetForm = () => {
        setFullName('');
        setEmail('');
        setPassword('');
        setRole(UserRole.STUDENT);
        setInstitutionName('');
        setClassOrDept('');
        setError('');
    };

    const handleSignIn = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!navigator.onLine) {
            setError(translate('You are currently offline. Please check your connection.'));
            return;
        }
        setLoading(true);
        setError('');

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            setError(error.message);
        }
        // onAuthStateChange in App.tsx will handle successful login
        setLoading(false);
    };
    
    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!navigator.onLine) {
            setError(translate('You are currently offline. Please check your connection.'));
            return;
        }
        if (!fullName.trim() || !email.trim() || !password.trim() || !institutionName.trim() || !classOrDept.trim()) {
            setError(translate('All fields are required.'));
            return;
        }
        setLoading(true);
        setError('');

        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    fullName: fullName.trim(),
                    role,
                    institutionName: institutionName.trim(),
                    class: classOrDept.trim(),
                }
            }
        });
        
        if (error) {
             setError(error.message);
        }
        // onAuthStateChange in App.tsx will handle successful signup
        setLoading(false);
    };

    const toggleView = () => {
        setIsLoginView(!isLoginView);
        resetForm();
    };

    const classLabel = role === UserRole.STUDENT 
    ? translate('Class / Grade') 
    : role === UserRole.TEACHER 
    ? translate('Department / Subject')
    : role === UserRole.USER
    ? translate('Community / Group')
    : translate('Department Name');

    const institutionLabel = role === UserRole.GOVERNMENT_OFFICIAL 
        ? translate('Ministry Name')
        : role === UserRole.USER
        ? translate('City / Region')
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
                    {!isLoginView && (
                        <div>
                            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                {translate('Full Name')}
                            </label>
                            <input
                                type="text"
                                id="fullName"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                required
                                className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-teal-500 focus:border-teal-500 text-gray-900 dark:text-gray-200"
                            />
                        </div>
                    )}
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            {translate('Email Address')}
                        </label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
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
                    
                    {!isLoginView && (
                         <>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{translate('I am a:')}</label>
                                <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2">
                                    <label className="flex items-center cursor-pointer">
                                        <input type="radio" name="role" value={UserRole.STUDENT} checked={role === UserRole.STUDENT} onChange={() => setRole(UserRole.STUDENT)} className="h-4 w-4 text-teal-600 border-gray-300 focus:ring-teal-500" />
                                        <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">{translate('Student')}</span>
                                    </label>
                                    <label className="flex items-center cursor-pointer">
                                        <input type="radio" name="role" value={UserRole.TEACHER} checked={role === UserRole.TEACHER} onChange={() => setRole(UserRole.TEACHER)} className="h-4 w-4 text-teal-600 border-gray-300 focus:ring-teal-500" />
                                        <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">{translate('Teacher')}</span>
                                    </label>
                                    <label className="flex items-center cursor-pointer">
                                        <input type="radio" name="role" value={UserRole.USER} checked={role === UserRole.USER} onChange={() => setRole(UserRole.USER)} className="h-4 w-4 text-teal-600 border-gray-300 focus:ring-teal-500" />
                                        <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">{translate('User')}</span>
                                    </label>
                                    <label className="flex items-center cursor-pointer">
                                        <input type="radio" name="role" value={UserRole.GOVERNMENT_OFFICIAL} checked={role === UserRole.GOVERNMENT_OFFICIAL} onChange={() => setRole(UserRole.GOVERNMENT_OFFICIAL)} className="h-4 w-4 text-teal-600 border-gray-300 focus:ring-teal-500" />
                                        <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">{translate('Official')}</span>
                                    </label>
                                </div>
                            </div>
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
