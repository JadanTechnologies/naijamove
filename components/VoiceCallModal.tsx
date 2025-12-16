import React, { useState, useEffect } from 'react';
import { Phone, Mic, MicOff, PhoneOff, User } from 'lucide-react';
import { speak } from '../services/mockService';

interface VoiceCallModalProps {
    recipientName: string;
    recipientRole: string;
    onEndCall: () => void;
}

export const VoiceCallModal: React.FC<VoiceCallModalProps> = ({ recipientName, recipientRole, onEndCall }) => {
    const [status, setStatus] = useState<'CONNECTING' | 'RINGING' | 'CONNECTED'>('CONNECTING');
    const [isMuted, setIsMuted] = useState(false);
    const [duration, setDuration] = useState(0);

    useEffect(() => {
        // Announce call initiation
        speak(`Calling ${recipientName}`);

        const timer1 = setTimeout(() => {
            setStatus('RINGING');
        }, 1500);

        const timer2 = setTimeout(() => {
            setStatus('CONNECTED');
            speak("Call connected.");
        }, 4000);

        return () => {
            clearTimeout(timer1);
            clearTimeout(timer2);
        };
    }, [recipientName]);

    useEffect(() => {
        let interval: any;
        if (status === 'CONNECTED') {
            interval = setInterval(() => {
                setDuration(prev => prev + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [status]);

    const handleEndCall = () => {
        speak("Call ended.");
        onEndCall();
    };

    const formatDuration = (secs: number) => {
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <div className="fixed inset-0 bg-gray-900/90 z-[9999] flex items-center justify-center animate-in fade-in backdrop-blur-sm">
            <div className="bg-gray-800 w-full max-w-sm rounded-3xl p-8 flex flex-col items-center shadow-2xl border border-gray-700 relative overflow-hidden">
                {/* Background Pulse Effect */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl animate-pulse pointer-events-none"></div>

                <div className="relative z-10 flex flex-col items-center w-full">
                    <div className="flex items-center gap-2 mb-8 bg-gray-700/50 px-3 py-1 rounded-full border border-gray-600">
                        <div className={`w-2 h-2 rounded-full ${status === 'CONNECTED' ? 'bg-emerald-500' : 'bg-yellow-500 animate-pulse'}`}></div>
                        <span className="text-xs text-gray-300 font-mono">ENCRYPTED VOICE</span>
                    </div>

                    <div className="w-24 h-24 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/20 ring-4 ring-gray-700">
                        <User size={40} className="text-white" />
                    </div>

                    <h2 className="text-2xl font-bold text-white mb-1 text-center">{recipientName}</h2>
                    <p className="text-emerald-400 text-sm font-medium mb-8 uppercase tracking-wider">{recipientRole}</p>

                    <div className="text-gray-400 text-lg font-mono mb-12 h-8">
                        {status === 'CONNECTING' && <span className="animate-pulse">Connecting...</span>}
                        {status === 'RINGING' && <span className="animate-pulse">Ringing...</span>}
                        {status === 'CONNECTED' && <span className="text-white font-bold">{formatDuration(duration)}</span>}
                    </div>

                    <div className="flex gap-8 items-center">
                        <button 
                            onClick={() => setIsMuted(!isMuted)}
                            className={`p-4 rounded-full transition-all border ${isMuted ? 'bg-white text-gray-900 border-white' : 'bg-gray-700 text-white border-gray-600 hover:bg-gray-600'}`}
                        >
                            {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
                        </button>

                        <button 
                            onClick={handleEndCall}
                            className="p-6 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-lg shadow-red-500/30 transition-transform hover:scale-110 active:scale-95 border-4 border-gray-800"
                        >
                            <PhoneOff size={32} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};