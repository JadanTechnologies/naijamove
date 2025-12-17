
import React, { useState, useRef, useEffect } from 'react';
import { User } from '../types';
import { MessageSquare, X, Mic, Send, Headphones, Paperclip, Phone, Globe, MicOff, Signal } from 'lucide-react';
import { createSupportTicket, queryAiAgent, speak } from '../services/mockService';
import { VoiceCallModal } from './VoiceCallModal';
// @ts-ignore
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';

interface SupportWidgetProps {
    user: User;
}

// Helpers for Audio (from system prompt guidelines)
function createBlob(data: Float32Array): { data: string; mimeType: string } {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}

function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

export const SupportWidget: React.FC<SupportWidgetProps> = ({ user }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<{text: string, isBot: boolean}[]>([]);
    const [input, setInput] = useState('');
    const [isListening, setIsListening] = useState(false);
    const [isThinking, setIsThinking] = useState(false);
    const [showCall, setShowCall] = useState(false);
    const [language, setLanguage] = useState<'en' | 'ha'>('en');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [hasGreeted, setHasGreeted] = useState(false);

    // Live API State
    const [isLiveConnected, setIsLiveConnected] = useState(false);
    const [liveStatus, setLiveStatus] = useState<'DISCONNECTED' | 'CONNECTING' | 'CONNECTED'>('DISCONNECTED');
    const [liveMuted, setLiveMuted] = useState(false);
    
    // Live API Refs
    const sessionPromiseRef = useRef<Promise<any> | null>(null);
    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const nextStartTimeRef = useRef(0);
    const sourcesRef = useRef(new Set<AudioBufferSourceNode>());

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Text Auto-greet when opened
    useEffect(() => {
        if (isOpen && !hasGreeted && !isLiveConnected) {
            const greeting = language === 'en' 
                ? `Hi ${user.name}! I'm your AI assistant. How can I help you?`
                : `Sannu ${user.name}! Ni abokin aikin AI ne. Yaya zan taimake ka?`;
            
            setMessages([{ text: greeting, isBot: true }]);
            // Don't auto-speak here if we want to encourage the live mode
            setHasGreeted(true);
        }
    }, [isOpen, language, isLiveConnected]);

    const handleSend = async () => {
        if(!input.trim()) return;
        const userMsg = input;
        setMessages(prev => [...prev, { text: userMsg, isBot: false }]);
        setInput('');
        setIsThinking(true);

        const result = await queryAiAgent(userMsg, user.role, language);
        setIsThinking(false);

        if (result.answer) {
            setMessages(prev => [...prev, { text: result.answer!, isBot: true }]);
            // Only use basic speech synth if not in Live mode
            if(!isLiveConnected) speak(result.answer!);
        }
        
        if (result.escalate) {
            const ticket = await createSupportTicket(user.id, user.name, "Support Request via AI", userMsg);
            const escalateMsg = language === 'en' 
                ? "Connecting you to a human agent..." 
                : "Ina hada ka da mutum...";
            if(!isLiveConnected) speak(escalateMsg);
        }
    };

    const toggleLanguage = () => {
        setLanguage(prev => prev === 'en' ? 'ha' : 'en');
        // If live, we would technically need to reconnect or send a prompt update, 
        // but for this implementation we'll keep the session.
    };

    // --- Gemini Live API Implementation ---

    const startLiveSession = async () => {
        try {
            setLiveStatus('CONNECTING');
            
            // Initialize Audio Contexts
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            const inputCtx = new AudioContextClass({ sampleRate: 16000 });
            const outputCtx = new AudioContextClass({ sampleRate: 24000 });
            inputAudioContextRef.current = inputCtx;
            outputAudioContextRef.current = outputCtx;
            nextStartTimeRef.current = 0;

            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;

            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            
            const sysInstruction = `You are NaijaMove's advanced AI Voice Assistant. 
            You are speaking with ${user.name}, who is a ${user.role}.
            Context: They are currently using the app in Sokoto, Nigeria.
            Language: ${language === 'ha' ? 'Hausa' : 'English'}.
            Your tone: Helpful, professional, and friendly.
            If user asks about navigation (especially if they are a driver), provide clear directions.
            If they ask for a human, politely say you can connect them.
            Keep responses concise for voice interaction.`;

            const sessionPromise = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                callbacks: {
                    onopen: () => {
                        console.debug('Live Session Opened');
                        setLiveStatus('CONNECTED');
                        setIsLiveConnected(true);

                        // Setup Audio Input Stream
                        const source = inputCtx.createMediaStreamSource(stream);
                        // Using ScriptProcessor for broad compatibility as per system prompt guidelines
                        const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
                        
                        scriptProcessor.onaudioprocess = (e) => {
                            if (liveMuted) return; // Simple mute implementation
                            const inputData = e.inputBuffer.getChannelData(0);
                            const pcmBlob = createBlob(inputData);
                            sessionPromise.then((session: any) => {
                                session.sendRealtimeInput({ media: pcmBlob });
                            });
                        };
                        
                        source.connect(scriptProcessor);
                        scriptProcessor.connect(inputCtx.destination);
                    },
                    onmessage: async (message: LiveServerMessage) => {
                        // Handle Audio Output
                        const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                        if (base64Audio) {
                            // Ensure time moves forward
                            nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputCtx.currentTime);
                            
                            const audioBuffer = await decodeAudioData(
                                decode(base64Audio),
                                outputCtx,
                                24000,
                                1
                            );
                            
                            const source = outputCtx.createBufferSource();
                            source.buffer = audioBuffer;
                            source.connect(outputCtx.destination);
                            
                            source.addEventListener('ended', () => {
                                sourcesRef.current.delete(source);
                            });
                            
                            source.start(nextStartTimeRef.current);
                            nextStartTimeRef.current += audioBuffer.duration;
                            sourcesRef.current.add(source);
                        }

                        // Handle Interruption
                        if (message.serverContent?.interrupted) {
                            sourcesRef.current.forEach(src => src.stop());
                            sourcesRef.current.clear();
                            nextStartTimeRef.current = 0;
                        }
                    },
                    onclose: () => {
                        console.debug('Live Session Closed');
                        setLiveStatus('DISCONNECTED');
                        setIsLiveConnected(false);
                    },
                    onerror: (e: any) => {
                        console.error('Live Session Error', e);
                        setLiveStatus('DISCONNECTED');
                        setIsLiveConnected(false);
                    }
                },
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: {
                        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
                    },
                    systemInstruction: sysInstruction,
                },
            });
            sessionPromiseRef.current = sessionPromise;

        } catch (error) {
            console.error("Failed to start Live API", error);
            setLiveStatus('DISCONNECTED');
            alert("Could not connect to AI Voice Agent. Please check permissions.");
        }
    };

    const stopLiveSession = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
        }
        if (inputAudioContextRef.current) inputAudioContextRef.current.close();
        if (outputAudioContextRef.current) outputAudioContextRef.current.close();
        
        sessionPromiseRef.current?.then((session: any) => {
            session.close();
        });
        
        setIsLiveConnected(false);
        setLiveStatus('DISCONNECTED');
    };

    // Use native Web Speech for non-Live mode (Legacy fallback)
    const toggleLegacyVoice = () => {
        if (!('webkitSpeechRecognition' in window)) {
            alert("Voice input not supported in this browser.");
            return;
        }
        if (isListening) {
            setIsListening(false);
            return;
        }
        const recognition = new (window as any).webkitSpeechRecognition();
        recognition.lang = language === 'ha' ? 'ha-NG' : 'en-NG';
        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            setInput(transcript);
        };
        recognition.start();
    };

    return (
        <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end">
            {isOpen && (
                <div className="bg-white w-80 h-[500px] rounded-2xl shadow-2xl border border-gray-200 mb-4 flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 font-sans">
                    {/* Header */}
                    <div className={`p-4 text-white flex justify-between items-center relative overflow-hidden transition-colors duration-500 ${isLiveConnected ? 'bg-red-600' : 'bg-gradient-to-r from-emerald-600 to-teal-500'}`}>
                        {/* Pulse Effect for AI */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
                        
                        <div className="flex items-center gap-3 z-10">
                            <div className="relative">
                                <div className="bg-white/20 p-2 rounded-full backdrop-blur-sm">
                                    {isLiveConnected ? <Signal size={20} className="animate-pulse"/> : <Headphones size={20}/>}
                                </div>
                                <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 border-2 rounded-full ${isLiveConnected ? 'bg-white border-red-600 animate-ping' : 'bg-green-400 border-emerald-600'}`}></span>
                            </div>
                            <div>
                                <h3 className="font-bold text-sm">NaijaMove AI</h3>
                                <p className="text-[10px] text-emerald-100 opacity-90 flex items-center gap-1">
                                    {isLiveConnected ? 'Voice Connected' : 'Live Agent'}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1 z-10">
                             <button 
                                onClick={toggleLanguage}
                                className="hover:bg-white/20 px-2 py-1 rounded text-[10px] font-bold border border-white/30 flex items-center gap-1 transition-colors"
                                title="Switch Language"
                             >
                                 <Globe size={12}/> {language.toUpperCase()}
                             </button>
                             <button onClick={() => { setIsOpen(false); if(isLiveConnected) stopLiveSession(); }} className="hover:bg-white/20 p-1.5 rounded transition-colors"><X size={18}/></button>
                        </div>
                    </div>

                    {/* Content Area */}
                    {isLiveConnected ? (
                        <div className="flex-1 bg-gray-900 flex flex-col items-center justify-center relative overflow-hidden">
                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
                            
                            <div className="relative z-10 flex flex-col items-center">
                                <div className="w-32 h-32 rounded-full bg-red-500/20 flex items-center justify-center mb-6 animate-pulse">
                                    <div className="w-24 h-24 rounded-full bg-red-500/40 flex items-center justify-center">
                                        <Mic size={40} className="text-white"/>
                                    </div>
                                </div>
                                <h3 className="text-white font-bold text-lg mb-2">Listening...</h3>
                                <p className="text-gray-400 text-sm text-center px-8">Speak naturally in {language === 'ha' ? 'Hausa' : 'English'}. Ask about navigation or rides.</p>
                            </div>

                            <div className="absolute bottom-8 flex gap-4">
                                <button 
                                    onClick={() => setLiveMuted(!liveMuted)}
                                    className={`p-4 rounded-full ${liveMuted ? 'bg-white text-red-600' : 'bg-gray-800 text-white border border-gray-700'}`}
                                >
                                    {liveMuted ? <MicOff size={24}/> : <Mic size={24}/>}
                                </button>
                                <button 
                                    onClick={stopLiveSession}
                                    className="p-4 rounded-full bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-600/30"
                                >
                                    <Phone size={24} className="rotate-135"/>
                                </button>
                            </div>
                        </div>
                    ) : (
                        // Standard Chat Interface
                        <>
                            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
                                {messages.map((msg, idx) => (
                                    <div key={idx} className={`flex ${msg.isBot ? 'justify-start' : 'justify-end'}`}>
                                        <div className={`max-w-[85%] p-3 rounded-2xl text-sm shadow-sm ${
                                            msg.isBot 
                                            ? 'bg-white border border-gray-200 text-gray-700 rounded-tl-none' 
                                            : 'bg-emerald-600 text-white rounded-br-none'
                                        }`}>
                                            {msg.text}
                                        </div>
                                    </div>
                                ))}
                                {isThinking && (
                                    <div className="flex justify-start animate-pulse">
                                        <div className="bg-white border border-gray-200 p-3 rounded-2xl rounded-tl-none flex gap-1 items-center">
                                            <span className="text-xs text-gray-400 mr-2">AI is thinking</span>
                                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce"></span>
                                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce delay-75"></span>
                                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce delay-150"></span>
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input Area */}
                            <div className="p-3 bg-white border-t border-gray-100">
                                <div className="flex items-center gap-2 bg-gray-100 rounded-full px-2 py-1.5 border border-transparent focus-within:border-emerald-500 focus-within:bg-white transition-colors">
                                    <button className="text-gray-400 hover:text-gray-600 p-1.5"><Paperclip size={16}/></button>
                                    <input 
                                        className="flex-1 text-sm bg-transparent outline-none min-w-0"
                                        placeholder={language === 'en' ? "Ask AI..." : "Tambayi AI..."}
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                    />
                                    <button 
                                        onClick={toggleLegacyVoice} 
                                        className={`p-1.5 rounded-full transition-all ${isListening ? 'bg-red-100 text-red-500 animate-pulse' : 'text-gray-500 hover:text-emerald-600'}`}
                                    >
                                        <Mic size={18} />
                                    </button>
                                    <button 
                                        onClick={handleSend} 
                                        disabled={!input} 
                                        className="bg-emerald-600 text-white p-2 rounded-full hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                                    >
                                        <Send size={16} />
                                    </button>
                                </div>
                                <div className="mt-3 flex justify-between items-center px-2">
                                    <button 
                                        onClick={() => setShowCall(true)}
                                        className="text-[10px] text-gray-400 hover:text-emerald-600 flex items-center gap-1 transition-colors"
                                    >
                                        <Phone size={10}/> Human Agent
                                    </button>
                                    
                                    <button 
                                        onClick={startLiveSession}
                                        disabled={liveStatus === 'CONNECTING'}
                                        className="bg-gray-900 text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-2 hover:bg-gray-800 transition-colors shadow-lg shadow-gray-900/20"
                                    >
                                        <Signal size={12} className={liveStatus === 'CONNECTING' ? 'animate-spin' : ''}/> 
                                        {liveStatus === 'CONNECTING' ? 'Connecting...' : 'Start Live Voice'}
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}

            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="group relative bg-emerald-600 hover:bg-emerald-700 text-white p-4 rounded-full shadow-lg shadow-emerald-600/30 transition-all hover:scale-105 active:scale-95 flex items-center justify-center"
            >
                {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
                {!isOpen && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>
                )}
            </button>
            
            {showCall && (
                <VoiceCallModal 
                    recipientName="NaijaMove Support"
                    recipientRole="Human Agent"
                    onEndCall={() => setShowCall(false)}
                />
            )}
        </div>
    );
};
