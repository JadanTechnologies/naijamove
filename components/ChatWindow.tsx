import React, { useState, useEffect, useRef } from 'react';
import { User, ChatMessage } from '../types';
import { getRideMessages, sendMessage } from '../services/mockService';
import { Send, X, MessageSquare } from 'lucide-react';

interface ChatWindowProps {
    rideId: string;
    currentUser: User;
    recipientName: string;
    onClose: () => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ rideId, currentUser, recipientName, onClose }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [loading, setLoading] = useState(false);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const fetchMessages = async () => {
        const msgs = await getRideMessages(rideId);
        setMessages(msgs);
    };

    useEffect(() => {
        fetchMessages();
        // Polling for new messages since we don't have websockets in mock
        const interval = setInterval(fetchMessages, 3000);
        return () => clearInterval(interval);
    }, [rideId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!newMessage.trim()) return;

        setLoading(true);
        try {
            await sendMessage(rideId, currentUser.id, currentUser.name, newMessage);
            setNewMessage('');
            await fetchMessages();
        } catch (error) {
            console.error("Failed to send message", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed bottom-4 right-4 w-full max-w-sm bg-white rounded-t-xl rounded-b-lg shadow-2xl border border-gray-200 z-50 flex flex-col h-[500px] animate-in slide-in-from-bottom-5">
            {/* Header */}
            <div className="p-4 bg-emerald-600 text-white rounded-t-xl flex justify-between items-center shadow-sm">
                <div className="flex items-center gap-2">
                    <MessageSquare size={18} />
                    <div>
                        <h3 className="font-bold text-sm">{recipientName}</h3>
                        <span className="text-xs text-emerald-100 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-green-300 rounded-full animate-pulse"></span>
                            Online
                        </span>
                    </div>
                </div>
                <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
                    <X size={20} />
                </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                {messages.length === 0 && (
                    <div className="text-center text-gray-400 text-xs mt-10">
                        Start a conversation with {recipientName}
                    </div>
                )}
                {messages.map((msg) => {
                    const isMe = msg.senderId === currentUser.id;
                    return (
                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm shadow-sm ${
                                isMe 
                                ? 'bg-emerald-600 text-white rounded-br-none' 
                                : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'
                            }`}>
                                <p>{msg.content}</p>
                                <span className={`text-[10px] block mt-1 ${isMe ? 'text-emerald-100' : 'text-gray-400'}`}>
                                    {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </span>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSend} className="p-3 bg-white border-t border-gray-100 flex gap-2">
                <input 
                    type="text" 
                    className="flex-1 border border-gray-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                />
                <button 
                    type="submit" 
                    disabled={!newMessage.trim() || loading}
                    className="bg-emerald-600 text-white p-2 rounded-full hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    <Send size={18} />
                </button>
            </form>
        </div>
    );
};