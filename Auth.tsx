import React, { useState, useEffect } from 'react';
import { ShieldCheckIcon } from './icons/ShieldCheckIcon';
import { UserRole } from './types';
import { useTranslate } from './contexts/TranslationContext';
import { useTTS, type TTSText } from './contexts/TTSContext';
import { supabase } from './services/supabaseClient';
import { handleApiError } from './services/apiErrorHandler';

const Auth: React.FC = () => {
  const [isLoginView, setIsLoginView] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [classInfo, setClassInfo] = useState('');
  const [institutionName, setInstitutionName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.STUDENT);
  const { translate } = useTranslate();
  const { registerTexts, currentlySpokenId } = useTTS();

  const titleText = translate('Disaster Ready');
  const subtitleText = isLoginView ? translate('Sign in to your account') : translate('Create a new account');
  const emailLabel = translate('Email Address');
  const nameLabel = translate('Full Name');
  const passwordLabel = translate('Password');
  const classLabel = selectedRole === UserRole.STUDENT ? translate('Class') : translate('Department / Subject');
  const institutionLabel = translate('Institution Name');

  useEffect(() => {
    const textsToRead: TTSText[] = [
      { id: 'auth-title', text: titleText },
      { id: 'auth-subtitle', text: subtitleText },
      { id: 'auth-email-label', text: emailLabel },
      { id: 'auth-password-label', text: passwordLabel },
    ];
    if (!isLoginView) {
        textsToRead.push({ id: 'auth-name-label', text: nameLabel });
        textsToRead.push({ id: 'auth-institution-label', text: institutionLabel });
        textsToRead.push({ id: 'auth-class-label', text: classLabel });
    }
    registerTexts(textsToRead);
  }, [isLoginView, titleText, subtitleText, emailLabel, nameLabel, institutionLabel, passwordLabel, classLabel, registerTexts]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (isLoginView) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(handleApiError(error));
      }
      // The onAuthStateChange listener in App.tsx will handle success.
      setLoading(false);
    } else {
      // --- SIGN UP LOGIC ---
      if (!name || !password || !classInfo || !institutionName) {
        setError(translate('All fields are required.'));
        setLoading(false);
        return;
      }

      // Sign up the new user, passing all metadata for the database trigger to use.
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                name: name,
                role: selectedRole,
                classInfo: classInfo,
                institutionName: institutionName.trim(),
                rollNumber: '', // Not collected on this form
            },
        },
      });

      if (signUpError) {
        setError(handleApiError(signUpError));
        setLoading(false);
      } else {
        // Sign-up was successful, now attempt to sign in immediately.
        // This provides a seamless experience if email confirmation is off.
        // If it's on, this will show a clear "Email not confirmed" error.
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) {
            setError(handleApiError(signInError));
        }
        // The onAuthStateChange listener in App.tsx will handle successful login.
        setLoading(false);
      }
    }
  };

  const toggleView = () => {
    setIsLoginView(!isLoginView);
    setError('');
    setEmail('');
    setPassword('');
    setName('');
    setClassInfo('');
    setInstitutionName('');
  };

  return (
    <div className="fixed inset-0 bg-gray-100/70 dark:bg-gray-900/70 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-sm p-8">
        <div className="flex flex-col items-center mb-6">
          <ShieldCheckIcon className="h-12 w-12 text-teal-600 dark:text-teal-400" />
          <h1 id="auth-title" className={`text-3xl font-bold text-gray-800 dark:text-white mt-2 ${currentlySpokenId === 'auth-title' ? 'tts-highlight' : ''}`}>
            {titleText}
          </h1>
          <p id="auth-subtitle" className={`text-gray-600 dark:text-gray-400 ${currentlySpokenId === 'auth-subtitle' ? 'tts-highlight' : ''}`}>
            {subtitleText}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
             {!isLoginView && (
              <div>
                <label 
                  htmlFor="name" 
                  id="auth-name-label" 
                  className={`block text-sm font-medium text-gray-700 dark:text-gray-300 ${currentlySpokenId === 'auth-name-label' ? 'tts-highlight' : ''}`}
                >
                  {nameLabel}
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
            )}
            <div>
              <label 
                htmlFor="email" 
                id="auth-email-label" 
                className={`block text-sm font-medium text-gray-700 dark:text-gray-300 ${currentlySpokenId === 'auth-email-label' ? 'tts-highlight' : ''}`}
              >
                {emailLabel}
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
              <label 
                htmlFor="password"
                id="auth-password-label"
                className={`block text-sm font-medium text-gray-700 dark:text-gray-300 ${currentlySpokenId === 'auth-password-label' ? 'tts-highlight' : ''}`}
              >
                {passwordLabel}
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {translate('I am a:')}
              </label>
              <div className="mt-2 flex space-x-4">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="role"
                    value={UserRole.STUDENT}
                    checked={selectedRole === UserRole.STUDENT}
                    onChange={() => setSelectedRole(UserRole.STUDENT)}
                    className="h-4 w-4 text-teal-600 border-gray-300 focus:ring-teal-500"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">{translate('Student')}</span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="role"
                    value={UserRole.TEACHER}
                    checked={selectedRole === UserRole.TEACHER}
                    onChange={() => setSelectedRole(UserRole.TEACHER)}
                    className="h-4 w-4 text-teal-600 border-gray-300 focus:ring-teal-500"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">{translate('Teacher')}</span>
                </label>
              </div>
            </div>

            {!isLoginView && (
              <>
                <div>
                  <label 
                    htmlFor="institutionName"
                    id="auth-institution-label"
                    className={`block text-sm font-medium text-gray-700 dark:text-gray-300 ${currentlySpokenId === 'auth-institution-label' ? 'tts-highlight' : ''}`}
                  >
                    {institutionLabel}
                  </label>
                  <input
                    type="text"
                    id="institutionName"
                    value={institutionName}
                    onChange={(e) => setInstitutionName(e.target.value)}
                    required
                    placeholder={translate('e.g., Delhi Public School')}
                    className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-teal-500 focus:border-teal-500 text-gray-900 dark:text-gray-200"
                  />
                </div>
                <div>
                  <label 
                    htmlFor="classInfo"
                    id="auth-class-label"
                    className={`block text-sm font-medium text-gray-700 dark:text-gray-300 ${currentlySpokenId === 'auth-class-label' ? 'tts-highlight' : ''}`}
                  >
                    {classLabel}
                  </label>
                  <input
                    type="text"
                    id="classInfo"
                    value={classInfo}
                    onChange={(e) => setClassInfo(e.target.value)}
                    required
                    placeholder={selectedRole === UserRole.STUDENT ? 'e.g., Grade 10, Section A' : 'e.g., Science Department'}
                    className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-teal-500 focus:border-teal-500 text-gray-900 dark:text-gray-200"
                  />
                </div>
              </>
            )}
          </div>

          {error && <p className="text-sm text-red-600 dark:text-red-400 text-center">{error}</p>}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-full shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:bg-gray-400"
            >
              {loading ? translate('Processing...') : (isLoginView ? translate('Sign In') : translate('Sign Up'))}
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