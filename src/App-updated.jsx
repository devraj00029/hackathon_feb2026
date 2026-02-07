import React, { useState, useEffect } from 'react';
import { Rocket, Activity, Star, MessageSquare, LogOut, AlertTriangle } from 'lucide-react';

import SolarSystem from './solar-system-final';
import ChatComponent from './ChatComponent'; 
import Login from './Login';

import { fetchAsteroids } from './services/nasa'; 
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

  // AUTH LISTENER
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, setUser);
    return () => unsub();
  }, []);

  // FAVORITES LISTENER
  useEffect(() => {
    if (!user) {
      setFavorites([]);
      return;
    }

    const q = query(collection(db, 'favorites'), where('userId', '==', user.uid));

    const unsub = onSnapshot(q, (snapshot) => {
      const favs = snapshot.docs.map(doc => ({
        firebaseId: doc.id,
        ...doc.data()
      }));
      setFavorites(favs);
    });

    return () => unsub();
  }, [user]);

  // LOAD NASA DATA
  useEffect(() => {
    const load = async () => {
      const data = await fetchAsteroids();
      if (data.length > 0) setAsteroids(data);
      setLoading(false);
    };

    load();
  }, []);

  const toggleFavorite = async (asteroid) => {
    if (!user) return;

    const existing = favorites.find(f => f.id === asteroid.id);

    if (existing) {
      await deleteDoc(doc(db, 'favorites', existing.firebaseId));
    } else {
      await addDoc(collection(db, 'favorites'), {
        userId: user.uid,
        ...asteroid
      });
    }
  };

  const isFavorite = (id) => favorites.some(f => f.id === id);

  // --- LOGIN SCREEN ---
  if (!user) {
    return <Login onLogin={loginWithGoogle} />;
  }

  return (
    <div className="flex h-screen w-full bg-[#0B0D17] text-white overflow-hidden font-sans">

      {/* SIDEBAR */}
      <aside className="w-20 flex flex-col items-center py-6 border-r border-white/5 bg-[#0B0D17]/50 backdrop-blur-xl">
        <div className="p-3 bg-blue-600 rounded-xl mb-10 shadow-lg">
          <Rocket size={24} className="text-white" />
        </div>

        <nav className="flex flex-col gap-6 w-full items-center">
          <SidebarBtn
            icon={<Activity />}
            active={activeTab === 'dashboard'}
            onClick={() => setActiveTab('dashboard')}
          />

          <SidebarBtn
            icon={<Star />}
            active={activeTab === 'favorites'}
            onClick={() => setActiveTab('favorites')}
          />

          <SidebarBtn
            icon={<MessageSquare />}
            active={activeTab === 'chat'}
            onClick={() => setActiveTab('chat')}
          />
        </nav>

        <button
          onClick={logout}
          className="mt-auto p-3 text-red-400 hover:text-white transition-colors rounded-xl"
        >
          <LogOut size={20} />
        </button>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col relative">

        {/* HEADER */}
        <header className="h-20 border-b border-white/5 flex items-center justify-between px-8 bg-[#0B0D17]/30 backdrop-blur-sm">
          <div>
            <h1 className="text-2xl font-bold text-cyan-400">
              COSMIC WATCH
            </h1>
            <p className="text-[10px] text-blue-200/50 uppercase font-mono mt-1">
              COMMANDER: {user.displayName}
            </p>
          </div>

          <div className="flex items-center gap-3 bg-white/5 px-3 py-1.5 rounded-full">
            <img
              src={user.photoURL}
              className="w-8 h-8 rounded-full border border-blue-500/30"
              alt="User"
            />
          </div>
        </header>

        {/* MAIN GRID */}
        <div className="flex-1 grid grid-cols-12 gap-6 p-6 overflow-hidden">

          {/* SOLAR SYSTEM VIEW */}
          <div className="col-span-12 lg:col-span-8 relative h-full rounded-3xl overflow-hidden border border-white/10 bg-black">

            <SolarSystem
              liveFeedData={asteroids}
              focusedAsteroidID={focusedID}
              onClearFocus={() => setFocusedID(null)}
            />

          </div>

          {/* SIDE PANEL */}
          <div className="col-span-12 lg:col-span-4 h-full flex flex-col gap-4 overflow-hidden">

            {activeTab === 'chat' ? (
              <div className="flex-1 bg-[#151925]/80 backdrop-blur-xl rounded-3xl border border-white/10 overflow-hidden">
                <ChatComponent user={user} />
              </div>
            ) : (
              <div className="flex-1 bg-[#151925]/80 backdrop-blur-xl rounded-3xl border border-white/10 flex flex-col overflow-hidden">

                <div className="p-5 border-b border-white/5 flex justify-between items-center bg-white/5">
                  <h2 className="font-bold flex items-center gap-2 text-gray-100">

                    {activeTab === 'favorites' ? (
                      <>
                        <Star size={18} className="text-yellow-400" />
                        TARGET LIST
                      </>
                    ) : (
                      <>
                        <Activity size={18} className="text-blue-400" />
                        LIVE FEED
                      </>
                    )}

                  </h2>

                  {loading && (
                    <span className="text-xs text-blue-400 animate-pulse">
                      Scanning...
                    </span>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto p-3 space-y-3">

                  {(activeTab === 'favorites' ? favorites : asteroids).map(item => (

                    <div
                      key={item.id}
                      onClick={() => setFocusedID(item.id)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all ${
                        focusedID === item.id
                          ? 'bg-blue-600/20 border-blue-500'
                          : 'bg-[#0B0D17]/50 border-white/5 hover:border-white/20'
                      }`}
                    >

                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-bold text-sm text-gray-100">
                            {item.name}
                          </div>

                          <div className="text-[10px] text-gray-500 mt-1">
                            DIA: {Math.round(item.diameter_max || 0)}m |  
                            VEL: {Math.round(item.velocity_kph || 0)}km/h
                          </div>

                          <div className="text-[10px] text-gray-500">
                            MISS: {Math.round((item.miss_distance_km || 0) / 1000000)}M km
                          </div>
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(item);
                          }}
                        >
                          <Star
                            size={16}
                            className={
                              isFavorite(item.id)
                                ? "text-yellow-400 fill-yellow-400"
                                : "text-gray-600 hover:text-yellow-400"
                            }
                          />
                        </button>
                      </div>

                      <div className="mt-3 flex items-center gap-3">
                        <div className={`text-[10px] px-2 py-1 rounded-md font-bold border ${
                          item.risk > 50
                            ? 'bg-red-500/10 border-red-500 text-red-400'
                            : 'bg-green-500/10 border-green-500 text-green-400'
                        }`}>
                          RISK: {item.risk}%
                        </div>

                        {item.hazard && (
                          <div className="flex items-center gap-1 text-[10px] text-red-400 font-bold">
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

const SidebarBtn = ({ icon, active, onClick }) => (
  <button
    onClick={onClick}
    className={`p-3.5 rounded-xl transition-all ${
      active ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-white/10'
    }`}
  >
    {icon}
  </button>
);
