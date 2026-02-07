import React, { useState, useEffect } from 'react';
import { Rocket, Activity, Globe, MessageSquare, AlertTriangle, CheckCircle, LogOut } from 'lucide-react';
import EarthViewer from './EarthViewer';
import ChatComponent from './ChatComponent';
import Login from './Login';
import { auth, logout } from './firebase'; // Added logout import

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [asteroids, setAsteroids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  // 1. LISTEN FOR AUTH STATUS
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((u) => setUser(u));
    return unsubscribe;
  }, []);

  // 2. FETCH DATA (Only if user is logged in technically, but we load it anyway)
  useEffect(() => {
    const fetchAsteroids = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        const response = await fetch(`https://api.nasa.gov/neo/rest/v1/feed?start_date=${today}&end_date=${today}&api_key=DEMO_KEY`);
        
        if (!response.ok) throw new Error("API Limit Hit");

        const data = await response.json();
        const allAsteroids = Object.values(data.near_earth_objects).flat();
        const sorted = allAsteroids.sort((a, b) => (b.is_potentially_hazardous_asteroid === a.is_potentially_hazardous_asteroid) ? 0 : b.is_potentially_hazardous_asteroid ? 1 : -1);
        setAsteroids(sorted.slice(0, 10));
        setLoading(false);

      } catch (error) {
        console.warn("API Failed/Limited. Using Backup Data.");
        // FALLBACK DATA FOR DEMO
        setAsteroids([
            { id: '1', name: '(2024 XR1)', is_potentially_hazardous_asteroid: true, close_approach_data: [{ miss_distance: { kilometers: '1200000' } }], estimated_diameter: { meters: { estimated_diameter_max: 150 } } },
            { id: '2', name: '(2022 AB)', is_potentially_hazardous_asteroid: true, close_approach_data: [{ miss_distance: { kilometers: '4500000' } }], estimated_diameter: { meters: { estimated_diameter_max: 85 } } },
            { id: '3', name: '(2026 YZ)', is_potentially_hazardous_asteroid: false, close_approach_data: [{ miss_distance: { kilometers: '9000000' } }], estimated_diameter: { meters: { estimated_diameter_max: 40 } } },
            { id: '4', name: '(Apophis)', is_potentially_hazardous_asteroid: true, close_approach_data: [{ miss_distance: { kilometers: '32000' } }], estimated_diameter: { meters: { estimated_diameter_max: 340 } } },
            { id: '5', name: '(Bennu)', is_potentially_hazardous_asteroid: true, close_approach_data: [{ miss_distance: { kilometers: '750000' } }], estimated_diameter: { meters: { estimated_diameter_max: 500 } } },
        ]);
        setLoading(false);
      }
    };

    fetchAsteroids();
  }, []);

  // 3. THE GATEKEEPER (If not logged in, show Login Screen)
  if (!user) {
    return <Login />;
  }

  // 4. THE DASHBOARD (Only shows if user exists)
  return (
    <div className="min-h-screen bg-[#0B0D17] text-white font-sans overflow-hidden relative">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-50 pointer-events-none"></div>

      {/* Sidebar */}
      <nav className="fixed left-0 top-0 h-full w-20 bg-gray-900/80 backdrop-blur-md border-r border-gray-700 flex flex-col items-center py-8 z-50">
        <div className="mb-10 p-3 bg-blue-600 rounded-full shadow-[0_0_15px_#2563EB]">
          <Rocket size={24} />
        </div>
        <NavIcon icon={<Activity />} active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
        <NavIcon icon={<MessageSquare />} active={activeTab === 'chat'} onClick={() => setActiveTab('chat')} />
        
        {/* Logout Button at bottom */}
        <div className="mt-auto">
             <button onClick={logout} className="p-4 text-red-400 hover:bg-red-900/30 rounded-xl transition-all">
                <LogOut size={20} />
             </button>
        </div>
      </nav>

      <main className="ml-20 p-8 h-screen overflow-y-auto">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-300">
              Cosmic Watch
            </h1>
            <p className="text-gray-400 text-sm mt-1">Welcome, {user.displayName || "Explorer"}</p>
          </div>
          <div className="flex gap-4">
             <div className="flex items-center gap-2 px-4 py-2 bg-red-900/20 border border-red-500/50 rounded-lg text-red-400">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                Live Tracking
             </div>
             {user.photoURL && (
                 <img src={user.photoURL} className="w-10 h-10 rounded-full border border-blue-500" alt="Profile" />
             )}
          </div>
        </header>

        {activeTab === 'dashboard' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[80%]">
            <div className="lg:col-span-2 bg-gray-900/50 border border-gray-700 rounded-2xl flex items-center justify-center relative overflow-hidden group h-[500px]">
              <div className="absolute inset-0 z-0"><EarthViewer /></div>
              <div className="absolute top-4 left-4 z-10 pointer-events-none">
                 <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs text-green-400 tracking-widest uppercase">System Online</span>
                 </div>
              </div>
            </div>

            <div className="bg-gray-900/50 border border-gray-700 rounded-2xl p-6 overflow-y-auto h-[500px] scrollbar-thin">
              <h3 className="text-xl font-semibold mb-6 text-white flex items-center gap-2 border-b border-gray-700 pb-4">
                <Activity size={18} className="text-blue-400" /> Near-Earth Objects
              </h3>
              {loading ? (
                <div className="text-center text-gray-500 py-10">Connecting to Deep Space Network...</div>
              ) : (
                <div className="space-y-4">
                  {asteroids.map((asteroid) => (
                    <div key={asteroid.id} className="group p-4 bg-gray-800/40 rounded-xl border border-gray-700 hover:border-blue-500/50 hover:bg-gray-800/80 transition-all cursor-pointer">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <span className="font-mono text-lg text-cyan-300 font-bold">{asteroid.name}</span>
                          <div className="text-xs text-gray-400">ID: {asteroid.id}</div>
                        </div>
                        {asteroid.is_potentially_hazardous_asteroid ? (
                          <span className="flex items-center gap-1 text-[10px] font-bold bg-red-500/20 text-red-400 px-2 py-1 rounded-full border border-red-500/30">
                            <AlertTriangle size={10} /> HAZARDOUS
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[10px] font-bold bg-green-500/20 text-green-400 px-2 py-1 rounded-full border border-green-500/30">
                            <CheckCircle size={10} /> SAFE
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-2 mt-3 text-xs text-gray-400">
                        <div className="bg-black/30 p-2 rounded">
                          <span className="block text-gray-500 mb-1">Miss Dist</span>
                          {parseFloat(asteroid.close_approach_data[0].miss_distance.kilometers).toLocaleString()} km
                        </div>
                        <div className="bg-black/30 p-2 rounded">
                           <span className="block text-gray-500 mb-1">Diameter</span>
                           {Math.round(asteroid.estimated_diameter.meters.estimated_diameter_max)} meters
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="h-[80%] max-w-4xl mx-auto"><ChatComponent /></div>
        )}
      </main>
    </div>
  );
}

const NavIcon = ({ icon, active, onClick }) => (
  <button onClick={onClick} className={`p-4 mb-4 rounded-xl transition-all duration-300 ${active ? 'bg-blue-600 text-white shadow-[0_0_10px_#2563EB]' : 'text-gray-500 hover:text-blue-400'}`}>
    {icon}
  </button>
);