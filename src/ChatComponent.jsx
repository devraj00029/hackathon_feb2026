import React, { useState, useEffect, useRef } from 'react';
import { db } from './firebase'; // Importing your database
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { Send, User } from 'lucide-react';

export default function ChatComponent() {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const dummy = useRef();

  // Listen for real-time updates
  useEffect(() => {
    const q = query(collection(db, 'messages'), orderBy('createdAt'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      // Scroll to bottom on new message
      dummy.current.scrollIntoView({ behavior: 'smooth' });
    });
    return unsubscribe;
  }, []);

  // Send a message to Firebase
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    await addDoc(collection(db, 'messages'), {
      text: newMessage,
      createdAt: serverTimestamp(),
      user: 'Explorer-' + Math.floor(Math.random() * 1000) // Random anonymous name
    });

    setNewMessage('');
  };

  return (
    <div className="flex flex-col h-full bg-gray-900/50 border border-gray-700 rounded-2xl overflow-hidden">
      {/* Chat Header */}
      <div className="p-4 bg-blue-900/20 border-b border-gray-700">
        <h3 className="text-xl font-bold text-blue-400 flex items-center gap-2">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          Global Intel Feed
        </h3>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
        {messages.map((msg) => (
          <div key={msg.id} className="bg-black/40 p-3 rounded-lg border border-gray-700/50">
            <div className="flex items-center gap-2 mb-1">
              <User size={12} className="text-gray-500" />
              <span className="text-xs text-blue-300 font-mono">{msg.user}</span>
            </div>
            <p className="text-sm text-gray-200">{msg.text}</p>
          </div>
        ))}
        <div ref={dummy}></div>
      </div>

      {/* Input Area */}
      <form onSubmit={sendMessage} className="p-4 bg-gray-900/80 border-t border-gray-700 flex gap-2">
        <input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Report anomaly..."
          className="flex-1 bg-black/50 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition"
        />
        <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white p-2 rounded-lg transition">
          <Send size={20} />
        </button>
      </form>
    </div>
  );
}