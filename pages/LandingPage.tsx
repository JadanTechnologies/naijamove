
import React, { useState, useEffect } from 'react';
import { Bike, Box, Car, ChevronRight, ShieldCheck, Zap, Map, ChevronDown, Download, Phone, Mail, Key, User, CreditCard, ScanLine, ArrowRight, Loader2, Truck, Smartphone, Lock, QrCode, Copy } from 'lucide-react';
import { getSystemSettings, verifyNin, signup, login, setupTotp, verifyTotpToken } from '../services/mockService';
import { SystemSettings, UserRole, VehicleType } from '../types';
import { useToast } from '../components/ui/Toast';

interface LandingPageProps {
  onLogin: (identifier: string, isToken?: boolean) => void;
  loading?: boolean;
  onOpenStatic: (page: string) => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onLogin, loading, onOpenStatic }) => {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isSignupOpen, setIsSignupOpen] = useState(false);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const { addToast } = useToast();

  // Login State
  const [loginMode, setLoginMode] = useState<'USER' | 'STAFF'>('USER'); // User = Quick Select, Staff = Creds
  const [loginStep, setLoginStep] = useState<'CREDENTIALS' | 'TOTP' | 'SETUP_TOTP'>('CREDENTIALS');
  const [loginData, setLoginData] = useState({ email: '', password: '', token: '' });
  const [totpSetupData, setTotpSetupData] = useState<{secret: string, qrCode: string} | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  // Signup State
  const [signupStep, setSignupStep] = useState(1);
  const [signupData, setSignupData] = useState<{
      name: string; email: string; phone: string; nin: string; role: UserRole; vehicleType?: VehicleType; licensePlate?: string;
  }>({
      name: '', email: '', phone: '', nin: '', role: UserRole.PASSENGER, vehicleType: VehicleType.OKADA, licensePlate: ''
  });
  const [ninLoading, setNinLoading] = useState(false);
  const [verifiedNinData, setVerifiedNinData] = useState<any>(null);

  useEffect(() => {
    getSystemSettings().then(setSettings);
  }, []);

  // Quick Login for Passengers/Drivers (Demo)
  const handleQuickLogin = (email: string) => {
    setIsLoginOpen(false);
    onLogin(email);
  };

  // Staff/Admin Login Flow
  const handleStaffLoginInit = async () => {
      if(!loginData.email || !loginData.password) return;
      setIsAuthLoading(true);
      try {
          // 1. Validate Credentials
          // In a real app, we'd verify password here.
          // For mock, we attempt login to check user state.
          
          // Special Mock: Check if it's the first time setup
          try {
              await login(loginData.email); // This might throw TOTP_SETUP_REQUIRED
              // If successful immediately (e.g. no 2FA enforced yet or already authed session), just login
              onLogin(loginData.email);
          } catch (e: any) {
              if (e.message === 'TOTP_SETUP_REQUIRED') {
                  // Initiate Setup
                  const setup = await setupTotp('admin-1'); // Hardcoded ID for demo flow, in real app use response id
                  setTotpSetupData(setup);
                  setLoginStep('SETUP_TOTP');
              } else if (e.message.includes('Suspended') || e.message.includes('Banned')) {
                  addToast(e.message, 'error');
              } else {
                  // Assume normal 2FA required
                  setLoginStep('TOTP');
              }
          }
      } catch (e: any) {
          addToast("Invalid credentials", 'error');
      } finally {
          setIsAuthLoading(false);
      }
  };

  const handleTotpVerify = async () => {
      setIsAuthLoading(true);
      try {
          await verifyTotpToken('admin-1', loginData.token);
          onLogin(loginData.email);
          setIsLoginOpen(false);
      } catch (e) {
          addToast("Invalid Authenticator Token", 'error');
      } finally {
          setIsAuthLoading(false);
      }
  };

  const handleVerifyNin = async () => {
      if(!signupData.nin) return;
      setNinLoading(true);
      try {
          const result = await verifyNin(signupData.nin);
          if(result.valid) {
              setVerifiedNinData(result.data);
              setSignupData(prev => ({
                  ...prev,
                  name: `${result.data.firstName} ${result.data.lastName}`
              }));
              setSignupStep(2);
              addToast('Identity Verified Successfully', 'success');
          }
      } catch (e: any) {
          addToast(e.message || 'Verification failed', 'error');
      } finally {
          setNinLoading(false);
      }
  };

  const handleSignupComplete = async () => {
      setNinLoading(true);
      try {
          const user = await signup(signupData);
          setIsSignupOpen(false);
          addToast('Account created successfully!', 'success');
          onLogin(user.email);
      } catch (e: any) {
          addToast(e.message, 'error');
      } finally {
          setNinLoading(false);
      }
  };

  if (!settings) return <div className="min-h-screen bg-black flex items-center justify-center text-emerald-500 animate-pulse">Initializing...</div>;

  const appName = settings.branding.appName;
  const cms = settings.landingPage;
  const apps = settings.mobileApps;

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden relative selection:bg-emerald-500 selection:text-white font-sans flex flex-col">
      
      {/* Background Hologram Effects */}
      <style>{`
        .perspective-grid {
            transform: perspective(1000px) rotateX(60deg);
            transform-style: preserve-3d;
        }
        .grid-floor {
            width: 200vw;
            height: 200vh;
            background-image: linear-gradient(to right, rgba(16, 185, 129, 0.1) 1px, transparent 1px),
                              linear-gradient(to bottom, rgba(16, 185, 129, 0.1) 1px, transparent 1px);
            background-size: 50px 50px;
            animation: gridMove 20s linear infinite;
            transform: translateY(-50%);
        }
        @keyframes gridMove {
            0% { transform: translateY(-50%) translateY(0); }
            100% { transform: translateY(-50%) translateY(50px); }
        }
        
        .hologram-bike {
            filter: drop-shadow(0 0 20px rgba(16, 185, 129, 0.6)) hue-rotate(140deg) brightness(1.5) contrast(1.2);
            opacity: 0.9;
            mix-blend-mode: screen;
            animation: drive-loop 8s ease-in-out infinite;
        }

        @keyframes drive-loop {
            0% { transform: translateX(-100px) scaleX(1) translateY(0); opacity: 0; }
            10% { opacity: 0.9; }
            45% { transform: translateX(100px) scaleX(1) translateY(-20px); }
            50% { transform: translateX(100px) scaleX(-1) translateY(-20px); } /* Turn around */
            90% { opacity: 0.9; }
            100% { transform: translateX(-100px) scaleX(-1) translateY(0); opacity: 0; }
        }

        .typing-effect {
            display: inline-block;
            overflow: hidden;
            white-space: nowrap;
            border-right: 3px solid #10b981;
            animation: typing 3.5s steps(40, end), blink-caret .75s step-end infinite;
        }
        @keyframes typing { from { width: 0 } to { width: 100% } }
        @keyframes blink-caret { from, to { border-color: transparent } 50% { border-color: #10b981; } }
      `}</style>

      {/* Floor Grid */}
      <div className="absolute inset-0 perspective-grid z-0 opacity-30 pointer-events-none overflow-hidden">
        <div className="grid-floor absolute left-1/2 -translate-x-1/2"></div>
      </div>
      
      {/* Ambient Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-emerald-500/20 blur-[120px] rounded-full pointer-events-none z-0"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-600/10 blur-[100px] rounded-full pointer-events-none z-0"></div>

      {/* --- Navbar --- */}
      <nav className="relative z-50 flex items-center justify-between px-6 py-6 md:px-12 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.5)] overflow-hidden">
            <img 
                src={settings.branding.logoUrl || "https://cdn-icons-png.flaticon.com/512/2972/2972185.png"}
                alt="Logo" 
                className="w-8 h-8 object-contain" 
            />
          </div>
          <span className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
            {appName}
          </span>
        </div>
        
        <div className="hidden md:flex gap-8 text-sm font-medium text-gray-400">
          <button onClick={() => onOpenStatic('about')} className="hover:text-emerald-400 transition-colors">About Us</button>
          <button onClick={() => onOpenStatic('faq')} className="hover:text-emerald-400 transition-colors">FAQs</button>
          <a href={`mailto:${cms.contactEmail}`} className="hover:text-emerald-400 transition-colors">Contact Us</a>
        </div>

        {/* Auth Buttons */}
        <div className="flex gap-4">
             <button 
                onClick={() => setIsSignupOpen(true)}
                className="hidden md:block px-5 py-2.5 text-sm font-bold text-white border border-white/20 rounded-full hover:bg-white/10 transition-colors"
             >
                Register
             </button>
             
             <button 
                onClick={() => {
                    setIsLoginOpen(true);
                    setLoginMode('USER');
                    setLoginStep('CREDENTIALS');
                }}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold bg-white text-black rounded-full hover:bg-gray-100 transition-colors shadow-lg shadow-emerald-900/20"
            >
                Sign In <ChevronDown size={16} />
            </button>
        </div>
      </nav>

      {/* --- Login Modal --- */}
      {isLoginOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
              <div className="bg-gray-900 w-full max-w-md rounded-2xl border border-gray-700 shadow-2xl overflow-hidden animate-in zoom-in-95">
                  <div className="p-6 border-b border-gray-800 flex justify-between items-center">
                      <h3 className="text-xl font-bold text-white">
                          {loginMode === 'USER' ? 'Portal Login' : 'Staff Access'}
                      </h3>
                      <button onClick={() => setIsLoginOpen(false)} className="text-gray-400 hover:text-white"><ChevronDown size={20}/></button>
                  </div>

                  <div className="p-6">
                      {loginMode === 'USER' ? (
                          <div className="space-y-2">
                              <p className="text-sm text-gray-400 mb-4">Select your dashboard to continue.</p>
                              <button 
                                onClick={() => handleQuickLogin('musa@naijamove.ng')}
                                className="w-full flex items-center gap-4 p-4 bg-gray-800 hover:bg-gray-700 rounded-xl border border-gray-700 transition-all group"
                              >
                                  <div className="w-10 h-10 bg-orange-500/20 text-orange-500 rounded-lg flex items-center justify-center group-hover:bg-orange-500 group-hover:text-white transition-colors">
                                      <Bike size={20} />
                                  </div>
                                  <div className="text-left">
                                      <h4 className="font-bold text-white">Driver Partner</h4>
                                      <p className="text-xs text-gray-400">Okada, Keke, Mini-bus</p>
                                  </div>
                              </button>

                              <button 
                                onClick={() => handleQuickLogin('tola@gmail.com')}
                                className="w-full flex items-center gap-4 p-4 bg-gray-800 hover:bg-gray-700 rounded-xl border border-gray-700 transition-all group"
                              >
                                  <div className="w-10 h-10 bg-blue-500/20 text-blue-500 rounded-lg flex items-center justify-center group-hover:bg-blue-500 group-hover:text-white transition-colors">
                                      <User size={20} />
                                  </div>
                                  <div className="text-left">
                                      <h4 className="font-bold text-white">Passenger</h4>
                                      <p className="text-xs text-gray-400">Request Rides & Logistics</p>
                                  </div>
                              </button>

                              <div className="relative py-4">
                                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-800"></div></div>
                                  <div className="relative flex justify-center text-xs uppercase"><span className="bg-gray-900 px-2 text-gray-500">Restricted Area</span></div>
                              </div>

                              <button 
                                onClick={() => setLoginMode('STAFF')}
                                className="w-full text-center text-sm text-emerald-500 hover:text-emerald-400 font-medium py-2"
                              >
                                  Log in as Staff / Admin
                              </button>
                          </div>
                      ) : (
                          // STAFF LOGIN FLOW
                          <div>
                              {loginStep === 'CREDENTIALS' && (
                                  <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                                      <div>
                                          <label className="block text-xs font-bold text-gray-500 mb-1">Email / Username</label>
                                          <input 
                                              className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white outline-none focus:border-emerald-500"
                                              placeholder="admin@naijamove.ng"
                                              value={loginData.email}
                                              onChange={e => setLoginData({...loginData, email: e.target.value})}
                                          />
                                      </div>
                                      <div>
                                          <label className="block text-xs font-bold text-gray-500 mb-1">Password</label>
                                          <input 
                                              type="password"
                                              className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white outline-none focus:border-emerald-500"
                                              placeholder="••••••••"
                                              value={loginData.password}
                                              onChange={e => setLoginData({...loginData, password: e.target.value})}
                                          />
                                      </div>
                                      <button 
                                          onClick={handleStaffLoginInit}
                                          disabled={isAuthLoading}
                                          className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold flex items-center justify-center gap-2"
                                      >
                                          {isAuthLoading ? <Loader2 className="animate-spin"/> : 'Authenticate'}
                                      </button>
                                      <button onClick={() => setLoginMode('USER')} className="w-full text-xs text-gray-500 hover:text-white">Cancel</button>
                                  </div>
                              )}

                              {loginStep === 'SETUP_TOTP' && (
                                  <div className="space-y-4 animate-in fade-in slide-in-from-right-4 text-center">
                                      <div className="mx-auto w-16 h-16 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mb-2">
                                          <ShieldCheck size={32} />
                                      </div>
                                      <h4 className="font-bold text-lg">Setup Authenticator</h4>
                                      <p className="text-xs text-gray-400">Scan this code with the NaijaMove Authenticator App to link your account.</p>
                                      
                                      <div className="bg-white p-2 rounded-xl inline-block mx-auto">
                                          <img src={totpSetupData?.qrCode} alt="QR" className="w-40 h-40" />
                                      </div>

                                      <div className="bg-gray-800 p-2 rounded border border-gray-700 flex justify-between items-center gap-2">
                                          <code className="text-emerald-400 font-mono text-sm">{totpSetupData?.secret}</code>
                                          <button className="text-gray-400 hover:text-white"><Copy size={14}/></button>
                                      </div>

                                      <button 
                                          onClick={() => setLoginStep('TOTP')}
                                          className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-sm"
                                      >
                                          I have scanned it
                                      </button>
                                  </div>
                              )}

                              {loginStep === 'TOTP' && (
                                  <div className="space-y-4 animate-in fade-in slide-in-from-right-4 text-center">
                                      <div className="mx-auto w-16 h-16 bg-blue-500/20 text-blue-500 rounded-full flex items-center justify-center mb-2">
                                          <Lock size={32} />
                                      </div>
                                      <h4 className="font-bold text-lg">Enter Token</h4>
                                      <p className="text-xs text-gray-400">Open your NaijaMove Authenticator and enter the 6-digit code.</p>
                                      
                                      <input 
                                          type="text"
                                          maxLength={6}
                                          className="w-full bg-gray-800 border border-gray-700 rounded p-4 text-center text-2xl font-mono tracking-[0.5em] text-white outline-none focus:border-blue-500"
                                          placeholder="000000"
                                          value={loginData.token}
                                          onChange={e => setLoginData({...loginData, token: e.target.value.replace(/\D/g,'')})}
                                      />

                                      <button 
                                          onClick={handleTotpVerify}
                                          disabled={loginData.token.length !== 6 || isAuthLoading}
                                          className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold flex items-center justify-center gap-2"
                                      >
                                          {isAuthLoading ? <Loader2 className="animate-spin"/> : 'Verify Login'}
                                      </button>
                                  </div>
                              )}
                          </div>
                      )}
                  </div>
              </div>
          </div>
      )}

      {/* --- Signup Modal --- */}
      {isSignupOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
              <div className="bg-white text-gray-900 w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
                  <div className="bg-emerald-600 p-6 text-white flex justify-between items-start sticky top-0 z-10">
                      <div>
                          <h2 className="text-2xl font-bold">Create Account</h2>
                          <p className="text-emerald-100 text-sm mt-1">Join Nigeria's smartest logistics network</p>
                      </div>
                      <button onClick={() => setIsSignupOpen(false)} className="bg-white/20 p-1 rounded hover:bg-white/30"><ChevronDown size={20} className="rotate-180"/></button>
                  </div>
                  
                  <div className="p-8">
                      {/* Steps Indicator */}
                      <div className="flex items-center mb-8 text-sm">
                          <div className={`flex items-center gap-2 ${signupStep >= 1 ? 'text-emerald-600 font-bold' : 'text-gray-400'}`}>
                              <span className="w-6 h-6 rounded-full border-2 border-current flex items-center justify-center">1</span>
                              Verification
                          </div>
                          <div className="h-px bg-gray-300 w-12 mx-2"></div>
                          <div className={`flex items-center gap-2 ${signupStep >= 2 ? 'text-emerald-600 font-bold' : 'text-gray-400'}`}>
                              <span className="w-6 h-6 rounded-full border-2 border-current flex items-center justify-center">2</span>
                              Details
                          </div>
                      </div>

                      {signupStep === 1 ? (
                          <div className="space-y-4">
                              <p className="text-sm text-gray-600 mb-4">Please enter your National Identity Number (NIN) to verify your identity.</p>
                              
                              <div>
                                  <label className="block text-sm font-bold text-gray-700 mb-1">NIN Number</label>
                                  <div className="relative">
                                    <ScanLine className="absolute left-3 top-3 text-gray-400" size={18}/>
                                    <input 
                                        type="text"
                                        maxLength={11}
                                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none font-mono text-lg tracking-widest"
                                        placeholder="12345678901"
                                        value={signupData.nin}
                                        onChange={e => setSignupData({...signupData, nin: e.target.value.replace(/\D/g, '')})}
                                    />
                                  </div>
                                  <p className="text-xs text-gray-500 mt-1">Must be 11 digits.</p>
                              </div>

                              <button 
                                disabled={signupData.nin.length !== 11 || ninLoading}
                                onClick={handleVerifyNin}
                                className="w-full py-3 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                              >
                                {ninLoading ? <Loader2 className="animate-spin" /> : 'Verify Identity'}
                              </button>
                          </div>
                      ) : (
                          <div className="space-y-4">
                              {/* Verified Info Card */}
                              <div className="flex items-center gap-4 bg-emerald-50 p-4 rounded-xl border border-emerald-100 mb-4">
                                  <img src={verifiedNinData?.photo} className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-sm" />
                                  <div>
                                      <p className="text-xs text-emerald-600 font-bold uppercase tracking-wider">Identity Verified</p>
                                      <h3 className="font-bold text-gray-900 text-lg">{signupData.name}</h3>
                                      <p className="text-xs text-gray-500">NIN: {signupData.nin}</p>
                                  </div>
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                  <div>
                                      <label className="block text-xs font-bold text-gray-700 mb-1">Email</label>
                                      <input 
                                          type="email"
                                          className="w-full p-3 border border-gray-300 rounded-lg text-sm"
                                          value={signupData.email}
                                          onChange={e => setSignupData({...signupData, email: e.target.value})}
                                      />
                                  </div>
                                  <div>
                                      <label className="block text-xs font-bold text-gray-700 mb-1">Phone</label>
                                      <input 
                                          type="tel"
                                          className="w-full p-3 border border-gray-300 rounded-lg text-sm"
                                          value={signupData.phone}
                                          onChange={e => setSignupData({...signupData, phone: e.target.value})}
                                      />
                                  </div>
                              </div>

                              <div>
                                  <label className="block text-xs font-bold text-gray-700 mb-1">I want to</label>
                                  <div className="flex gap-2">
                                      <button 
                                        onClick={() => setSignupData({...signupData, role: UserRole.PASSENGER})}
                                        className={`flex-1 py-3 rounded-lg border font-medium text-sm flex flex-col items-center gap-1 ${signupData.role === UserRole.PASSENGER ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-200 text-gray-600'}`}
                                      >
                                          <User size={18}/> Request Rides
                                      </button>
                                      <button 
                                        onClick={() => setSignupData({...signupData, role: UserRole.DRIVER})}
                                        className={`flex-1 py-3 rounded-lg border font-medium text-sm flex flex-col items-center gap-1 ${signupData.role === UserRole.DRIVER ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-200 text-gray-600'}`}
                                      >
                                          <Bike size={18}/> Drive
                                      </button>
                                  </div>
                              </div>

                              {signupData.role === UserRole.DRIVER && (
                                  <div className="p-4 bg-orange-50 border border-orange-100 rounded-xl space-y-3 animate-in fade-in">
                                      <h4 className="font-bold text-orange-900 text-sm">Vehicle Details (Self-Owned)</h4>
                                      <div className="grid grid-cols-2 gap-4">
                                          <div>
                                              <label className="block text-xs font-bold text-orange-800 mb-1">Type</label>
                                              <select 
                                                className="w-full p-2 text-sm border border-orange-200 rounded"
                                                value={signupData.vehicleType}
                                                onChange={e => setSignupData({...signupData, vehicleType: e.target.value as any})}
                                              >
                                                  <option value={VehicleType.OKADA}>Okada (Bike)</option>
                                                  <option value={VehicleType.KEKE}>Keke (Tricycle)</option>
                                                  <option value={VehicleType.MINIBUS}>Mini Bus</option>
                                                  <option value={VehicleType.TRUCK}>Truck</option>
                                              </select>
                                          </div>
                                          <div>
                                              <label className="block text-xs font-bold text-orange-800 mb-1">Plate Number</label>
                                              <input 
                                                className="w-full p-2 text-sm border border-orange-200 rounded uppercase"
                                                placeholder="ABC-123-XY"
                                                value={signupData.licensePlate}
                                                onChange={e => setSignupData({...signupData, licensePlate: e.target.value})}
                                              />
                                          </div>
                                      </div>
                                  </div>
                              )}

                              <div className="bg-gray-50 p-3 rounded-lg text-xs text-gray-500 flex gap-2">
                                  <CreditCard size={16} className="text-gray-400 flex-shrink-0"/>
                                  <p>A virtual Wema Bank account will be automatically created for your wallet funding upon completion.</p>
                              </div>

                              <button 
                                onClick={handleSignupComplete}
                                disabled={ninLoading || !signupData.email || !signupData.phone || (signupData.role === UserRole.DRIVER && !signupData.licensePlate)}
                                className="w-full py-3 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2"
                              >
                                {ninLoading ? <Loader2 className="animate-spin" /> : 'Complete Registration'} <ArrowRight size={18} />
                              </button>
                          </div>
                      )}
                  </div>
              </div>
          </div>
      )}

      {/* --- Main Hero Content --- */}
      <main className="relative z-10 flex flex-col md:flex-row items-center justify-between px-6 md:px-12 max-w-7xl mx-auto mt-8 md:mt-16 gap-12 flex-grow">
        
        {/* Left: Text & CTA */}
        <div className="flex-1 space-y-8 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <span className="text-sm font-medium text-emerald-300">Live in Sokoto</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold leading-tight tracking-tight">
            {cms.heroTitle} <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-500 typing-effect">
              {cms.heroSubtitle}
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-gray-400 max-w-xl mx-auto md:mx-0 leading-relaxed">
            {cms.heroDescription}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start pt-4">
             <button 
                onClick={() => setIsSignupOpen(true)}
                className="px-8 py-4 bg-emerald-600 text-white rounded-full font-bold text-lg hover:bg-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.4)] transition-all transform hover:scale-105 flex items-center justify-center gap-2"
             >
                Get Started <ChevronRight size={20} />
             </button>
             <button className="px-8 py-4 bg-white/5 text-white border border-white/10 rounded-full font-bold text-lg hover:bg-white/10 backdrop-blur-sm transition-all flex items-center justify-center gap-2">
                <Smartphone size={20} /> Download App
             </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 border-t border-white/10 pt-8 mt-8">
              <div>
                  <div className="text-3xl font-bold text-white">{cms.stats.rides}</div>
                  <div className="text-xs text-gray-500 uppercase tracking-wider mt-1">Rides Completed</div>
              </div>
              <div>
                  <div className="text-3xl font-bold text-emerald-400">{cms.stats.drivers}</div>
                  <div className="text-xs text-gray-500 uppercase tracking-wider mt-1">Verified Drivers</div>
              </div>
              <div>
                  <div className="text-3xl font-bold text-blue-400">{cms.stats.cities}</div>
                  <div className="text-xs text-gray-500 uppercase tracking-wider mt-1">Major Cities</div>
              </div>
          </div>
        </div>

        {/* Right: Holographic 3D Cards - Now using proper separate perspective context */}
        <div className="flex-1 w-full max-w-lg hidden md:block relative h-[600px] flex items-center justify-center">
            {/* Animated Okada Hologram */}
            <div className="relative w-full h-full flex items-center justify-center">
                <img 
                    src="https://cdn-icons-png.flaticon.com/512/171/171827.png" 
                    alt="Holographic Okada" 
                    className="w-96 h-auto hologram-bike"
                />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-20 bg-emerald-500/10 blur-xl rounded-[100%] animate-pulse"></div>
            </div>
        </div>
      </main>

      {/* --- Mobile App Download Section --- */}
      <section className="relative z-10 py-20 border-t border-white/5 bg-white/5 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-6 text-center">
              <h2 className="text-3xl font-bold mb-8">Get the App</h2>
              <div className="flex justify-center gap-6 flex-wrap">
                  <a href={apps.androidUrl} target="_blank" className="flex items-center gap-3 bg-black border border-gray-700 px-6 py-3 rounded-xl hover:bg-gray-900 transition-colors group">
                      <img src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg" className="h-8" alt="Play Store" />
                  </a>
                  <a href={apps.iosUrl} target="_blank" className="flex items-center gap-3 bg-black border border-gray-700 px-6 py-3 rounded-xl hover:bg-gray-900 transition-colors group">
                      <img src="https://upload.wikimedia.org/wikipedia/commons/3/3c/Download_on_the_App_Store_Badge.svg" className="h-8" alt="App Store" />
                  </a>
              </div>
              <p className="text-gray-500 text-sm mt-4">v{apps.version} • Last updated {new Date(apps.lastUpdated).toLocaleDateString()}</p>
          </div>
      </section>

      {/* --- Main Footer --- */}
      <footer className="relative z-10 bg-gray-950 border-t border-gray-900">
          <div className="max-w-7xl mx-auto px-6 py-16">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
                  <div className="space-y-4">
                      <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center"><img src={settings.branding.logoUrl} className="w-6"/></div>
                          <span className="text-xl font-bold text-white">{appName}</span>
                      </div>
                      <p className="text-gray-400 text-sm leading-relaxed">
                          Revolutionizing transportation in Nigeria. From Okada to heavy logistics, we move you forward with safety and dignity.
                      </p>
                  </div>

                  <div>
                      <h4 className="text-white font-bold mb-6">Company</h4>
                      <ul className="space-y-3 text-sm text-gray-500">
                          <li><button onClick={() => onOpenStatic('about')} className="hover:text-emerald-500 transition-colors">About Us</button></li>
                          <li><a href="#" className="hover:text-emerald-500 transition-colors">Careers</a></li>
                          <li><a href="#contact" className="hover:text-emerald-500 transition-colors">Contact Us</a></li>
                      </ul>
                  </div>

                  <div>
                      <h4 className="text-white font-bold mb-6">Legal & Policy</h4>
                      <ul className="space-y-3 text-sm text-gray-500">
                          <li><button onClick={() => onOpenStatic('terms')} className="hover:text-emerald-500 transition-colors">Terms of Service</button></li>
                          <li><button onClick={() => onOpenStatic('privacy')} className="hover:text-emerald-500 transition-colors">Privacy Policy</button></li>
                          <li><button onClick={() => onOpenStatic('refund')} className="hover:text-emerald-500 transition-colors">Refund Policy</button></li>
                      </ul>
                  </div>

                  <div>
                      <h4 className="text-white font-bold mb-6">Connect</h4>
                      <ul className="space-y-3 text-sm text-gray-500">
                          <li className="flex items-center gap-2"><Mail size={16}/> {cms.contactEmail}</li>
                          <li className="flex items-center gap-2"><Phone size={16}/> {cms.contactPhone}</li>
                      </ul>
                  </div>
              </div>
              <div className="border-t border-gray-900 pt-8 text-center text-sm text-gray-600">
                  © 2024 {appName}. All rights reserved.
              </div>
          </div>
      </footer>
    </div>
  );
};

export default LandingPage;
