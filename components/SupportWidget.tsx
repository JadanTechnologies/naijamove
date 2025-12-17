import React, { useState, useRef, useEffect } from 'react';
import { X, Send, MessageSquare, Mic, MicOff } from 'lucide-react';
import { VoiceCallModal } from './VoiceCallModal';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { User } from '../types';

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
  }, [messages, isThinking]);

  useEffect(() => {
    if (isListening) {
      // Mock voice recognition - in real implementation, use Web Speech API or Google AI
      setTimeout(() => {
        setMessages(prev => [...prev, { text: "Hello! I'm your AI assistant. How can I help you with your ride or delivery today?", isBot: true }]);
        setIsListening(false);
      }, 2000);
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
            <h3 className="font-bold">NaijaMove AI</h3>
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
                <span className="inline-block bg-gray-100 px-3 py-2 rounded-lg">
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
              onClick={() => setIsListening(!isListening)}
              className={`px-3 py-2 rounded ${isListening ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-600'}`}
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
          recipientName="NaijaMove Support"
          recipientRole="Human Agent"
          onEndCall={() => setShowCall(false)}
        />
      )}
    </div>
  );
};

export default SupportWidget;
