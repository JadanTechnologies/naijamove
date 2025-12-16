import React, { useState, useRef, useEffect } from 'react';
import { User } from '../types';
import { MessageSquare, X, Mic, Send, Headphones, Paperclip } from 'lucide-react';
import { createSupportTicket, queryAiAgent, speak } from '../services/mockService';

interface SupportWidgetProps {
    user: User;
}

export const SupportWidget: React.FC<SupportWidgetProps> = ({ user }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<{text: string, isBot: boolean}[]>([
        { text: `Hi ${user.name}! I'm your AI assistant. How can I help you today?`, isBot: true }
    ]);
    const [input, setInput] = useState('');
    const [isListening, setIsListening] = useState(false);
    const [isThinking, setIsThinking] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async () => {
        if(!input.trim()) return;
        const userMsg = input;
        setMessages(prev => [...prev, { text: userMsg, isBot: false }]);
        setInput('');
        setIsThinking(true);

        // Query AI
        const result = await queryAiAgent(userMsg);
        setIsThinking(false);

        if (result.answer) {
            setMessages(prev => [...prev, { text: result.answer!, isBot: true }]);
            speak(result.answer!);
        } else {
            // Escalate
            const ticket = await createSupportTicket(user.id, user.name, "Support Request via AI", userMsg);
            setMessages(prev => [...prev, { 
                text: "I'm not sure about that, so I've connected you with a live human agent. They will reply shortly here.", 
                isBot: true 
            }]);
            speak("Connecting you to a human agent.");
        }
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
        recognition.lang = 'en-NG';
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
                <div className="bg-white w-80 h-96 rounded-2xl shadow-2xl border border-gray-200 mb-4 flex flex-col overflow-hidden animate-in slide-in-from-bottom-10">
                    <div className="bg-gradient-to-r from-emerald-600 to-teal-500 p-4 text-white flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <div className="bg-white/20 p-2 rounded-full"><Headphones size={18}/></div>
                            <div>
                                <h3 className="font-bold text-sm">NaijaMove Support</h3>
                                <p className="text-[10px] text-emerald-100">AI Agent Active</p>
                            </div>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-1 rounded"><X size={18}/></button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`flex ${msg.isBot ? 'justify-start' : 'justify-end'}`}>
                                <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${msg.isBot ? 'bg-white border border-gray-200 text-gray-700 rounded-tl-none' : 'bg-emerald-600 text-white rounded-br-none'}`}>
                                    {msg.text}
                                </div>
                            </div>
                        ))}
                        {isThinking && (
                            <div className="flex justify-start">
                                <div className="bg-white border border-gray-200 p-3 rounded-2xl rounded-tl-none flex gap-1">
                                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-75"></span>
                                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150"></span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <div className="p-3 bg-white border-t flex items-center gap-2">
                        <button className="text-gray-400 hover:text-gray-600"><Paperclip size={18}/></button>
                        <input 
                            className="flex-1 text-sm bg-gray-100 rounded-full px-3 py-2 outline-none focus:ring-1 focus:ring-emerald-500"
                            placeholder="Type or speak..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        />
                        <button onClick={toggleVoice} className={`${isListening ? 'text-red-500 animate-pulse' : 'text-gray-500 hover:text-emerald-600'}`}>
                            <Mic size={18} />
                        </button>
                        <button onClick={handleSend} disabled={!input} className="text-emerald-600 hover:text-emerald-700 disabled:opacity-50">
                            <Send size={18} />
                        </button>
                    </div>
                </div>
            )}

            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white p-4 rounded-full shadow-lg transition-transform hover:scale-110 flex items-center justify-center"
            >
                {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
            </button>
        </div>
    );
};