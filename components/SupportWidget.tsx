import React, { useState, useRef, useEffect } from 'react';
import { X, Send, MessageSquare, Mic, MicOff, Phone } from 'lucide-react';
import { VoiceCallModal } from './VoiceCallModal';
// @ts-ignore
import { GoogleGenerativeAI } from '@google/generative-ai';
import { User } from '../types';

// Speech Recognition
const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
const recognition = SpeechRecognition ? new SpeechRecognition() : null;
if (recognition) {
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = 'en-US';
}

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
    const [showAIVoiceCall, setShowAIVoiceCall] = useState(false);
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

    // AI
    const genAIRef = useRef<GoogleGenerativeAI | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  useEffect(() => {
    if (typeof window !== 'undefined' && process.env.GEMINI_API_KEY) {
      genAIRef.current = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    }
  }, []);

  useEffect(() => {
    if (isListening && recognition) {
      recognition.start();
      recognition.onresult = async (event) => {
        const transcript = event.results[0][0].transcript;
        setMessages(prev => [...prev, { text: transcript, isBot: false }]);
        setIsListening(false);

        // Send to AI
        if (genAIRef.current) {
          try {
            const model = genAIRef.current.getGenerativeModel({ model: "gemini-1.5-flash" });
            const prompt = `You are a helpful AI assistant for AmanaRide, a ride-hailing and logistics app in Nigeria. Answer the user's question: ${transcript}`;
            const result = await model.generateContent(prompt);
            const response = result.response.text();

            setMessages(prev => [...prev, { text: response, isBot: true }]);

            // Speak the response
            if ('speechSynthesis' in window) {
              const utterance = new SpeechSynthesisUtterance(response);
              window.speechSynthesis.speak(utterance);
            }
          } catch (error) {
            console.error('AI Error:', error);
            setMessages(prev => [...prev, { text: "Sorry, I couldn't process that. Please try again.", isBot: true }]);
          }
        }
      };

      recognition.onerror = () => {
        setIsListening(false);
        setMessages(prev => [...prev, { text: "Voice recognition failed. Please try again.", isBot: true }]);
      };
    }
  }, [isListening]);

  const handleSend = () => {
    if (!input.trim()) return;

    setMessages(prev => [...prev, { text: input, isBot: false }]);
    setInput('');
    setIsThinking(true);

    setTimeout(() => {
      setMessages(prev => [
        ...prev,
        { text: 'Hello 👋 How can I help you?', isBot: true },
      ]);
      setIsThinking(false);
    }, 700);
  };

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end">
      {isOpen && (
        <div className="bg-white w-80 h-[500px] rounded-2xl shadow-2xl mb-4 flex flex-col overflow-hidden">
          <div className="p-4 bg-emerald-600 text-white flex justify-between">
            <h3 className="font-bold">AmanaRide AI</h3>
            <button onClick={() => setIsOpen(false)}>
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`mb-2 ${m.isBot ? 'text-left' : 'text-right'}`}
              >
                <span className={`inline-block px-3 py-2 rounded-lg ${m.isBot ? 'bg-emerald-100 text-gray-800' : 'bg-blue-500 text-white'}`}>
                  {m.text}
                </span>
              </div>
            ))}
            {isThinking && (
              <p className="text-xs text-gray-400">AI thinking...</p>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-3 border-t flex gap-2">
            <input
              className="flex-1 border rounded px-2"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="Type your message..."
            />
            <button
              onClick={() => setShowAIVoiceCall(true)}
              className="px-3 py-2 rounded bg-blue-500 text-white hover:bg-blue-600"
              title="AI Voice Call"
            >
              <Phone size={16} />
            </button>
            <button
              onClick={() => {
                if (recognition) {
                  setIsListening(!isListening);
                } else {
                  alert('Voice recognition not supported in this browser');
                }
              }}
              disabled={!recognition}
              className={`px-3 py-2 rounded ${isListening ? 'bg-red-500 text-white' : recognition ? 'bg-gray-200 text-gray-600 hover:bg-gray-300' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
            >
              {isListening ? <MicOff size={16} /> : <Mic size={16} />}
            </button>
            <button
              onClick={handleSend}
              className="bg-emerald-600 text-white px-3 rounded"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}

      <button
        onClick={() => setIsOpen(o => !o)}
        className="bg-emerald-600 text-white p-4 rounded-full shadow-lg"
      >
        {isOpen ? <X /> : <MessageSquare />}
      </button>

      {showCall && (
        <VoiceCallModal
          recipientName="AmanaRide Support"
          recipientRole="Human Agent"
          onEndCall={() => setShowCall(false)}
        />
      )}

      {showAIVoiceCall && (
        <AIVoiceCallModal
          user={user}
          onEndCall={() => setShowAIVoiceCall(false)}
        />
      )}
    </div>
  );
};

// AI Voice Call Modal Component
const AIVoiceCallModal: React.FC<{ user: User; onEndCall: () => void }> = ({ user, onEndCall }) => {
  const [status, setStatus] = useState<'CONNECTING' | 'LISTENING' | 'PROCESSING' | 'SPEAKING'>('CONNECTING');
  const [isMuted, setIsMuted] = useState(false);
  const [duration, setDuration] = useState(0);
  const [conversation, setConversation] = useState<string[]>([]);
  const [currentTranscript, setCurrentTranscript] = useState('');

  // AI and speech recognition
  const genAIRef = useRef<GoogleGenerativeAI | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Initialize Gemini AI
    if (typeof window !== 'undefined') {
      // Using provided API key for demo - in production, use environment variables
      const apiKey = process.env.GEMINI_API_KEY || 'AIzaSyBQQnUqzCI_UzqpDXA-Bi0EQ9klC3903g4';
      genAIRef.current = new GoogleGenerativeAI(apiKey);
    }

    // Initialize speech recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';
    }

    // Connect after delay
    const timer = setTimeout(() => {
      setStatus('LISTENING');
      startListening();
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    let interval: any;
    if (status !== 'CONNECTING') {
      interval = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [status]);

  const startListening = () => {
    if (!recognitionRef.current) return;

    recognitionRef.current.onresult = async (event: any) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      setCurrentTranscript(interimTranscript);

      if (finalTranscript) {
        setCurrentTranscript('');
        setConversation(prev => [...prev, `You: ${finalTranscript}`]);
        await processUserInput(finalTranscript);
      }
    };

    recognitionRef.current.onerror = () => {
      setStatus('LISTENING');
      setTimeout(() => startListening(), 1000);
    };

    recognitionRef.current.onend = () => {
      if (status === 'LISTENING') {
        setTimeout(() => startListening(), 500);
      }
    };

    recognitionRef.current.start();
  };

  const processUserInput = async (input: string) => {
    setStatus('PROCESSING');

    try {
      if (genAIRef.current) {
        const model = genAIRef.current.getGenerativeModel({ model: "gemini-1.5-flash" });
        const context = `You are Ada, a friendly female AI assistant for AmanaRide, a ride-hailing and logistics platform in Nigeria.
        You are having a voice conversation with ${user.name}, a ${user.role.toLowerCase()}.
        Be extremely helpful, friendly, and knowledgeable about transportation services.
        Keep responses concise for voice conversations (under 50 words when possible).
        Current conversation: ${conversation.slice(-3).join(' | ')}

        User said: "${input}"

        If this is the first message, greet warmly and ask what they need help with today (traveling, shopping, or logistics).
        If they want to speak to a human agent, ask for their phone number and tell them an agent will call back.
        Always be polite, use contractions, and sound natural like a helpful customer service representative.
        If they ask about services, explain clearly what AmanaRide offers.`;

        const result = await model.generateContent(context);
        const response = result.response.text();

        setConversation(prev => [...prev, `Ada: ${response}`]);
        setStatus('SPEAKING');

        // Speak the response with female voice settings
        if ('speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(response);
          utterance.rate = 0.9; // Slightly slower for clarity
          utterance.pitch = 1.1; // Higher pitch for female voice
          utterance.volume = 0.8;

          // Try to use a female voice if available
          const voices = speechSynthesis.getVoices();
          const femaleVoice = voices.find(voice =>
            voice.name.toLowerCase().includes('female') ||
            voice.name.toLowerCase().includes('woman') ||
            voice.name.toLowerCase().includes('zira') ||
            voice.name.toLowerCase().includes('samantha') ||
            voice.lang.startsWith('en-')
          );
          if (femaleVoice) {
            utterance.voice = femaleVoice;
          }

          utterance.onend = () => {
            setStatus('LISTENING');
            startListening();
          };
          window.speechSynthesis.speak(utterance);
        } else {
          setTimeout(() => {
            setStatus('LISTENING');
            startListening();
          }, 2000);
        }
      }
    } catch (error) {
      console.error('AI Error:', error);
      const fallbackResponse = "I'm sorry, I didn't catch that. Could you please repeat what you said?";
      setConversation(prev => [...prev, `Ada: ${fallbackResponse}`]);

      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(fallbackResponse);
        utterance.rate = 0.9;
        utterance.pitch = 1.1;
        utterance.volume = 0.8;
        utterance.onend = () => {
          setStatus('LISTENING');
          startListening();
        };
        window.speechSynthesis.speak(utterance);
      }
    }
  };

  const handleEndCall = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    onEndCall();
  };

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getStatusText = () => {
    switch (status) {
      case 'CONNECTING': return 'Connecting AI...';
      case 'LISTENING': return 'Listening...';
      case 'PROCESSING': return 'Thinking...';
      case 'SPEAKING': return 'Speaking...';
      default: return 'Connected';
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900/95 z-[9999] flex items-center justify-center animate-in fade-in backdrop-blur-sm">
      <div className="bg-gray-800 w-full max-w-md rounded-3xl p-6 flex flex-col shadow-2xl border border-gray-700 relative overflow-hidden">
        {/* Background Pulse Effect */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse pointer-events-none"></div>

        <div className="relative z-10 flex flex-col items-center w-full">
          <div className="flex items-center gap-2 mb-6 bg-gray-700/50 px-3 py-1 rounded-full border border-gray-600">
            <div className={`w-2 h-2 rounded-full ${
              status === 'LISTENING' ? 'bg-blue-500 animate-pulse' :
              status === 'PROCESSING' ? 'bg-yellow-500 animate-pulse' :
              status === 'SPEAKING' ? 'bg-green-500 animate-pulse' :
              'bg-gray-500'
            }`}></div>
            <span className="text-xs text-gray-300 font-mono">AI VOICE CALL</span>
          </div>

          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4 shadow-lg shadow-blue-500/20 ring-4 ring-gray-700">
            <Phone size={32} className="text-white" />
          </div>

          <h2 className="text-xl font-bold text-white mb-1 text-center">Ada - AmanaRide AI Assistant</h2>
          <p className="text-blue-400 text-sm font-medium mb-4 uppercase tracking-wider">Voice Conversation</p>

          <div className="text-center mb-4">
            <div className="text-gray-400 text-sm font-mono mb-2">{getStatusText()}</div>
            <div className="text-white font-bold text-lg">{formatDuration(duration)}</div>
          </div>

          {/* Current transcript */}
          {currentTranscript && (
            <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-3 mb-4 w-full">
              <p className="text-blue-200 text-sm italic">"{currentTranscript}"</p>
            </div>
          )}

          {/* Recent conversation */}
          <div className="bg-gray-700/50 rounded-lg p-3 mb-6 w-full max-h-32 overflow-y-auto">
            <div className="text-xs text-gray-400 mb-2">Recent conversation:</div>
            {conversation.slice(-2).map((msg, i) => (
              <div key={i} className="text-xs text-gray-300 mb-1 truncate">{msg}</div>
            ))}
          </div>

          <div className="flex gap-6 items-center">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className={`p-3 rounded-full transition-all border ${isMuted ? 'bg-white text-gray-900 border-white' : 'bg-gray-700 text-white border-gray-600 hover:bg-gray-600'}`}
            >
              {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
            </button>

            <button
              onClick={handleEndCall}
              className="p-4 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-lg shadow-red-500/30 transition-transform hover:scale-110 active:scale-95 border-4 border-gray-800"
            >
              <Phone size={24} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupportWidget;
