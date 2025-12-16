import React, { useEffect, useState } from 'react';
import { getSystemSettings, updateSystemSettings } from '../../services/mockService';
import { SystemSettings, TrackerConfig } from '../../types';
import { Button } from '../../components/ui/Button';
import { Shield, CreditCard, Bell, Sparkles, Smartphone, Globe, Lock, Activity, Radio, Router, Plus, Trash2 } from 'lucide-react';

const AdminSettings: React.FC = () => {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [activeTab, setActiveTab] = useState('branding');

  // Tracker State for new addition
  const [isAddingTracker, setIsAddingTracker] = useState(false);
  const [newTracker, setNewTracker] = useState<Partial<TrackerConfig>>({
      provider: 'TELTONIKA',
      protocol: 'TCP',
      port: 5000,
      serverIp: '0.0.0.0'
  });

  useEffect(() => {
    getSystemSettings().then(setSettings);
  }, []);

  const handleSave = async () => {
    if (settings) {
      await updateSystemSettings(settings);
    }
  };

  const updateField = (section: keyof SystemSettings, key: string, value: any) => {
    if (!settings) return;
    setSettings({
      ...settings,
      [section]: {
        //@ts-ignore
        ...settings[section],
        [key]: value
      }
    });
  };

  const addTracker = () => {
      if(!settings || !newTracker.name) return;
      const tracker: TrackerConfig = {
          id: `trk-${Date.now()}`,
          name: newTracker.name,
          provider: newTracker.provider as any,
          protocol: newTracker.protocol as any,
          port: newTracker.port || 5000,
          serverIp: newTracker.serverIp || '0.0.0.0',
          enabled: true
      };
      
      setSettings({
          ...settings,
          trackers: {
              ...settings.trackers,
              integrations: [...settings.trackers.integrations, tracker]
          }
      });
      setIsAddingTracker(false);
      setNewTracker({ provider: 'TELTONIKA', protocol: 'TCP', port: 5000, serverIp: '0.0.0.0' });
  };

  const removeTracker = (id: string) => {
      if(!settings) return;
      setSettings({
          ...settings,
          trackers: {
              ...settings.trackers,
              integrations: settings.trackers.integrations.filter(t => t.id !== id)
          }
      });
  };

  if (!settings) return <div>Loading settings...</div>;

  const renderTabContent = () => {
    switch(activeTab) {
        case 'branding':
            return (
                <div className="space-y-6 animate-in fade-in">
                    <h3 className="text-lg font-bold">App Branding</h3>
                    <div className="grid gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Application Name</label>
                            <input 
                                className="w-full p-2 border rounded" 
                                value={settings.branding.appName} 
                                onChange={(e) => updateField('branding', 'appName', e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Logo URL</label>
                            <input 
                                className="w-full p-2 border rounded" 
                                value={settings.branding.logoUrl} 
                                onChange={(e) => updateField('branding', 'logoUrl', e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Primary Color</label>
                            <input 
                                type="color"
                                className="h-10 w-20 p-1 border rounded" 
                                value={settings.branding.primaryColor} 
                                onChange={(e) => updateField('branding', 'primaryColor', e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            );
        case 'trackers':
            return (
                <div className="space-y-6 animate-in fade-in">
                    <div className="flex justify-between items-center">
                        <div>
                            <h3 className="text-lg font-bold flex items-center gap-2"><Router size={20} className="text-blue-600"/> GPS Trackers</h3>
                            <p className="text-sm text-gray-500">Manage hardware integrations for Okada & Fleet.</p>
                        </div>
                        <Button size="sm" onClick={() => setIsAddingTracker(true)} disabled={isAddingTracker}>
                            <Plus size={16} className="mr-2"/> Add Tracker
                        </Button>
                    </div>

                    {isAddingTracker && (
                        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 mb-6 animate-in slide-in-from-top-2">
                            <h4 className="font-bold text-blue-900 mb-4">New Integration</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-xs font-bold text-blue-800 mb-1">Friendly Name</label>
                                    <input 
                                        className="w-full p-2 text-sm border rounded" 
                                        placeholder="e.g. Lagos Okada Fleet"
                                        value={newTracker.name || ''}
                                        onChange={e => setNewTracker({...newTracker, name: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-blue-800 mb-1">Provider Protocol</label>
                                    <select 
                                        className="w-full p-2 text-sm border rounded bg-white"
                                        value={newTracker.provider}
                                        onChange={e => setNewTracker({...newTracker, provider: e.target.value as any})}
                                    >
                                        <option value="TELTONIKA">Teltonika (FMB/FMC Series)</option>
                                        <option value="RUPTELA">Ruptela</option>
                                        <option value="CONCOX">Concox / Jimi IoT</option>
                                        <option value="CALAMP">CalAmp LMU</option>
                                        <option value="QUECLINK">Queclink</option>
                                        <option value="MEITRACK">Meitrack</option>
                                        <option value="COBAN">Coban (GPS103)</option>
                                        <option value="SUNTECH">Suntech</option>
                                        <option value="GOSAFE">Gosafe</option>
                                        <option value="TRAMIGO">Tramigo</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-blue-800 mb-1">Server IP (Listener)</label>
                                    <input 
                                        className="w-full p-2 text-sm border rounded" 
                                        value={newTracker.serverIp}
                                        onChange={e => setNewTracker({...newTracker, serverIp: e.target.value})}
                                    />
                                </div>
                                <div className="flex gap-4">
                                    <div className="flex-1">
                                        <label className="block text-xs font-bold text-blue-800 mb-1">Port</label>
                                        <input 
                                            type="number"
                                            className="w-full p-2 text-sm border rounded" 
                                            value={newTracker.port}
                                            onChange={e => setNewTracker({...newTracker, port: parseInt(e.target.value)})}
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <label className="block text-xs font-bold text-blue-800 mb-1">Protocol</label>
                                        <select 
                                            className="w-full p-2 text-sm border rounded bg-white"
                                            value={newTracker.protocol}
                                            onChange={e => setNewTracker({...newTracker, protocol: e.target.value as any})}
                                        >
                                            <option value="TCP">TCP</option>
                                            <option value="UDP">UDP</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2 justify-end">
                                <Button size="sm" variant="outline" onClick={() => setIsAddingTracker(false)}>Cancel</Button>
                                <Button size="sm" onClick={addTracker}>Save Integration</Button>
                            </div>
                        </div>
                    )}

                    <div className="grid gap-4">
                        {settings.trackers.integrations.map(tracker => (
                            <div key={tracker.id} className="bg-white p-4 rounded-xl border border-gray-200 flex items-center justify-between group hover:shadow-md transition-shadow">
                                <div className="flex items-center gap-4">
                                    <div className={`p-3 rounded-lg ${tracker.enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                                        <Router size={24} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-900">{tracker.name}</h4>
                                        <div className="flex gap-3 text-xs text-gray-500 font-mono mt-1">
                                            <span className="bg-gray-100 px-1.5 py-0.5 rounded">{tracker.provider}</span>
                                            <span>{tracker.serverIp}:{tracker.port}</span>
                                            <span>{tracker.protocol}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-2 mr-4">
                                        <div className={`w-2 h-2 rounded-full ${tracker.enabled ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300'}`}></div>
                                        <span className="text-xs font-medium text-gray-600">{tracker.enabled ? 'Listening' : 'Disabled'}</span>
                                    </div>
                                    <button 
                                        onClick={() => removeTracker(tracker.id)}
                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}
                        {settings.trackers.integrations.length === 0 && !isAddingTracker && (
                            <div className="text-center py-10 bg-gray-50 border border-dashed rounded-xl">
                                <p className="text-gray-500">No hardware trackers configured.</p>
                                <button onClick={() => setIsAddingTracker(true)} className="text-blue-600 font-medium text-sm mt-2 hover:underline">Connect a device</button>
                            </div>
                        )}
                    </div>
                </div>
            );
        case 'payments':
            return (
                <div className="space-y-6 animate-in fade-in">
                    <h3 className="text-lg font-bold">Payment Gateways</h3>
                    <div className="space-y-4">
                        <label className="flex items-center space-x-3 p-4 border rounded bg-gray-50">
                            <input 
                                type="checkbox" 
                                checked={settings.payments.paystackEnabled}
                                onChange={(e) => updateField('payments', 'paystackEnabled', e.target.checked)}
                                className="w-5 h-5 text-emerald-600 rounded"
                            />
                            <div className="flex-1">
                                <span className="font-bold block">Paystack</span>
                                <span className="text-xs text-gray-500">Nigeria's leading payment gateway</span>
                            </div>
                        </label>
                        <label className="flex items-center space-x-3 p-4 border rounded bg-gray-50">
                            <input 
                                type="checkbox" 
                                checked={settings.payments.flutterwaveEnabled}
                                onChange={(e) => updateField('payments', 'flutterwaveEnabled', e.target.checked)}
                                className="w-5 h-5 text-emerald-600 rounded"
                            />
                            <div>
                                <span className="font-bold block">Flutterwave</span>
                                <span className="text-xs text-gray-500">International payments support</span>
                            </div>
                        </label>
                         <label className="flex items-center space-x-3 p-4 border rounded bg-gray-50">
                            <input 
                                type="checkbox" 
                                checked={settings.payments.manualEnabled}
                                onChange={(e) => updateField('payments', 'manualEnabled', e.target.checked)}
                                className="w-5 h-5 text-emerald-600 rounded"
                            />
                            <div className="flex-1">
                                <span className="font-bold block">Manual Bank Transfer</span>
                                <input 
                                    className="mt-2 w-full p-2 text-sm border rounded"
                                    placeholder="Enter Bank Details"
                                    value={settings.payments.manualBankDetails}
                                    onChange={(e) => updateField('payments', 'manualBankDetails', e.target.value)}
                                />
                            </div>
                        </label>
                    </div>
                </div>
            );
        case 'ai':
             return (
                <div className="space-y-6 animate-in fade-in">
                    <h3 className="text-lg font-bold flex items-center gap-2"><Sparkles size={20} className="text-purple-600"/> Gemini AI Integration</h3>
                    <div className="p-6 bg-purple-50 rounded-xl border border-purple-100">
                        <label className="flex items-center justify-between">
                            <div>
                                <span className="font-bold text-gray-900 block">Enable Gemini AI</span>
                                <span className="text-sm text-gray-600">Powers auto-reply chat bots and fraud detection algorithms.</span>
                            </div>
                            <div className="relative inline-block w-12 h-6 align-middle select-none transition duration-200 ease-in">
                                <input type="checkbox" 
                                    checked={settings.ai.geminiEnabled}
                                    onChange={(e) => updateField('ai', 'geminiEnabled', e.target.checked)}
                                    className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
                                />
                                <label className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer ${settings.ai.geminiEnabled ? 'bg-purple-600' : 'bg-gray-300'}`}></label>
                            </div>
                        </label>
                        
                        {settings.ai.geminiEnabled && (
                            <div className="mt-4 pt-4 border-t border-purple-200 grid gap-4">
                                <div className="bg-white p-3 rounded">
                                    <div className="text-xs font-bold text-purple-800 uppercase mb-1">Fraud Detection</div>
                                    <p className="text-sm text-gray-600">Active. Monitoring transaction velocity and IP geolocation anomalies.</p>
                                </div>
                                <div className="bg-white p-3 rounded">
                                    <div className="text-xs font-bold text-purple-800 uppercase mb-1">Auto-Reply Bot</div>
                                    <p className="text-sm text-gray-600">Active. Handling level 1 support queries for Drivers and Passengers.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            );
        case 'communication':
            return (
                <div className="space-y-6 animate-in fade-in">
                     <h3 className="text-lg font-bold">Communication Providers</h3>
                     <div className="grid gap-6">
                         <div>
                             <label className="block text-sm font-bold mb-2">SMS Provider (OTP)</label>
                             <select 
                                value={settings.communication.smsProvider} 
                                className="w-full p-2 border rounded bg-gray-50"
                                onChange={(e) => updateField('communication', 'smsProvider', e.target.value)}
                             >
                                 <option value="TWILIO">Twilio</option>
                                 <option value="INFOBIP">Infobip</option>
                                 <option value="TERMII">Termii (Nigeria)</option>
                             </select>
                         </div>
                         <div>
                             <label className="block text-sm font-bold mb-2">Push Notifications</label>
                             <select 
                                value={settings.communication.pushProvider}
                                className="w-full p-2 border rounded bg-gray-50"
                                onChange={(e) => updateField('communication', 'pushProvider', e.target.value)}
                             >
                                 <option value="ONESIGNAL">OneSignal</option>
                                 <option value="FIREBASE">Firebase Cloud Messaging</option>
                             </select>
                         </div>
                         <div>
                             <label className="block text-sm font-bold mb-2">Email Service</label>
                             <select 
                                value={settings.communication.emailProvider}
                                className="w-full p-2 border rounded bg-gray-50"
                                onChange={(e) => updateField('communication', 'emailProvider', e.target.value)}
                             >
                                 <option value="RESEND">Resend</option>
                                 <option value="SMTP">Custom SMTP</option>
                             </select>
                         </div>
                     </div>
                </div>
            );
        default:
            return <div>Select a category</div>;
    }
  };

  const tabs = [
    { id: 'branding', icon: Globe, label: 'Branding' },
    { id: 'trackers', icon: Router, label: 'Trackers' },
    { id: 'payments', icon: CreditCard, label: 'Payments' },
    { id: 'communication', icon: Bell, label: 'Communication' },
    { id: 'ai', icon: Sparkles, label: 'AI & Fraud' },
    { id: 'security', icon: Lock, label: 'Security' },
    { id: 'system', icon: Activity, label: 'System Health' },
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 min-h-[600px] flex flex-col md:flex-row overflow-hidden">
        {/* Sidebar */}
        <div className="w-full md:w-64 bg-gray-50 border-r border-gray-200 p-4">
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 px-2">Settings</h2>
            <div className="space-y-1">
                {tabs.map(t => (
                    <button
                        key={t.id}
                        onClick={() => setActiveTab(t.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === t.id ? 'bg-emerald-100 text-emerald-800' : 'text-gray-600 hover:bg-gray-100'}`}
                    >
                        <t.icon size={18} />
                        {t.label}
                    </button>
                ))}
            </div>
        </div>
        
        {/* Content */}
        <div className="flex-1 p-8 overflow-y-auto">
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900">System Configuration</h2>
                <Button onClick={handleSave}>Save Changes</Button>
            </div>
            {renderTabContent()}
        </div>
    </div>
  );
};

export default AdminSettings;