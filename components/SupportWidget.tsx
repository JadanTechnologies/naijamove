import React, { useState, useRef, useEffect } from 'react';
import { X, Send, MessageSquare } from 'lucide-react';
import { VoiceCallModal } from './VoiceCallModal';

interface Message {
  text: string;
  isBot: boolean;
}

const SupportWidget = (): JSX.Element => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [showCall, setShowCall] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

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
            />
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
