
import React, { useState, useRef, useEffect } from 'react';
import { User } from '../types';
import { MessageSquare, X, Mic, Send, Headphones, Paperclip, Phone, Globe } from 'lucide-react';
import { createSupportTicket, queryAiAgent, speak } from '../services/mockService';
import { VoiceCallModal } from './VoiceCallModal';

interface SupportWidgetProps {
    user: User;
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

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Auto-greet when opened
    useEffect(() => {
        if (isOpen && !hasGreeted) {
            const greeting = language === 'en' 
                ? `Hi ${user.name}! I'm your AI assistant. How can I help you?`
                : `Sannu ${user.name}! Ni abokin aikin AI ne. Yaya zan taimake ka?`;
            
            setMessages([{ text: greeting, isBot: true }]);
            speak(greeting);
            setHasGreeted(true);
        }
    }, [isOpen, language]);

    const handleSend = async () => {
        if(!input.trim()) return;
        const userMsg = input;
        setMessages(prev => [...prev, { text: userMsg, isBot: false }]);
        setInput('');
        setIsThinking(true);

        // Query AI with Role and Language context
        const result = await queryAiAgent(userMsg, user.role, language);
        setIsThinking(false);

        if (result.answer) {
            setMessages(prev => [...prev, { text: result.answer!, isBot: true }]);
            speak(result.answer!);
        }
        
        if (result.escalate) {
            // Escalate to human
            const ticket = await createSupportTicket(user.id, user.name, "Support Request via AI", userMsg);
            const escalateMsg = language === 'en' 
                ? "Connecting you to a human agent..." 
                : "Ina hada ka da mutum...";
            speak(escalateMsg);
        }
    };

    const toggleLanguage = () => {
        setLanguage(prev => prev === 'en' ? 'ha' : 'en');
        setHasGreeted(false); // Reset greeting to re-trigger in new language if needed
    };

    const toggleVoice = () => {
        if (!('webkitSpeechRecognition' in window)) {
            alert("Voice input not supported in this browser.");
            return;
        }

        if (isListening) {
            setIsListening(false);
            return;
        }

        const recognition = new (window as any).webkitSpeechRecognition();
        recognition.lang = language === 'ha' ? 'ha-NG' : 'en-NG'; // Attempt to set locale
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
                <div className="bg-white w-80 h-[450px] rounded-2xl shadow-2xl border border-gray-200 mb-4 flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 font-sans">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-emerald-600 to-teal-500 p-4 text-white flex justify-between items-center relative overflow-hidden">
                        {/* Pulse Effect for AI */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
                        
                        <div className="flex items-center gap-3 z-10">
                            <div className="relative">
                                <div className="bg-white/20 p-2 rounded-full backdrop-blur-sm"><Headphones size={20}/></div>
                                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 border-2 border-emerald-600 rounded-full"></span>
                            </div>
                            <div>
                                <h3 className="font-bold text-sm">NaijaMove AI</h3>
                                <p className="text-[10px] text-emerald-100 opacity-90 flex items-center gap-1">
                                    <span className="w-1 h-1 bg-white rounded-full animate-ping"></span> Live Agent
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
                             <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-1.5 rounded transition-colors"><X size={18}/></button>
                        </div>
                    </div>

                    {/* Chat Area */}
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
                                onClick={toggleVoice} 
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
                        <div className="mt-2 flex justify-center">
                            <button 
                                onClick={() => setShowCall(true)}
                                className="text-[10px] text-gray-400 hover:text-emerald-600 flex items-center gap-1 transition-colors"
                            >
                                <Phone size={10}/> Speak to Human Agent
                            </button>
                        </div>
                    </div>
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
