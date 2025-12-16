
import React, { useState, useEffect } from 'react';
import { Bike, Box, Car, ChevronRight, ShieldCheck, Zap, Map, ChevronDown, Download, Phone, Mail, Key, User, CreditCard, ScanLine, ArrowRight, Loader2, Truck, Smartphone } from 'lucide-react';
import { getSystemSettings, verifyNin, signup } from '../services/mockService';
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
  const [staffToken, setStaffToken] = useState('');
  const [showStaffInput, setShowStaffInput] = useState(false);
  const { addToast } = useToast();

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

  const handleLoginSelection = (email: string) => {
    setIsLoginOpen(false);
    onLogin(email);
  };

  const handleStaffLogin = () => {
      if(staffToken) {
          onLogin(staffToken, true);
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
          // Auto login
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
            transform: perspective(500px) rotateX(60deg);
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
        .hologram-card {
            background: rgba(255, 255, 255, 0.03);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            box-shadow: 0 0 40px rgba(16, 185, 129, 0.1);
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .hologram-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 50px rgba(16, 185, 129, 0.2);
            border-color: rgba(16, 185, 129, 0.3);
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

      <div className="absolute inset-0 perspective-grid z-0 opacity-40 pointer-events-none">
        <div className="grid-floor"></div>
      </div>
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
        </div>
      </nav>

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

        {/* Right: Holographic 3D Cards */}
        <div className="flex-1 w-full max-w-lg hidden md:block perspective-grid relative h-[600px]">
            <div className="relative w-full h-full transform preserve-3d animate-float">
                {/* Back Card (Logistics) */}
                <div className="absolute top-10 right-0 w-72 h-40 hologram-card rounded-2xl p-6 transform translate-z-[-50px] rotate-y-[-10deg] rotate-x-[5deg]">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-orange-500/20 rounded-lg text-orange-400"><Box size={24}/></div>
                        <span className="text-xs font-mono text-orange-300">LOGISTICS</span>
                    </div>
                    <div className="space-y-2">
                        <div className="h-2 w-2/3 bg-white/10 rounded"></div>
                        <div className="h-2 w-1/2 bg-white/10 rounded"></div>
                    </div>
                </div>

                {/* Middle Card (Map) */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-[450px] bg-gray-900 rounded-[3rem] border-8 border-gray-800 shadow-2xl overflow-hidden transform rotate-y-[15deg]">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-gray-800 rounded-b-xl z-20"></div>
                    <img src="https://i.imgur.com/8Qj9X9r.png" alt="Map App" className="w-full h-full object-cover opacity-80" />
                    <div className="absolute bottom-0 inset-x-0 h-1/2 bg-gradient-to-t from-gray-900 to-transparent"></div>
                    
                    {/* Floating Elements on Phone */}
                    <div className="absolute bottom-20 left-6 right-6 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white"><Bike size={20}/></div>
                            <div>
                                <div className="text-sm font-bold text-white">Musa is arriving</div>
                                <div className="text-xs text-gray-400">2 mins away • Okada</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Front Card (Ride) */}
                <div className="absolute bottom-20 left-0 w-72 h-40 hologram-card rounded-2xl p-6 transform translate-z-[50px] rotate-y-[10deg] rotate-x-[-5deg]">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-emerald-500/20 rounded-lg text-emerald-400"><Car size={24}/></div>
                        <span className="text-xs font-mono text-emerald-300">RIDE ACTIVE</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-2xl font-bold text-white">₦400</div>
                        <div className="text-xs text-gray-400">Sokoto Market <br/> to University</div>
                    </div>
                </div>
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