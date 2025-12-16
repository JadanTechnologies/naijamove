import React, { useEffect, useState } from 'react';
import { getSystemSettings, updateSystemSettings } from '../../services/mockService';
import { SystemSettings } from '../../types';
import { Button } from '../../components/ui/Button';
import { Shield, CreditCard, Bell, Sparkles, Smartphone, Globe, Lock, Activity } from 'lucide-react';

const AdminSettings: React.FC = () => {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [activeTab, setActiveTab] = useState('branding');

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