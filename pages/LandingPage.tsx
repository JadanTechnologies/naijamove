
import React, { useState, useEffect } from 'react';
import { Bike, Box, Car, ChevronRight, ShieldCheck, Zap, Map, ChevronDown, Download, Phone, Mail, Key, User, CreditCard, ScanLine, ArrowRight, Loader2, Truck, Smartphone, Lock, QrCode, Copy, Sun, Moon, ShoppingBag, Shield, Star } from 'lucide-react';
import { getSystemSettings, verifyNin, signup, login, setupTotp, verifyTotpToken } from '../services/mockService';
import { SystemSettings, UserRole, VehicleType } from '../types';
import { useToast } from '../components/ui/Toast';

interface LandingPageProps {
  onLogin: (identifier: string, isToken?: boolean) => void;
  loading?: boolean;
  onOpenStatic: (page: string) => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onLogin, loading, onOpenStatic, isDarkMode, toggleTheme }) => {
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
      name: string; email: string; phone: string; nin: string; role: UserRole; vehicleType?: VehicleType; licensePlate?: string; referralCode?: string;
  }>({
      name: '', email: '', phone: '', nin: '', role: UserRole.PASSENGER, vehicleType: VehicleType.OKADA, licensePlate: '', referralCode: ''
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
          try {
              await login(loginData.email); // This might throw TOTP_SETUP_REQUIRED
              onLogin(loginData.email);
          } catch (e: any) {
              if (e.message === 'TOTP_SETUP_REQUIRED') {
                  const setup = await setupTotp('admin-1'); 
                  setTotpSetupData(setup);
                  setLoginStep('SETUP_TOTP');
              } else if (e.message.includes('Suspended') || e.message.includes('Banned')) {
                  addToast(e.message, 'error');
              } else {
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

  if (!settings) return <div className="min-h-screen dark:bg-black bg-gray-50 flex items-center justify-center text-emerald-500 animate-pulse">Initializing...</div>;

  const appName = settings.branding.appName;
  const cms = settings.landingPage;
  const apps = settings.mobileApps;

  return (
    <div className="min-h-screen dark:bg-black bg-slate-50 dark:text-white text-gray-900 overflow-x-hidden relative selection:bg-emerald-500 selection:text-white font-sans flex flex-col transition-colors duration-300">
      
      <style>{`
        .hologram-bike {
            filter: drop-shadow(0 0 20px rgba(16, 185, 129, 0.6)) hue-rotate(140deg) brightness(1.5) contrast(1.2);
            opacity: 0.9;
            animation: drive-loop 8s ease-in-out infinite;
        }
        .light-mode-bike {
            filter: drop-shadow(0 10px 15px rgba(0,0,0,0.1));
            animation: drive-loop 8s ease-in-out infinite;
        }

        @keyframes drive-loop {
            0% { transform: translateX(-100px) scaleX(1) translateY(0); opacity: 0; }
            10% { opacity: 0.9; }
            45% { transform: translateX(100px) scaleX(1) translateY(-20px); }
            50% { transform: translateX(100px) scaleX(-1) translateY(-20px); }
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
      
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none z-0"></div>

      {/* --- Navbar --- */}
      <nav className="relative z-50 flex items-center justify-between px-6 py-6 md:px-12 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg dark:shadow-[0_0_15px_rgba(16,185,129,0.5)] overflow-hidden border border-gray-100 dark:border-none">
            <img 
                src={settings.branding.logoUrl || "https://cdn-icons-png.flaticon.com/512/2972/2972185.png"}
                alt="Logo" 
                className="w-8 h-8 object-contain" 
            />
          </div>
          <span className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400">
            {appName}
          </span>
        </div>
        
        <div className="hidden md:flex gap-8 text-sm font-medium text-gray-600 dark:text-gray-400">
           <button onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">How it Works</button>
           <button onClick={() => onOpenStatic('about')} className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">About Us</button>
           <button onClick={() => onOpenStatic('faq')} className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">FAQs</button>
           <a href={`mailto:${cms.contactEmail}`} className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Contact Us</a>
         </div>

        <div className="flex items-center gap-4">
             <button 
                onClick={toggleTheme}
                className="p-2 rounded-full bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-yellow-400 transition-all hover:scale-110"
             >
                 {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
             </button>

             <button 
                onClick={() => setIsSignupOpen(true)}
                className="hidden md:block px-5 py-2.5 text-sm font-bold dark:text-white text-gray-700 border dark:border-white/20 border-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
             >
                Register
             </button>
             
             <button 
                onClick={() => {
                    setIsLoginOpen(true);
                    setLoginMode('USER');
                    setLoginStep('CREDENTIALS');
                }}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold bg-gray-900 dark:bg-white text-white dark:text-black rounded-full hover:bg-gray-700 dark:hover:bg-gray-100 transition-colors shadow-lg"
            >
                Sign In <ChevronDown size={16} />
            </button>
        </div>
      </nav>

      {/* --- Login Modal --- */}
      {isLoginOpen && (
          <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
              <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-2xl border border-gray-200 dark:border-gray-700 shadow-2xl overflow-hidden animate-in zoom-in-95">
                  <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                          {loginMode === 'USER' ? 'Portal Login' : 'Staff Access'}
                      </h3>
                      <button onClick={() => setIsLoginOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white"><ChevronDown size={20}/></button>
                  </div>

                  <div className="p-6">
                      {loginMode === 'USER' ? (
                          <div className="space-y-2">
                              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Select your dashboard to continue.</p>
                              <button 
                                onClick={() => handleQuickLogin('musa@amanaride.ng')}
                                className="w-full flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-700 transition-all group"
                              >
                                  <div className="w-10 h-10 bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-500 rounded-lg flex items-center justify-center group-hover:bg-orange-500 group-hover:text-white transition-colors">
                                      <Bike size={20} />
                                  </div>
                                  <div className="text-left">
                                      <h4 className="font-bold text-gray-900 dark:text-white">Driver Partner</h4>
                                      <p className="text-xs text-gray-500 dark:text-gray-400">Okada, Keke, Mini-bus</p>
                                  </div>
                              </button>

                              <button 
                                onClick={() => handleQuickLogin('tola@gmail.com')}
                                className="w-full flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-700 transition-all group"
                              >
                                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-500 rounded-lg flex items-center justify-center group-hover:bg-blue-500 group-hover:text-white transition-colors">
                                      <User size={20} />
                                  </div>
                                  <div className="text-left">
                                      <h4 className="font-bold text-gray-900 dark:text-white">Passenger</h4>
                                      <p className="text-xs text-gray-500 dark:text-gray-400">Request Rides & Logistics</p>
                                  </div>
                              </button>

                              <div className="relative py-4">
                                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200 dark:border-gray-800"></div></div>
                                  <div className="relative flex justify-center text-xs uppercase"><span className="bg-white dark:bg-gray-900 px-2 text-gray-500">Restricted Area</span></div>
                              </div>

                              <button 
                                onClick={() => setLoginMode('STAFF')}
                                className="w-full text-center text-sm text-emerald-600 dark:text-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-400 font-medium py-2"
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
                                              className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded p-2 text-gray-900 dark:text-white outline-none focus:border-emerald-500"
                                              placeholder="admin@amanaride.ng"
                                              value={loginData.email}
                                              onChange={e => setLoginData({...loginData, email: e.target.value})}
                                          />
                                      </div>
                                      <div>
                                          <label className="block text-xs font-bold text-gray-500 mb-1">Password</label>
                                          <input 
                                              type="password"
                                              className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded p-2 text-gray-900 dark:text-white outline-none focus:border-emerald-500"
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
                                      <button onClick={() => setLoginMode('USER')} className="w-full text-xs text-gray-500 hover:text-gray-900 dark:hover:text-white">Cancel</button>
                                      
                                      <div className="pt-4 border-t border-gray-200 dark:border-gray-800 text-center">
                                          <button 
                                              type="button"
                                              onClick={() => setLoginData({ email: 'admin@amanaride.ng', password: 'password', token: '' })}
                                              className="text-xs text-emerald-600 font-bold hover:text-emerald-500 underline"
                                          >
                                              Auto-fill Super Admin
                                          </button>
                                      </div>
                                  </div>
                              )}

                              {loginStep === 'SETUP_TOTP' && (
                                  <div className="space-y-4 animate-in fade-in slide-in-from-right-4 text-center">
                                      <div className="mx-auto w-16 h-16 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-500 rounded-full flex items-center justify-center mb-2">
                                          <ShieldCheck size={32} />
                                      </div>
                                      <h4 className="font-bold text-lg dark:text-white">Setup Authenticator</h4>
                                      <p className="text-xs text-gray-500 dark:text-gray-400">Scan this code with the AmanaRide Authenticator App to link your account.</p>
                                      
                                      <div className="bg-white p-2 rounded-xl inline-block mx-auto border border-gray-200">
                                          <img src={totpSetupData?.qrCode} alt="QR" className="w-40 h-40" />
                                      </div>

                                      <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-700 flex justify-between items-center gap-2">
                                          <code className="text-emerald-600 dark:text-emerald-400 font-mono text-sm">{totpSetupData?.secret}</code>
                                          <button className="text-gray-400 hover:text-gray-900 dark:hover:text-white"><Copy size={14}/></button>
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
                                      <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-500 rounded-full flex items-center justify-center mb-2">
                                          <Lock size={32} />
                                      </div>
                                      <h4 className="font-bold text-lg dark:text-white">Enter Token</h4>
                                      <p className="text-xs text-gray-500 dark:text-gray-400">Open your AmanaRide Authenticator and enter the 6-digit code.</p>
                                      
                                      <input 
                                          type="text"
                                          maxLength={6}
                                          className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded p-4 text-center text-2xl font-mono tracking-[0.5em] text-gray-900 dark:text-white outline-none focus:border-blue-500"
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
          <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
              <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-2xl border border-gray-200 dark:border-gray-700 shadow-2xl overflow-hidden animate-in zoom-in-95">
                  <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">Create Account</h3>
                      <button onClick={() => setIsSignupOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white"><ChevronDown size={20}/></button>
                  </div>

                  <div className="p-6">
                      {signupStep === 1 ? (
                          <div className="space-y-4 animate-in fade-in">
                              <div>
                                  <label className="block text-xs font-bold text-gray-500 mb-1">National Identity Number (NIN)</label>
                                  <input
                                      className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded p-2 text-gray-900 dark:text-white outline-none focus:border-emerald-500"
                                      placeholder="12345678901"
                                      value={signupData.nin}
                                      onChange={e => setSignupData({...signupData, nin: e.target.value})}
                                  />
                              </div>
                              <div>
                                  <label className="block text-xs font-bold text-gray-500 mb-1">Account Type</label>
                                  <select
                                      className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded p-2 text-gray-900 dark:text-white outline-none focus:border-emerald-500"
                                      value={signupData.role}
                                      onChange={e => setSignupData({...signupData, role: e.target.value as UserRole})}
                                  >
                                      <option value={UserRole.PASSENGER}>Passenger</option>
                                      <option value={UserRole.DRIVER}>Driver Partner</option>
                                  </select>
                              </div>
                              <div>
                                  <label className="block text-xs font-bold text-gray-500 mb-1">Referral Code (Optional)</label>
                                  <input
                                      className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded p-2 text-gray-900 dark:text-white outline-none focus:border-emerald-500"
                                      placeholder="Enter referral code"
                                      value={signupData.referralCode}
                                      onChange={e => setSignupData({...signupData, referralCode: e.target.value})}
                                  />
                              </div>
                              {signupData.role === UserRole.DRIVER && (
                                  <div>
                                      <label className="block text-xs font-bold text-gray-500 mb-1">Vehicle Type</label>
                                      <select
                                          className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded p-2 text-gray-900 dark:text-white outline-none focus:border-emerald-500"
                                          value={signupData.vehicleType}
                                          onChange={e => setSignupData({...signupData, vehicleType: e.target.value as VehicleType})}
                                      >
                                          <option value={VehicleType.OKADA}>Okada</option>
                                          <option value={VehicleType.KEKE}>Keke</option>
                                          <option value={VehicleType.MINIBUS}>Mini-bus</option>
                                          <option value={VehicleType.TRUCK}>Truck</option>
                                      </select>
                                  </div>
                              )}
                              <button
                                  onClick={handleVerifyNin}
                                  disabled={ninLoading || !signupData.nin}
                                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold flex items-center justify-center gap-2"
                              >
                                  {ninLoading ? <Loader2 className="animate-spin"/> : 'Verify Identity'}
                              </button>
                              <button onClick={() => setIsSignupOpen(false)} className="w-full text-xs text-gray-500 hover:text-gray-900 dark:hover:text-white">Cancel</button>
                          </div>
                      ) : (
                          <div className="space-y-4 animate-in fade-in">
                              {verifiedNinData && (
                                  <div className="bg-emerald-50 dark:bg-emerald-500/10 p-4 rounded-lg border border-emerald-200 dark:border-emerald-500/30">
                                      <h4 className="font-bold text-emerald-900 dark:text-emerald-400 mb-2">Identity Verified</h4>
                                      <p className="text-sm text-emerald-700 dark:text-emerald-300">
                                          {verifiedNinData.firstName} {verifiedNinData.lastName}
                                      </p>
                                  </div>
                              )}
                              <div>
                                  <label className="block text-xs font-bold text-gray-500 mb-1">Full Name</label>
                                  <input
                                      className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded p-2 text-gray-900 dark:text-white outline-none focus:border-emerald-500"
                                      value={signupData.name}
                                      onChange={e => setSignupData({...signupData, name: e.target.value})}
                                  />
                              </div>
                              <div>
                                  <label className="block text-xs font-bold text-gray-500 mb-1">Email</label>
                                  <input
                                      type="email"
                                      className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded p-2 text-gray-900 dark:text-white outline-none focus:border-emerald-500"
                                      placeholder="your@email.com"
                                      value={signupData.email}
                                      onChange={e => setSignupData({...signupData, email: e.target.value})}
                                  />
                              </div>
                              <div>
                                  <label className="block text-xs font-bold text-gray-500 mb-1">Phone Number</label>
                                  <input
                                      className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded p-2 text-gray-900 dark:text-white outline-none focus:border-emerald-500"
                                      placeholder="+2348012345678"
                                      value={signupData.phone}
                                      onChange={e => setSignupData({...signupData, phone: e.target.value})}
                                  />
                              </div>
                              {signupData.role === UserRole.DRIVER && (
                                  <div>
                                      <label className="block text-xs font-bold text-gray-500 mb-1">License Plate</label>
                                      <input
                                          className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded p-2 text-gray-900 dark:text-white outline-none focus:border-emerald-500"
                                          placeholder="ABC-123-XY"
                                          value={signupData.licensePlate}
                                          onChange={e => setSignupData({...signupData, licensePlate: e.target.value})}
                                      />
                                  </div>
                              )}
                              <button
                                  onClick={handleSignupComplete}
                                  disabled={ninLoading || !signupData.name || !signupData.email || !signupData.phone}
                                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold flex items-center justify-center gap-2"
                              >
                                  {ninLoading ? <Loader2 className="animate-spin"/> : 'Create Account'}
                              </button>
                              <button onClick={() => setSignupStep(1)} className="w-full text-xs text-gray-500 hover:text-gray-900 dark:hover:text-white">Back</button>
                          </div>
                      )}
                  </div>
              </div>
          </div>
      )}

      {/* --- Main Hero Content --- */}
      <main className="relative z-10 flex flex-col md:flex-row items-center justify-between px-6 md:px-12 max-w-7xl mx-auto mt-8 md:mt-16 gap-12 flex-grow">
        
        <div className="flex-1 space-y-8 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 dark:bg-white/5 border border-emerald-100 dark:border-white/10 backdrop-blur-sm">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Live in Sokoto</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold leading-tight tracking-tight text-gray-900 dark:text-white">
            {cms.heroTitle} <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-600 dark:from-emerald-400 dark:via-teal-300 dark:to-emerald-500 typing-effect">
              {cms.heroSubtitle}
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 max-w-xl mx-auto md:mx-0 leading-relaxed">
            {cms.heroDescription}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start pt-4">
             <button 
                onClick={() => setIsSignupOpen(true)}
                className="px-8 py-4 bg-emerald-600 text-white rounded-full font-bold text-lg hover:bg-emerald-700 dark:hover:bg-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.4)] transition-all transform hover:scale-105 flex items-center justify-center gap-2"
             >
                Get Started <ChevronRight size={20} />
             </button>
             <button className="px-8 py-4 bg-white dark:bg-white/5 text-gray-900 dark:text-white border border-gray-200 dark:border-white/10 rounded-full font-bold text-lg hover:bg-gray-50 dark:hover:bg-white/10 backdrop-blur-sm transition-all flex items-center justify-center gap-2 shadow-sm">
                <Smartphone size={20} /> Download App
             </button>
          </div>

          <div className="grid grid-cols-3 gap-8 border-t border-gray-200 dark:border-white/10 pt-8 mt-8">
              <div>
                  <div className="text-3xl font-bold text-gray-900 dark:text-white">{cms.stats.rides}</div>
                  <div className="text-xs text-gray-500 uppercase tracking-wider mt-1">Rides Completed</div>
              </div>
              <div>
                  <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{cms.stats.drivers}</div>
                  <div className="text-xs text-gray-500 uppercase tracking-wider mt-1">Verified Drivers</div>
              </div>
              <div>
                  <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{cms.stats.cities}</div>
                  <div className="text-xs text-gray-500 uppercase tracking-wider mt-1">Major Cities</div>
              </div>
          </div>

          {/* Scroll Down Button */}
          <div className="flex justify-center mt-12">
              <button
                  onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
                  className="p-3 rounded-full bg-white/10 dark:bg-white/5 backdrop-blur-sm border border-white/20 dark:border-white/10 hover:bg-white/20 dark:hover:bg-white/10 transition-all animate-bounce"
              >
                  <ChevronDown size={24} className="text-gray-600 dark:text-gray-400" />
              </button>
          </div>
        </div>

        <div className="flex-1 w-full max-w-lg hidden md:block relative h-[600px] flex items-center justify-center">
            <div className="relative w-full h-full flex items-center justify-center">
                <img 
                    src="https://cdn-icons-png.flaticon.com/512/171/171827.png" 
                    alt="Holographic Okada" 
                    className={`w-96 h-auto ${isDarkMode ? 'hologram-bike' : 'light-mode-bike'}`}
                />
                <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-20 blur-xl rounded-[100%] animate-pulse ${isDarkMode ? 'bg-emerald-500/10' : 'bg-black/10'}`}></div>
            </div>
        </div>
      </main>

      {/* How It Works Section */}
      <section id="how-it-works" className="relative z-10 py-24 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              How It Works
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Get started with AmanaRide in just a few simple steps. Whether you're a passenger or driver, we've made it easy to move around Nigeria.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="text-center group">
              <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <User size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">1. Sign Up</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Create your account with NIN verification for secure access. Choose whether you're a passenger or driver partner.
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center group">
              <div className="w-20 h-20 bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <Map size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">2. Request or Accept</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Passengers request rides or deliveries. Drivers accept requests and navigate using our real-time GPS tracking.
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center group">
              <div className="w-20 h-20 bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <Zap size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">3. Ride & Pay</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Enjoy safe, affordable transportation. Pay securely with multiple options including wallet, card, or cash.
              </p>
            </div>
          </div>

          {/* Additional Features */}
          <div className="mt-20 grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 text-center">
              <ShieldCheck className="w-8 h-8 text-emerald-600 dark:text-emerald-400 mx-auto mb-3" />
              <h4 className="font-bold text-gray-900 dark:text-white mb-2">Verified Drivers</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">All drivers are NIN-verified and background checked.</p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 text-center">
              <Map className="w-8 h-8 text-blue-600 dark:text-blue-400 mx-auto mb-3" />
              <h4 className="font-bold text-gray-900 dark:text-white mb-2">Real-time Tracking</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">Track your ride in real-time with GPS accuracy.</p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 text-center">
              <CreditCard className="w-8 h-8 text-purple-600 dark:text-purple-400 mx-auto mb-3" />
              <h4 className="font-bold text-gray-900 dark:text-white mb-2">Secure Payments</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">Multiple payment options with fraud protection.</p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 text-center">
              <Phone className="w-8 h-8 text-orange-600 dark:text-orange-400 mx-auto mb-3" />
              <h4 className="font-bold text-gray-900 dark:text-white mb-2">24/7 Support</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">Round-the-clock customer support in multiple languages.</p>
            </div>
          </div>
        </div>
      </section>


      <footer className="relative z-10 bg-white dark:bg-gray-950 border-t border-gray-200 dark:border-gray-900">
          <div className="max-w-7xl mx-auto px-6 py-16">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
                  <div className="space-y-4">
                      <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-gray-900 dark:bg-white rounded-lg flex items-center justify-center"><img src={settings.branding.logoUrl} className="w-6"/></div>
                          <span className="text-xl font-bold text-gray-900 dark:text-white">{appName}</span>
                      </div>
                      <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
                          Revolutionizing transportation in Nigeria. From Okada to heavy logistics, we move you forward with safety and dignity.
                      </p>
                  </div>

                  <div>
                      <h4 className="text-gray-900 dark:text-white font-bold mb-6">Company</h4>
                      <ul className="space-y-3 text-sm text-gray-500 dark:text-gray-500">
                          <li><button onClick={() => onOpenStatic('about')} className="hover:text-emerald-600 dark:hover:text-emerald-500 transition-colors">About Us</button></li>
                          <li><a href="#" className="hover:text-emerald-600 dark:hover:text-emerald-500 transition-colors">Careers</a></li>
                          <li><a href="#contact" className="hover:text-emerald-600 dark:hover:text-emerald-500 transition-colors">Contact Us</a></li>
                      </ul>
                  </div>

                  <div>
                      <h4 className="text-gray-900 dark:text-white font-bold mb-6">Legal & Policy</h4>
                      <ul className="space-y-3 text-sm text-gray-500 dark:text-gray-500">
                          <li><button onClick={() => onOpenStatic('terms')} className="hover:text-emerald-600 dark:hover:text-emerald-500 transition-colors">Terms of Service</button></li>
                          <li><button onClick={() => onOpenStatic('privacy')} className="hover:text-emerald-600 dark:hover:text-emerald-500 transition-colors">Privacy Policy</button></li>
                          <li><button onClick={() => onOpenStatic('refund')} className="hover:text-emerald-600 dark:hover:text-emerald-500 transition-colors">Refund Policy</button></li>
                      </ul>
                  </div>

                  <div>
                      <h4 className="text-gray-900 dark:text-white font-bold mb-6">Connect</h4>
                      <ul className="space-y-3 text-sm text-gray-500 dark:text-gray-500">
                          <li className="flex items-center gap-2"><Mail size={16}/> {cms.contactEmail}</li>
                          <li className="flex items-center gap-2"><Phone size={16}/> {cms.contactPhone}</li>
                      </ul>
                  </div>
              </div>
              <div className="border-t border-gray-200 dark:border-gray-900 pt-8 text-center text-sm text-gray-500 flex flex-col items-center gap-2">
                  <p>© 2024 {appName}. All rights reserved.</p>
                  <p className="font-medium text-emerald-600 dark:text-emerald-500">Developed by Jadan Technologies</p>
              </div>
          </div>
      </footer>
    </div>
  );
};

export default LandingPage;

