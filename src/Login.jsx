import React from 'react';
import { loginWithGoogle } from './firebase';
import { Rocket } from 'lucide-react';

export default function Login() {
  const handleLogin = async () => {
    try {
      await loginWithGoogle();
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  return (
    <div className="h-screen w-full bg-[#0B0D17] flex items-center justify-center relative overflow-hidden">
      {/* Background Stars */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-50"></div>
      
      {/* Login Card */}
      <div className="z-10 bg-gray-900/60 border border-gray-700 p-10 rounded-2xl backdrop-blur-md text-center shadow-[0_0_50px_rgba(37,99,235,0.2)]">
        <div className="mb-6 inline-block p-4 bg-blue-600 rounded-full shadow-[0_0_20px_#2563EB]">
          <Rocket size={40} className="text-white" />
        </div>
        <h1 className="text-4xl font-bold text-white mb-2">Cosmic Watch</h1>
        <p className="text-blue-200 mb-8">Restricted Access: Authorized Personnel Only</p>
        
        <button 
          onClick={handleLogin}
          className="flex items-center gap-3 bg-white text-gray-900 px-6 py-3 rounded-lg font-bold hover:bg-gray-200 transition-all mx-auto cursor-pointer"
        >
          <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-6 h-6" alt="Google" />
          Sign in with Google
        </button>
      </div>
    </div>
  );
}