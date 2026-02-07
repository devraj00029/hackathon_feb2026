import React, { useState, useEffect, useRef } from 'react';
import { db, loginWithGoogle } from './firebase'; // Import login
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { Send, User, Activity, LogIn } from 'lucide-react';

export default function ChatComponent({ user }) { // Accept user prop
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const dummy = useRef();

  useEffect(() => {
    const q = query(collection(db, 'messages'), orderBy('createdAt'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return unsubscribe;
  }, []);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return; // Guard clause

    await addDoc(collection(db, 'messages'), {
      text: newMessage,
      createdAt: serverTimestamp(),
      user: user.displayName || 'Anonymous', // Use Real Name
      uid: user.uid, // Optional: Store User ID
      photoURL: user.photoURL // Optional: Store Avatar
    });

    setNewMessage('');
    setTimeout(() => {
      dummy.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  return (
    <div className="flex flex-col w-full bg-gray-900/50 border border-gray-700 rounded-2xl overflow-hidden relative h-[calc(100vh-160px)]">
      
      {/* Header */}
      <div className="flex-none h-14 p-4 bg-blue-900/20 border-b border-gray-700 backdrop-blur-sm z-10 flex items-center">
        <h3 className="text-lg font-bold text-blue-400 flex items-center gap-2">
          <Activity size={18} className="animate-pulse text-green-400" />
          Global Intel Feed
        </h3>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-thin scrollbar-thumb-blue-600/50 scrollbar-track-transparent">
        {messages.map((msg) => (
          <div key={msg.id} className={`p-2.5 rounded-lg border transition-colors ${msg.user === user?.displayName ? 'bg-blue-900/20 border-blue-500/30' : 'bg-black/40 border-gray-700/50'}`}>
            <div className="flex items-center gap-2 mb-1">
              {msg.photoURL ? (
                  <img src={msg.photoURL} alt="av" className="w-3 h-3 rounded-full" />
              ) : (
                  <User size={12} className="text-gray-500" />
              )}
              <span className={`text-xs font-mono ${msg.user === user?.displayName ? 'text-blue-300' : 'text-gray-400'}`}>
                  {msg.user}
              </span>
            </div>
            <p className="text-sm text-gray-200 break-words leading-relaxed">{msg.text}</p>
          </div>
        ))}
        <div ref={dummy} className="pt-2"></div>
      </div>

      {/* Input Area (Conditional) */}
      {user ? (
        <form onSubmit={sendMessage} className="flex-none h-16 p-3 bg-gray-900/90 border-t border-gray-700 flex gap-2 backdrop-blur-md z-10 items-center">
            <input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={`Report anomaly as ${user.displayName}...`}
            className="flex-1 bg-black/50 border border-gray-600 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-blue-500 transition-all placeholder:text-gray-600 h-10"
            />
            <button 
                type="submit" 
                disabled={!newMessage.trim()}
                className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white w-10 h-10 rounded-lg transition-colors flex items-center justify-center shadow-lg shadow-blue-900/20"
            >
            <Send size={18} />
            </button>
        </form>
      ) : (
        // LOGIN BUTTON IF NOT LOGGED IN
        <div className="flex-none h-16 p-3 bg-gray-900/90 border-t border-gray-700 flex items-center justify-center backdrop-blur-md z-10">
             <button 
                onClick={loginWithGoogle}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-bold text-white transition-all shadow-lg"
             >
                 <LogIn size={16} />
                 Login to Chat
             </button>
        </div>
      )}
    </div>
  );
}