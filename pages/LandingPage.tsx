import React, { useState, useEffect } from 'react';
import { Bike, Box, Car, ChevronRight, ShieldCheck, Zap, Map, ChevronDown, Download, Phone, Mail, Key } from 'lucide-react';
import { getSystemSettings } from '../services/mockService';
import { SystemSettings } from '../types';

interface LandingPageProps {
  onLogin: (identifier: string, isToken?: boolean) => void;
  loading?: boolean;
}

const LandingPage: React.FC<LandingPageProps> = ({ onLogin, loading }) => {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [branding, setBranding] = useState<SystemSettings['branding'] | null>(null);
  const [staffToken, setStaffToken] = useState('');
  const [showStaffInput, setShowStaffInput] = useState(false);

  useEffect(() => {
    getSystemSettings().then(s => setBranding(s.branding));
  }, []);

  const handleLoginSelection = (email: string) => {
    setIsLoginOpen(false);
    onLogin(email);
  };

  const handleStaffLogin = () => {
      if(staffToken) {
          onLogin(staffToken, true);
      }
  };

  const appName = branding?.appName || "NaijaMove";

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden relative selection:bg-emerald-500 selection:text-white font-sans flex flex-col">
      
      {/* --- 3D Grid Floor Animation --- */}
      <div className="absolute inset-0 perspective-grid z-0 opacity-40 pointer-events-none">
        <div className="grid-floor"></div>
      </div>

      {/* --- Holographic Glow Orbs --- */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-emerald-500/20 blur-[120px] rounded-full pointer-events-none z-0"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-600/10 blur-[100px] rounded-full pointer-events-none z-0"></div>

      {/* --- Navbar --- */}
      <nav className="relative z-50 flex items-center justify-between px-6 py-6 md:px-12 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.5)] overflow-hidden">
            <img 
                src="https://cdn-icons-png.flaticon.com/512/2972/2972185.png" 
                alt="NaijaMove Logo" 
                className="w-8 h-8 object-contain" 
            />
          </div>
          <span className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
            {appName}
          </span>
        </div>
        
        <div className="hidden md:flex gap-8 text-sm font-medium text-gray-400">
          <a href="#about" className="hover:text-emerald-400 transition-colors">About Us</a>
          <a href="#faq" className="hover:text-emerald-400 transition-colors">FAQs</a>
          <a href="#contact" className="hover:text-emerald-400 transition-colors">Contact Us</a>
        </div>

        {/* Login Dropdown */}
        <div className="relative">
           <button 
             onClick={() => setIsLoginOpen(!isLoginOpen)}
             className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold bg-white text-black rounded-full hover:bg-gray-100 transition-colors shadow-lg shadow-emerald-900/20"
           >
             Sign In <ChevronDown size={16} />
           </button>

           {isLoginOpen && (
             <div className="absolute right-0 top-full mt-3 w-80 bg-gray-900/95 backdrop-blur-xl border border-gray-700 rounded-2xl shadow-2xl p-2 z-50 animate-in slide-in-from-top-2 duration-200">
                {!showStaffInput ? (
                <>
                    <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Select Portal</div>
                    
                    <button 
                    onClick={() => handleLoginSelection('admin@naijamove.ng')}
                    className="w-full flex items-center gap-3 px-3 py-3 hover:bg-emerald-500/20 rounded-xl text-left group transition-all"
                    >
                        <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                        <ShieldCheck size={16} />
                        </div>
                        <div>
                        <div className="text-sm font-bold text-white">Super Admin</div>
                        <div className="text-xs text-gray-400">Platform Control</div>
                        </div>
                    </button>

                    <button 
                    onClick={() => handleLoginSelection('musa@naijamove.ng')}
                    className="w-full flex items-center gap-3 px-3 py-3 hover:bg-emerald-500/20 rounded-xl text-left group transition-all mt-1"
                    >
                        <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center text-orange-500 group-hover:bg-orange-500 group-hover:text-white transition-colors">
                        <Zap size={16} />
                        </div>
                        <div>
                        <div className="text-sm font-bold text-white">Driver Partner</div>
                        <div className="text-xs text-gray-400">Okada & Keke Riders</div>
                        </div>
                    </button>

                    <button 
                    onClick={() => handleLoginSelection('tola@gmail.com')}
                    className="w-full flex items-center gap-3 px-3 py-3 hover:bg-emerald-500/20 rounded-xl text-left group transition-all mt-1"
                    >
                        <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                        <Map size={16} />
                        </div>
                        <div>
                        <div className="text-sm font-bold text-white">Passenger</div>
                        <div className="text-xs text-gray-400">Ride & Logistics</div>
                        </div>
                    </button>

                    <button 
                    onClick={() => setShowStaffInput(true)}
                    className="w-full flex items-center gap-3 px-3 py-3 hover:bg-purple-500/20 rounded-xl text-left group transition-all mt-1 border-t border-gray-700"
                    >
                        <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center text-purple-500 group-hover:bg-purple-500 group-hover:text-white transition-colors">
                        <Key size={16} />
                        </div>
                        <div>
                        <div className="text-sm font-bold text-white">Staff Portal</div>
                        <div className="text-xs text-gray-400">Token Access Only</div>
                        </div>
                    </button>
                </>
                ) : (
                    <div className="p-4">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-sm font-bold">Staff Access</span>
                            <button onClick={() => setShowStaffInput(false)} className="text-xs text-gray-400 hover:text-white">Cancel</button>
                        </div>
                        <input 
                            type="text" 
                            placeholder="Enter Security Token" 
                            className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-white mb-3"
                            value={staffToken}
                            onChange={(e) => setStaffToken(e.target.value)}
                        />
                        <button 
                            onClick={handleStaffLogin}
                            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 rounded"
                        >
                            Authenticate
                        </button>
                        <p className="text-[10px] text-gray-500 mt-2 text-center">Use 'STAFF-TOKEN-123' for demo</p>
                    </div>
                )}
             </div>
           )}
        </div>
      </nav>

      {/* --- Main Content --- */}
      <main className="relative z-10 flex flex-col md:flex-row items-center justify-between px-6 md:px-12 max-w-7xl mx-auto mt-8 md:mt-16 gap-12 flex-grow">
        
        {/* Left: Text & CTA */}
        <div className="flex-1 space-y-8 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-900/30 border border-emerald-500/30 text-emerald-400 text-xs font-medium mb-4 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            LIVE IN LAGOS & ABUJA
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold leading-tight tracking-tight">
            The Future of <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-500 typing-effect">
              Logistics & Rides
            </span>
          </h1>
          
          <p className="text-lg text-gray-400 max-w-xl mx-auto md:mx-0 leading-relaxed">
            Move parcels, people, and cargo with Nigeria's most advanced AI-powered fleet. 
            Real-time tracking for Okada, Keke, and Mini-bus.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start pt-4">
             <button 
                onClick={() => setIsLoginOpen(true)}
                className="px-8 py-4 bg-emerald-600 text-white rounded-full font-bold text-lg hover:bg-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.4)] transition-all transform hover:scale-105 flex items-center justify-center gap-2"
             >
                Get Started <ChevronRight size={20} />
             </button>
             <button className="px-8 py-4 border border-white/20 text-white rounded-full font-bold text-lg hover:bg-white/10 hover:border-white/40 transition-all flex items-center justify-center gap-2">
                <Download size={20} /> Download App
             </button>
          </div>
          
          {loading && <p className="text-emerald-500 animate-pulse text-sm font-medium">Authenticating secure connection...</p>}
        </div>

        {/* Right: 3D Holographic Visualization */}
        <div className="flex-1 w-full h-[500px] relative perspective-1000 hidden md:block">
           <div className="absolute inset-0 flex items-center justify-center transform-style-3d rotate-y-minus-12">
              
              {/* Central Floating Platform */}
              <div className="relative w-80 h-80 bg-gray-900/40 rounded-full border border-emerald-500/30 shadow-[0_0_50px_rgba(16,185,129,0.2)] flex items-center justify-center backdrop-blur-sm animate-float">
                  {/* Inner Rings */}
                  <div className="absolute inset-4 border border-emerald-500/20 rounded-full animate-spin-slow-reverse"></div>
                  <div className="absolute inset-12 border border-emerald-500/40 rounded-full border-dashed animate-spin-slow"></div>
                  
                  {/* Central Logo */}
                  <div className="w-24 h-24 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-2xl flex items-center justify-center shadow-2xl z-20 overflow-hidden bg-white">
                    <img src="https://cdn-icons-png.flaticon.com/512/2972/2972185.png" alt="Logo" className="w-16 h-16 object-contain filter drop-shadow-lg" />
                  </div>

                  {/* Orbiting Vehicles */}
                  <div className="absolute w-full h-full animate-orbit-1 z-30">
                     <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gray-900 border border-emerald-500 p-3 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.6)] transform hover:scale-110 transition-transform">
                        <Bike className="text-emerald-400 w-6 h-6" />
                        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-emerald-400 font-mono opacity-0 group-hover:opacity-100">OKADA</div>
                     </div>
                  </div>
                  
                  <div className="absolute w-64 h-64 animate-orbit-2 z-30">
                     <div className="absolute bottom-0 right-0 bg-gray-900 border border-orange-500 p-3 rounded-xl shadow-[0_0_20px_rgba(249,115,22,0.6)] transform hover:scale-110 transition-transform">
                        <Box className="text-orange-400 w-6 h-6" />
                     </div>
                  </div>

                  <div className="absolute w-96 h-96 animate-orbit-3 z-10 opacity-60">
                     <div className="absolute top-1/2 left-0 bg-gray-900 border border-blue-500 p-3 rounded-xl shadow-[0_0_20px_rgba(59,130,246,0.6)]">
                        <Car className="text-blue-400 w-6 h-6" />
                     </div>
                  </div>
              </div>

              {/* Holographic Projection Base */}
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-96 h-24 bg-gradient-to-t from-emerald-500/20 to-transparent blur-xl rounded-full transform rotate-x-60"></div>
           </div>
        </div>

      </main>

      {/* --- Stats Pre-Footer --- */}
      <div className="relative z-10 border-t border-white/10 bg-black/50 backdrop-blur-md">
         <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center md:text-left">
               <h3 className="text-4xl font-bold text-white tracking-tight">2.5M+</h3>
               <p className="text-xs font-semibold text-emerald-500 uppercase tracking-widest mt-1">Completed Rides</p>
            </div>
            <div className="text-center md:text-left">
               <h3 className="text-4xl font-bold text-white tracking-tight">50k+</h3>
               <p className="text-xs font-semibold text-emerald-500 uppercase tracking-widest mt-1">Active Drivers</p>
            </div>
            <div className="text-center md:text-left">
               <h3 className="text-4xl font-bold text-white tracking-tight">0.5s</h3>
               <p className="text-xs font-semibold text-emerald-500 uppercase tracking-widest mt-1">Match Time</p>
            </div>
            <div className="text-center md:text-left">
               <h3 className="text-4xl font-bold text-white tracking-tight">36</h3>
               <p className="text-xs font-semibold text-emerald-500 uppercase tracking-widest mt-1">Nigerian Cities</p>
            </div>
         </div>
      </div>

      {/* --- Main Footer --- */}
      <footer className="relative z-10 bg-gray-950 border-t border-gray-900">
          <div className="max-w-7xl mx-auto px-6 py-16">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
                  <div className="space-y-4">
                      <div className="flex items-center gap-2 mb-4">
                          <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center font-bold text-white overflow-hidden p-1">
                            <img src="https://cdn-icons-png.flaticon.com/512/2972/2972185.png" alt="Logo" className="w-full h-full object-contain filter brightness-0 invert" />
                          </div>
                          <span className="text-xl font-bold text-white">{appName}</span>
                      </div>
                      <p className="text-gray-400 text-sm leading-relaxed">
                          Revolutionizing transportation in Nigeria. From Okada to heavy logistics, we move you forward with speed and safety.
                      </p>
                  </div>

                  <div>
                      <h4 className="text-white font-bold mb-6">Company</h4>
                      <ul className="space-y-3 text-sm text-gray-500">
                          <li><a href="#about" className="hover:text-emerald-500 transition-colors">About Us</a></li>
                          <li><a href="#" className="hover:text-emerald-500 transition-colors">Careers</a></li>
                          <li><a href="#" className="hover:text-emerald-500 transition-colors">Press & Media</a></li>
                          <li><a href="#contact" className="hover:text-emerald-500 transition-colors">Contact Us</a></li>
                      </ul>
                  </div>

                  <div>
                      <h4 className="text-white font-bold mb-6">Legal & Policy</h4>
                      <ul className="space-y-3 text-sm text-gray-500">
                          <li><a href="#" className="hover:text-emerald-500 transition-colors">Terms of Service</a></li>
                          <li><a href="#" className="hover:text-emerald-500 transition-colors">Privacy Policy</a></li>
                          <li><a href="#" className="hover:text-emerald-500 transition-colors">Refund Policy</a></li>
                          <li><a href="#" className="hover:text-emerald-500 transition-colors">Driver Agreement</a></li>
                      </ul>
                  </div>

                  <div>
                      <h4 className="text-white font-bold mb-6">Support</h4>
                      <ul className="space-y-3 text-sm text-gray-500">
                          <li><a href="#" className="hover:text-emerald-500 transition-colors">Help Center</a></li>
                          <li><a href="#faq" className="hover:text-emerald-500 transition-colors">FAQs</a></li>
                          <li><a href="#" className="hover:text-emerald-500 transition-colors flex items-center gap-2"><Mail size={14}/> support@{appName.toLowerCase()}.ng</a></li>
                          <li><a href="#" className="hover:text-emerald-500 transition-colors flex items-center gap-2"><Phone size={14}/> +234 800 NAIJA</a></li>
                      </ul>
                  </div>
              </div>

              <div className="pt-8 border-t border-gray-900 flex flex-col md:flex-row justify-between items-center gap-4">
                  <p className="text-gray-600 text-sm">© 2024 {appName}. All rights reserved.</p>
                  <p className="text-emerald-500/80 text-sm font-mono flex items-center gap-2 bg-emerald-950/30 px-3 py-1 rounded-full border border-emerald-900/50">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                      Developed by Jadan Technologies
                  </p>
              </div>
          </div>
      </footer>
       <style>{`
        .perspective-grid {
          perspective: 1000px;
          overflow: hidden;
        }
        .grid-floor {
          position: absolute;
          width: 200%;
          height: 200%;
          background-image: 
            linear-gradient(rgba(16, 185, 129, 0.2) 1px, transparent 1px),
            linear-gradient(90deg, rgba(16, 185, 129, 0.2) 1px, transparent 1px);
          background-size: 50px 50px;
          transform: rotateX(60deg) translateY(-100px) translateZ(-200px);
          animation: grid-move 20s linear infinite;
        }
        @keyframes grid-move {
          0% { transform: rotateX(60deg) translateY(0) translateZ(-200px); }
          100% { transform: rotateX(60deg) translateY(50px) translateZ(-200px); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        @keyframes orbit {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-orbit-1 { animation: orbit 15s linear infinite; }
        .animate-orbit-2 { animation: orbit 20s linear infinite reverse; }
        .animate-orbit-3 { animation: orbit 30s linear infinite; }
        .animate-spin-slow { animation: spin 20s linear infinite; }
        .animate-spin-slow-reverse { animation: spin 25s linear infinite reverse; }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .perspective-1000 { perspective: 1000px; }
        .transform-style-3d { transform-style: preserve-3d; }
        .rotate-y-minus-12 { transform: rotateY(-12deg); }
        
        .typing-effect {
            background-size: 200% auto;
            animation: shine 4s linear infinite;
        }
        @keyframes shine {
            to {
                background-position: 200% center;
            }
        }
      `}</style>
    </div>
  );
};

export default LandingPage;