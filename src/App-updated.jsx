import React, { useState, useEffect } from 'react';
import { Rocket, Activity, Star, MessageSquare, Bot, LogOut, Globe, LogIn, AlertTriangle, X } from 'lucide-react';
import SolarSystem from './solar-system-final';
import ChatComponent from './ChatComponent'; 
import { fetchAsteroids } from './services/nasa'; 
// Firebase Imports
import { auth, loginWithGoogle, logout, db } from './firebase'; 
import { onAuthStateChanged } from 'firebase/auth';
import { collection, addDoc, deleteDoc, doc, query, where, onSnapshot } from 'firebase/firestore';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [user, setUser] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [asteroids, setAsteroids] = useState([]); 
  const [focusedID, setFocusedID] = useState(null); 
  const [loading, setLoading] = useState(true);

  // 1. Auth Listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, setUser);
    return () => unsub();
  }, []);

  // 2. Favorites Listener
  useEffect(() => {
    if (!user) { setFavorites([]); return; }
    const q = query(collection(db, 'favorites'), where('userId', '==', user.uid));
    const unsub = onSnapshot(q, (snapshot) => {
       const favs = snapshot.docs.map(doc => ({ firebaseId: doc.id, ...doc.data() }));
       setFavorites(favs);
    });
    return () => unsub();
  }, [user]);

  // 3. Load NASA Data
  useEffect(() => {
    const load = async () => {
        const data = await fetchAsteroids();
        if (data.length > 0) {
            setAsteroids(data);
        }
        setLoading(false);
    };
    load();
  }, []);

  // 4. Handle Favorites
  const toggleFavorite = async (asteroid) => {
    if (!user) {
        alert("Please login to save favorites!");
        loginWithGoogle();
        return;
    }
    const existing = favorites.find(f => f.id === asteroid.id);
    try {
        if (existing) {
            await deleteDoc(doc(db, 'favorites', existing.firebaseId));
        } else {
            await addDoc(collection(db, 'favorites'), {
                userId: user.uid,
                id: asteroid.id,
                name: asteroid.name,
                risk: asteroid.risk,
                hazard: asteroid.hazard,
                diameter_max: asteroid.diameter_max || "N/A"
            });
        }
    } catch (err) {
        console.error("Favorite Error:", err);
    }
  };

  const isFavorite = (id) => favorites.some(f => f.id === id);

  return (
    // MAIN CONTAINER: Restored Deep Space Blue Background
    <div className="flex h-screen w-full bg-[#0B0D17] text-white overflow-hidden font-sans selection:bg-blue-500/30">
      
      {/* SIDEBAR */}
      <aside className="w-20 flex flex-col items-center py-6 border-r border-white/5 z-20 bg-[#0B0D17]/50 backdrop-blur-xl">
        <div className="p-3 bg-blue-600 rounded-xl mb-10 shadow-[0_0_20px_rgba(37,99,235,0.5)]">
            <Rocket size={24} className="text-white" />
        </div>
        <nav className="flex flex-col gap-6 w-full items-center">
            <SidebarBtn icon={<Activity />} active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
            <SidebarBtn icon={<Star />} active={activeTab === 'favorites'} onClick={() => setActiveTab('favorites')} />
            <SidebarBtn icon={<MessageSquare />} active={activeTab === 'chat'} onClick={() => setActiveTab('chat')} />
        </nav>
        <button onClick={user ? logout : loginWithGoogle} className="mt-auto p-3 text-gray-400 hover:text-white transition-colors hover:bg-white/5 rounded-xl">
            {user ? <LogOut size={20} /> : <LogIn size={20} />}
        </button>
      </aside>

      {/* MAIN LAYOUT */}
      <main className="flex-1 flex flex-col relative bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#1a1d2d] via-[#0B0D17] to-[#000000]">
        
        {/* HEADER */}
        <header className="h-20 border-b border-white/5 flex items-center justify-between px-8 bg-[#0B0D17]/30 backdrop-blur-sm">
            <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent filter drop-shadow-lg">
                    COSMIC WATCH
                </h1>
                <p className="text-[10px] text-blue-200/50 tracking-[0.2em] uppercase font-mono mt-1">
                    {user ? `COMMANDER: ${user.displayName}` : 'UNAUTHORIZED PERSONNEL'}
                </p>
            </div>
            {user && (
                <div className="flex items-center gap-3 bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
                    <img src={user.photoURL} className="w-8 h-8 rounded-full border border-blue-500/30" alt="User" />
                    <span className="text-xs font-bold text-gray-300 pr-2">{user.displayName.split(' ')[0]}</span>
                </div>
            )}
        </header>

        {/* DASHBOARD GRID */}
        <div className="flex-1 grid grid-cols-12 gap-6 p-6 overflow-hidden">
            
            {/* CENTER: 3D SOLAR SYSTEM */}
            <div className="col-span-12 lg:col-span-8 relative h-full rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-black">
                <SolarSystem 
                    liveFeedData={asteroids} 
                    focusedAsteroidID={focusedID}
                    onClearFocus={(id) => setFocusedID(id)} 
                />
            </div>

            {/* RIGHT: INFO PANEL */}
            <div className="col-span-12 lg:col-span-4 h-full flex flex-col gap-4 overflow-hidden">
                
                {/* TABS CONTAINER */}
                {activeTab === 'chat' ? (
                    <div className="flex-1 bg-[#151925]/80 backdrop-blur-xl rounded-3xl border border-white/10 overflow-hidden shadow-lg">
                        <ChatComponent user={user} />
                    </div>
                ) : (
                    <div className="flex-1 bg-[#151925]/80 backdrop-blur-xl rounded-3xl border border-white/10 flex flex-col overflow-hidden shadow-lg">
                        {/* Panel Header */}
                        <div className="p-5 border-b border-white/5 flex justify-between items-center bg-white/5">
                            <h2 className="font-bold flex items-center gap-2 text-gray-100">
                                {activeTab === 'favorites' ? <Star size={18} className="text-yellow-400"/> : <Activity size={18} className="text-blue-400"/>}
                                {activeTab === 'favorites' ? 'TARGET LIST' : 'LIVE FEED'}
                            </h2>
                            {loading && (
                                <div className="flex items-center gap-2 text-xs text-blue-400 font-mono">
                                    <span className="w-2 h-2 bg-blue-500 rounded-full animate-ping"></span>
                                    RECEIVING TELEMETRY...
                                </div>
                            )}
                        </div>
                        
                        {/* List Content */}
                        <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
                            {(activeTab === 'favorites' ? favorites : asteroids).map(item => (
                                <div 
                                    key={item.id} 
                                    onClick={() => setFocusedID(item.id)} 
                                    className={`p-4 rounded-xl border cursor-pointer transition-all group relative overflow-hidden ${
                                        focusedID === item.id 
                                        ? 'bg-blue-600/20 border-blue-500 shadow-[0_0_15px_rgba(37,99,235,0.2)]' 
                                        : 'bg-[#0B0D17]/50 border-white/5 hover:border-white/20 hover:bg-white/5'
                                    }`}
                                >
                                    {/* Hover Glow Effect */}
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 pointer-events-none" />

                                    <div className="flex justify-between items-start relative z-10">
                                        <div>
                                            <div className="font-bold text-sm text-gray-100 group-hover:text-blue-300 transition-colors font-mono tracking-wide">
                                                {item.name}
                                            </div>
                                            <div className="text-[10px] text-gray-500 mt-1">
                                                EST. DIAMETER: <span className="text-gray-300">{Math.round(item.diameter_max || item.diameter || 0)}m</span>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); toggleFavorite(item); }}
                                            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                                        >
                                            <Star size={16} className={isFavorite(item.id) ? "text-yellow-400 fill-yellow-400" : "text-gray-600 hover:text-yellow-400"} />
                                        </button>
                                    </div>
                                    
                                    <div className="mt-3 flex items-center gap-3 relative z-10">
                                        <div className={`text-[10px] px-2 py-1 rounded-md font-bold tracking-wider border ${
                                            item.risk > 50 
                                            ? 'bg-red-500/10 border-red-500/20 text-red-400' 
                                            : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                        }`}>
                                            RISK: {item.risk}%
                                        </div>
                                        {item.hazard && (
                                            <div className="flex items-center gap-1 text-[10px] text-red-400 animate-pulse font-bold">
                                                <AlertTriangle size={12} /> HAZARDOUS
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
      </main>
    </div>
  );
}

// Helper: Sidebar Button with correct coloring
const SidebarBtn = ({ icon, active, onClick }) => (
    <button 
        onClick={onClick} 
        className={`p-3.5 rounded-xl transition-all relative group ${
            active 
            ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-900/50' 
            : 'text-gray-500 hover:bg-white/10 hover:text-white'
        }`}
    >
        {icon}
        {active && (
            <div className="absolute -right-1 top-1/2 -translate-y-1/2 w-1 h-6 bg-cyan-400 rounded-l-full shadow-[0_0_10px_cyan]"></div>
        )}
    </button>
);