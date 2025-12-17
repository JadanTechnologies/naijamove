
import React, { useState, useEffect } from 'react';
import { SupportTicket, KnowledgeBaseItem } from '../../types';
import { getSupportTickets, getKnowledgeBase, saveKBItem, deleteKBItem, addTicketMessage, speak } from '../../services/mockService';
import { Button } from '../../components/ui/Button';
import { MessageSquare, BookOpen, Send, Trash2, CheckCircle, Search, Plus, User, Phone, Mic, Volume2 } from 'lucide-react';
import { VoiceCallModal } from '../../components/VoiceCallModal';

const SupportManagement: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'TICKETS' | 'KB'>('TICKETS');
    const [tickets, setTickets] = useState<SupportTicket[]>([]);
    const [kb, setKb] = useState<KnowledgeBaseItem[]>([]);
    
    // Ticket State
    const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
    const [reply, setReply] = useState('');

    // KB State
    const [newKb, setNewKb] = useState<Partial<KnowledgeBaseItem>>({});
    const [isEditingKb, setIsEditingKb] = useState(false);

    // Call State
    const [showCallModal, setShowCallModal] = useState(false);

    useEffect(() => {
        refresh();
    }, []);

    const refresh = async () => {
        setTickets(await getSupportTickets());
        setKb(await getKnowledgeBase());
    };

    const handleReply = async () => {
        if(!selectedTicket || !reply) return;
        await addTicketMessage(selectedTicket.id, 'admin-1', 'Super Admin', reply);
        setReply('');
        refresh();
        // Optimistic update
        const updated = await getSupportTickets();
        setSelectedTicket(updated.find(t => t.id === selectedTicket.id) || null);
    };

    const handleSaveKb = async () => {
        if(!newKb.question || !newKb.answer) return;
        await saveKBItem({
            id: newKb.id || '',
            question: newKb.question,
            answer: newKb.answer,
            tags: newKb.tags || []
        });
        setNewKb({});
        setIsEditingKb(false);
        refresh();
        speak("Training data added successfully.");
    };

    return (
        <div className="space-y-6 h-[calc(100vh-140px)] flex flex-col">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">Support Center</h1>
                <div className="flex bg-gray-100 p-1 rounded-lg">
                    <button 
                        onClick={() => setActiveTab('TICKETS')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'TICKETS' ? 'bg-white shadow text-emerald-700' : 'text-gray-600'}`}
                    >
                        Tickets
                    </button>
                    <button 
                        onClick={() => setActiveTab('KB')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'KB' ? 'bg-white shadow text-emerald-700' : 'text-gray-600'}`}
                    >
                        Voice Agent Training
                    </button>
                </div>
            </div>

            {activeTab === 'TICKETS' ? (
                <div className="flex gap-6 flex-1 overflow-hidden">
                    {/* Ticket List */}
                    <div className="w-1/3 bg-white rounded-xl shadow-sm border border-gray-200 overflow-y-auto">
                        <div className="p-4 border-b bg-gray-50 sticky top-0 z-10">
                            <div className="relative">
                                <Search className="absolute left-3 top-2.5 text-gray-400" size={16}/>
                                <input className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm" placeholder="Search tickets..." />
                            </div>
                        </div>
                        <div className="divide-y">
                            {tickets.length === 0 && <div className="p-6 text-center text-gray-500">No tickets found.</div>}
                            {tickets.map(t => (
                                <div 
                                    key={t.id} 
                                    onClick={() => setSelectedTicket(t)}
                                    className={`p-4 cursor-pointer hover:bg-blue-50 transition-colors ${selectedTicket?.id === t.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''}`}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="font-bold text-gray-900 truncate">{t.userName}</span>
                                        <span className="text-[10px] text-gray-400">{new Date(t.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <p className="text-sm font-medium text-gray-800 truncate">{t.subject}</p>
                                    <p className="text-xs text-gray-500 truncate">{t.messages[t.messages.length-1]?.content}</p>
                                    <div className="mt-2 flex gap-2">
                                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${t.status === 'OPEN' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{t.status}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Chat Area */}
                    <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col overflow-hidden">
                        {selectedTicket ? (
                            <>
                                <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                                    <div>
                                        <h3 className="font-bold text-lg">{selectedTicket.subject}</h3>
                                        <div className="flex items-center gap-2 text-xs text-gray-500">
                                            <span>ID: {selectedTicket.id}</span>
                                            <span>•</span>
                                            <span>User: {selectedTicket.userName}</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="sm" onClick={() => setShowCallModal(true)}>
                                            <Phone size={16} className="mr-1" /> Call User
                                        </Button>
                                        <Button variant="outline" size="sm">Mark Resolved</Button>
                                    </div>
                                </div>
                                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
                                    {selectedTicket.messages.map(msg => (
                                        <div key={msg.id} className={`flex ${msg.senderId === 'admin-1' ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[80%] rounded-xl p-3 text-sm shadow-sm ${msg.senderId === 'admin-1' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white border text-gray-800 rounded-bl-none'}`}>
                                                <p>{msg.content}</p>
                                                <span className={`text-[10px] block mt-1 opacity-70`}>
                                                    {new Date(msg.timestamp).toLocaleTimeString()} • {msg.senderName}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="p-4 bg-white border-t">
                                    <div className="flex gap-2">
                                        <input 
                                            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm"
                                            placeholder="Type your reply..."
                                            value={reply}
                                            onChange={(e) => setReply(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleReply()}
                                        />
                                        <Button onClick={handleReply}><Send size={18}/></Button>
                                    </div>
                                </div>
                                {showCallModal && (
                                    <VoiceCallModal 
                                        recipientName={selectedTicket.userName}
                                        recipientRole="App User"
                                        onEndCall={() => setShowCallModal(false)}
                                    />
                                )}
                            </>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                                <MessageSquare size={48} className="mb-4 opacity-20"/>
                                <p>Select a ticket to view conversation</p>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                // Knowledge Base Tab
                <div className="flex gap-6 flex-1 overflow-hidden">
                    <div className="w-1/3 space-y-4">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <Mic size={18} className="text-emerald-600"/> Train AI Voice Agent
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">User Question</label>
                                    <input 
                                        className="w-full p-2 border rounded text-sm" 
                                        placeholder="e.g. How to reset password?"
                                        value={newKb.question || ''}
                                        onChange={e => setNewKb({...newKb, question: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Voice Answer</label>
                                    <textarea 
                                        className="w-full p-2 border rounded text-sm h-32" 
                                        placeholder="The spoken answer the AI should give..."
                                        value={newKb.answer || ''}
                                        onChange={e => setNewKb({...newKb, answer: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Tags (comma separated)</label>
                                    <input 
                                        className="w-full p-2 border rounded text-sm" 
                                        placeholder="account, security, password"
                                        onChange={e => setNewKb({...newKb, tags: e.target.value.split(',').map(t => t.trim())})}
                                    />
                                </div>
                                <Button className="w-full" onClick={handleSaveKb}>Add Training Data</Button>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                        <div className="p-4 border-b bg-gray-50 font-bold text-gray-700 flex justify-between items-center">
                            <span>Knowledge Base ({kb.length})</span>
                            <span className="text-xs font-normal text-gray-500">Live Training Data</span>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 grid gap-4">
                            {kb.length === 0 && (
                                <div className="text-center text-gray-400 py-10">No training data available. Add some questions.</div>
                            )}
                            {kb.map(item => (
                                <div key={item.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow relative group bg-white">
                                    <h4 className="font-bold text-gray-900 mb-2 flex gap-2 pr-10">
                                        <span className="text-emerald-600">Q:</span> {item.question}
                                    </h4>
                                    <p className="text-gray-600 text-sm pl-6 mb-3 pr-10">
                                        <span className="font-bold text-gray-400">A:</span> {item.answer}
                                    </p>
                                    <div className="pl-6 flex gap-2">
                                        {item.tags.map(tag => (
                                            <span key={tag} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] rounded-full">{tag}</span>
                                        ))}
                                    </div>
                                    <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white pl-2">
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); speak(item.answer); }}
                                            className="p-1.5 text-gray-400 hover:text-emerald-600 rounded-lg hover:bg-emerald-50 transition-colors"
                                            title="Preview Audio"
                                        >
                                            <Volume2 size={18} />
                                        </button>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); deleteKBItem(item.id).then(refresh); }}
                                            className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                                            title="Delete Rule"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SupportManagement;
