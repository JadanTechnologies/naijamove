import React, { useState, useRef, useEffect } from 'react';
import { X, Send, MessageSquare, Mic, MicOff } from 'lucide-react';
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
    </div>
  );
};

export default SupportWidget;
