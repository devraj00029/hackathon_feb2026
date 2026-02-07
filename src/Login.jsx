import React from 'react';
import { Rocket, ShieldCheck, Globe } from 'lucide-react';

export default function Login({ onLogin }) {
  return (
    <div className="h-screen w-full flex items-center justify-center bg-[#0B0D17] relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-[#0B0D17] to-black"></div>
      <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20"></div>

      {/* Login Card */}
      <div className="relative z-10 bg-[#151925]/80 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-[0_0_50px_rgba(37,99,235,0.2)] max-w-md w-full text-center">
        
        <div className="inline-flex p-4 bg-blue-600 rounded-2xl shadow-lg shadow-blue-600/40 mb-6">
           <Rocket size={40} className="text-white" />
        </div>
        
        <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">COSMIC WATCH</h1>
        <p className="text-blue-200/60 mb-8">Authorized Personnel Only. Please verify identity to access the Near-Earth Object Tracking System.</p>

        <button 
          onClick={onLogin}
          className="w-full py-4 bg-white text-black font-bold rounded-xl hover:bg-blue-50 transition-all flex items-center justify-center gap-3 text-lg"
        >
          <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-6 h-6" alt="G" />
          Sign in with Google
        </button>

        <div className="mt-8 grid grid-cols-3 gap-4 text-[10px] text-gray-500 uppercase tracking-widest font-semibold">
           <div className="flex flex-col items-center gap-1">
              <ShieldCheck size={16} /> Secure
           </div>
           <div className="flex flex-col items-center gap-1">
              <Globe size={16} /> Global
           </div>
           <div className="flex flex-col items-center gap-1">
              <Rocket size={16} /> Real-Time
           </div>
        </div>
      </div>
    </div>
  );
}