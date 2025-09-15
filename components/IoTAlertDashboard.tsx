import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useTranslate } from '../contexts/TranslationContext';
import { useTTS, type TTSText } from '../contexts/TTSContext';
import type { ActiveAlert } from '../App';
import { generateContent } from '../services/aiService';
import { Type } from '@google/genai';
import { FireIcon } from './icons/FireIcon';
import { VibrationIcon } from './icons/VibrationIcon';
import { CameraIcon } from './icons/CameraIcon';
import { StopCircleIcon } from './icons/StopCircleIcon';
import ErrorMessage from './ErrorMessage';
import SeismographChart from './SeismographChart';

interface IoTAlertDashboardProps {
    activeAlert: ActiveAlert;
    onTriggerAlert: (alert: ActiveAlert) => void;
}

const IoTAlertDashboard: React.FC<IoTAlertDashboardProps> = ({ activeAlert, onTriggerAlert }) => {
    const { translate } = useTranslate();
    const { registerTexts, currentlySpokenId } = useTTS();

    // Fire Scanner State
    const [isCameraOn, setIsCameraOn] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [fireAnalysisResult, setFireAnalysisResult] = useState<{ is_fire: boolean; safety_instructions: string } | null>(null);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const cameraStreamRef = useRef<MediaStream | null>(null);

    // Audio Seismograph State
    const [isMonitoring, setIsMonitoring] = useState(false);
    const [waveData, setWaveData] = useState<number[]>([]);
    const [seismicError, setSeismicError] = useState<string | null>(null);
    const [latestMagnitude, setLatestMagnitude] = useState<string | null>(null);
    const [lastAlertTime, setLastAlertTime] = useState(0);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const audioStreamRef = useRef<MediaStream | null>(null);
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const animationFrameRef = useRef<number | null>(null);

    const VOLUME_THRESHOLD = 115; // A loud clap or shout, out of 128
    const ALERT_COOLDOWN = 5000; // 5 seconds

    const headerText = translate('Interactive Digital Sensors');
    const subheaderText = translate('Use your device\'s hardware to simulate real-time disaster detection.');

    // TTS Registration
    useEffect(() => {
        const textsToRead: TTSText[] = [
            { id: 'iot-header', text: headerText },
            { id: 'iot-subheader', text: subheaderText },
        ];
        registerTexts(textsToRead);
    }, [registerTexts, translate, headerText, subheaderText]);
    
    // --- Fire Scanner Logic ---
    const stopCamera = useCallback(() => {
        if (cameraStreamRef.current) {
            cameraStreamRef.current.getTracks().forEach(track => track.stop());
            cameraStreamRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
    }, []);

    useEffect(() => {
        const startCamera = async () => {
            if (isCameraOn && videoRef.current) {
                setCameraError(null);
                setFireAnalysisResult(null);

                if (!navigator.mediaDevices?.getUserMedia) {
                    setCameraError(translate("Camera access is not supported by your browser."));
                    setIsCameraOn(false);
                    return;
                }

                try {
                    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
                    cameraStreamRef.current = stream;
                    videoRef.current.srcObject = stream;
                    await videoRef.current.play();
                } catch (err) {
                    console.error("Camera access error:", err);
                    if (err instanceof DOMException) {
                        if (err.name === "NotAllowedError") {
                            setCameraError(translate("Camera access was denied. Please enable it in your browser settings."));
                        } else if (err.name === "NotReadableError") {
                            setCameraError(translate("The camera is already in use by another application."));
                        } else {
                            setCameraError(`${translate("Could not access the camera:")} ${err.message}`);
                        }
                    } else {
                        setCameraError(translate("An unknown error occurred while accessing the camera."));
                    }
                    setIsCameraOn(false); // Turn off on error
                }
            }
        };

        startCamera();

        return () => {
            stopCamera();
        };
    }, [isCameraOn, translate, stopCamera]);

    const handleToggleCamera = () => {
        setIsCameraOn(prev => !prev);
    };

    const handleAnalyzeFrame = async () => {
        if (!videoRef.current || videoRef.current.paused || videoRef.current.ended || videoRef.current.readyState < 3) {
            setCameraError(translate("Camera feed is not ready. Please try again."));
            return;
        }
        setIsAnalyzing(true);
        setFireAnalysisResult(null);
        setCameraError(null);

        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            setCameraError(translate("Could not process video frame."));
            setIsAnalyzing(false);
            return;
        }
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const base64Image = canvas.toDataURL('image/jpeg').split(',')[1];
        if (!base64Image) {
            setCameraError(translate("Could not capture video frame."));
            setIsAnalyzing(false);
            return;
        }
        
        try {
            const response = await generateContent({
                model: 'gemini-2.5-flash',
                contents: { parts: [
                    { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
                    { text: "Analyze this image for the presence of fire or significant smoke. Respond ONLY with a JSON object with this schema: { \"is_fire\": boolean, \"safety_instructions\": \"A brief safety tip if fire is detected, otherwise an empty string.\" }" }
                ]},
                config: {
                    responseMimeType: 'application/json',
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            is_fire: { type: Type.BOOLEAN },
                            safety_instructions: { type: Type.STRING },
                        },
                        required: ['is_fire', 'safety_instructions'],
                    }
                }
            });

            const result = JSON.parse(response.text.trim());
            setFireAnalysisResult(result);
            if (result.is_fire) {
                onTriggerAlert({ type: 'fire' });
            }
        } catch (err) {
            if (err instanceof Error) setCameraError(err.message);
        } finally {
            setIsAnalyzing(false);
        }
    };

    // --- Device Seismograph Logic ---
    const processAudio = useCallback(() => {
        if (!analyserRef.current) return;

        const bufferLength = analyserRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyserRef.current.getByteTimeDomainData(dataArray);

        let peakAmplitude = 0;
        for (let i = 0; i < bufferLength; i++) {
            const v = dataArray[i];
            const amplitude = Math.abs(v - 128); // 128 is the zero-point for audio waveform
            if (amplitude > peakAmplitude) {
                peakAmplitude = amplitude;
            }
        }
        
        // Add a little baseline noise for visual effect
        const finalMagnitude = peakAmplitude > 2 ? peakAmplitude : (Math.random() * 1.5);
        
        setWaveData(prev => [...prev.slice(-150), finalMagnitude]);

        if (peakAmplitude > VOLUME_THRESHOLD) {
            const now = Date.now();
            if (now - lastAlertTime > ALERT_COOLDOWN) {
                setLastAlertTime(now);

                // Calculate magnitude based on how much the threshold was exceeded
                const minMag = 2.5; // Richter scale starts around here for felt tremors
                const maxMag = 8.0; // A plausible max for a device simulation
                const minAmp = VOLUME_THRESHOLD; // 115
                const maxAmp = 128; // Max possible amplitude
                
                const magnitude = minMag + ((peakAmplitude - minAmp) / (maxAmp - minAmp)) * (maxMag - minMag);
                const magnitudeStr = magnitude.toFixed(1);

                setLatestMagnitude(magnitudeStr); // Update local display
                onTriggerAlert({ type: 'seismic', details: { magnitude: magnitudeStr } });
            }
        }

        animationFrameRef.current = requestAnimationFrame(processAudio);
    }, [lastAlertTime, onTriggerAlert]);

    const stopAudioMonitoring = useCallback(() => {
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }
        if (audioStreamRef.current) {
            audioStreamRef.current.getTracks().forEach(track => track.stop());
            audioStreamRef.current = null;
        }
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close();
        }
        sourceRef.current?.disconnect();
        analyserRef.current?.disconnect();
        audioContextRef.current = null;
        sourceRef.current = null;
        analyserRef.current = null;
        setWaveData([]); // Clear data to reset the chart
        setLatestMagnitude(null); // Clear magnitude display
    }, []);

    const startAudioMonitoring = useCallback(async () => {
        setSeismicError(null);
        if (!navigator.mediaDevices?.getUserMedia) {
            setSeismicError(translate("Device sensor access is not supported by your browser."));
            setIsMonitoring(false);
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
            audioStreamRef.current = stream;
            const context = new (window.AudioContext || (window as any).webkitAudioContext)();
            audioContextRef.current = context;
            const source = context.createMediaStreamSource(stream);
            sourceRef.current = source;
            const analyser = context.createAnalyser();
            analyser.fftSize = 2048;
            analyserRef.current = analyser;
            
            source.connect(analyser);

            processAudio();
        } catch (err) {
            console.error("Audio access error:", err);
            if (err instanceof DOMException && err.name === "NotAllowedError") {
                setSeismicError(translate("Permission for device sensors was denied. Please grant microphone access when prompted to use this feature."));
            } else {
                setSeismicError(translate("Could not access the required device sensor."));
            }
            setIsMonitoring(false);
        }
    }, [processAudio, translate]);

    useEffect(() => {
        if (isMonitoring) {
            startAudioMonitoring();
        } else {
            stopAudioMonitoring();
        }
        return () => {
            stopAudioMonitoring();
        };
    }, [isMonitoring, startAudioMonitoring, stopAudioMonitoring]);
    
    // Cleanup camera on component unmount
    useEffect(() => {
        return () => {
            stopCamera();
        };
    }, [stopCamera]);
    
    return (
        <div>
            <div className="mb-8">
                <h1 id="iot-header" className={`text-4xl font-extrabold text-gray-800 dark:text-white ${currentlySpokenId === 'iot-header' ? 'tts-highlight' : ''}`}>{headerText}</h1>
                <p id="iot-subheader" className={`text-gray-600 dark:text-gray-400 mt-2 ${currentlySpokenId === 'iot-subheader' ? 'tts-highlight' : ''}`}>{subheaderText}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Fire Scanner Card */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6 flex flex-col">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-rose-100 dark:bg-rose-900/50 rounded-full"><FireIcon className="h-8 w-8 text-rose-600 dark:text-rose-400" /></div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{translate('AI Fire Scanner')}</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{translate('Use your camera to detect fire.')}</p>
                        </div>
                    </div>
                    {isCameraOn ? (
                        <div className="flex-grow flex flex-col">
                            <video ref={videoRef} autoPlay playsInline muted className="w-full h-48 bg-black rounded-lg object-cover mb-4"></video>
                            {cameraError && <ErrorMessage message={cameraError}/>}
                            {fireAnalysisResult && (
                                <div className={`p-3 rounded-lg text-center font-bold ${fireAnalysisResult.is_fire ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200'}`}>
                                    {fireAnalysisResult.is_fire ? translate('FIRE DETECTED!') : translate('No Fire Detected')}
                                    {fireAnalysisResult.safety_instructions && <p className="text-sm font-normal mt-1">{translate(fireAnalysisResult.safety_instructions)}</p>}
                                </div>
                            )}
                            <div className="flex gap-2 mt-4">
                                <button onClick={handleAnalyzeFrame} disabled={isAnalyzing} className="flex-1 flex items-center justify-center gap-2 bg-teal-600 text-white font-bold py-2 px-4 rounded-full hover:bg-teal-700 disabled:opacity-50">
                                    <CameraIcon className="h-5 w-5"/> {isAnalyzing ? translate('Analyzing...') : translate('Analyze Frame')}
                                </button>
                                <button onClick={handleToggleCamera} className="p-3 bg-gray-200 dark:bg-gray-600 rounded-full hover:bg-gray-300"><StopCircleIcon className="h-5 w-5"/></button>
                            </div>
                        </div>
                    ) : (
                         <div className="flex flex-col flex-grow justify-center">
                            {cameraError && <ErrorMessage message={cameraError}/>}
                            <button onClick={handleToggleCamera} className="w-full mt-auto bg-rose-600 text-white font-bold py-3 px-4 rounded-full hover:bg-rose-700 transition-colors flex items-center justify-center gap-2">
                                <CameraIcon className="h-6 w-6"/> {translate('Activate Fire Scanner')}
                            </button>
                         </div>
                    )}
                </div>

                {/* Device Seismograph Card */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6 flex flex-col">
                     <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-sky-100 dark:bg-sky-900/50 rounded-full"><VibrationIcon className="h-8 w-8 text-sky-600 dark:text-sky-400" /></div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{translate('Device Seismograph')}</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{translate('Simulates seismic wave detection using your device.')}</p>
                        </div>
                    </div>
                    <div className="relative flex-grow h-48 mb-4 bg-gray-900 rounded-lg p-2">
                       <SeismographChart data={waveData} />
                       {latestMagnitude && (
                            <div className="absolute top-2 right-2 bg-black/50 text-white p-2 rounded-lg text-center backdrop-blur-sm">
                                <p className="text-xs font-bold uppercase tracking-wider">{translate('Magnitude')}</p>
                                <p className="text-2xl font-mono font-bold text-amber-300">{latestMagnitude}</p>
                            </div>
                       )}
                    </div>
                    {seismicError && <ErrorMessage message={seismicError} />}
                     <button onClick={() => setIsMonitoring(prev => !prev)} className={`w-full mt-auto font-bold py-3 px-4 rounded-full transition-colors flex items-center justify-center gap-2 ${isMonitoring ? 'bg-amber-500 hover:bg-amber-600 text-white' : 'bg-sky-600 hover:bg-sky-700 text-white'}`}>
                        {isMonitoring ? <><StopCircleIcon className="h-6 w-6"/> {translate('Stop Monitoring')}</> : <><VibrationIcon className="h-6 w-6"/> {translate('Activate Seismograph')}</>}
                    </button>
                </div>
            </div>
             {activeAlert && (
                <div className={`mt-6 p-4 rounded-lg font-bold text-center text-white animate-pulse-fast ${activeAlert.type === 'fire' ? 'bg-red-600' : 'bg-amber-500'}`}>
                    {activeAlert.type === 'fire' ? translate('GLOBAL FIRE ALERT TRIGGERED!') : translate('GLOBAL SEISMIC ALERT TRIGGERED!')}
                </div>
            )}
        </div>
    );
};

export default IoTAlertDashboard;