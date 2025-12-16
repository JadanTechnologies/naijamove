
import React, { useEffect, useState } from 'react';
import { getSystemSettings, updateSystemSettings, getTemplates, saveTemplate, deleteTemplate, getAnnouncements, createAnnouncement, speak } from '../../services/mockService';
import { SystemSettings, TrackerConfig, NotificationTemplate, Announcement, VehicleType } from '../../types';
import { Button } from '../../components/ui/Button';
import { Shield, CreditCard, Bell, Sparkles, Smartphone, Globe, Activity, Router, Plus, Trash2, FileText, Megaphone, Edit, Send, Eye, EyeOff, X, Monitor, Map, Globe2, ShieldAlert, LayoutTemplate, Download, Coins, Plug, AlertTriangle, Box, Truck, Save, RefreshCw } from 'lucide-react';
import { CURRENCY_SYMBOL } from '../../constants';

const PasswordInput = ({ value, onChange, placeholder }: { value?: string, onChange: (val: string) => void, placeholder?: string }) => {
    const [show, setShow] = useState(false);
    return (
        <div className="relative flex-1">
            <input 
                type={show ? "text" : "password"}
                className="w-full p-2 border rounded font-mono text-sm pr-10"
                placeholder={placeholder}
                value={value || ''}
                onChange={(e) => onChange(e.target.value)}
            />
            <button 
                type="button"
                onClick={() => setShow(!show)}
                className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
            >
                {show ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
        </div>
    );
};

const BlockListManager = ({ 
    title, 
    items, 
    onAdd, 
    onRemove, 
    icon: Icon, 
    placeholder 
}: { 
    title: string, 
    items: string[], 
    onAdd: (val: string) => void, 
    onRemove: (val: string) => void, 
    icon: any, 
    placeholder: string 
}) => {
    const [inputValue, setInputValue] = useState('');

    const handleAdd = () => {
        if(inputValue && !items.includes(inputValue)) {
            onAdd(inputValue);
            setInputValue('');
        }
    };

    return (
        <div className="bg-white p-4 rounded-xl border border-gray-200">
            <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Icon size={18} className="text-gray-500" />
                {title}
            </h4>
            <div className="flex gap-2 mb-4">
                <input 
                    className="flex-1 p-2 border rounded text-sm"
                    placeholder={placeholder}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                />
                <Button size="sm" onClick={handleAdd} disabled={!inputValue}>Block</Button>
            </div>
            <div className="flex flex-wrap gap-2">
                {items.length === 0 && <span className="text-xs text-gray-400 italic">No restrictions active.</span>}
                {items.map(item => (
                    <div key={item} className="flex items-center gap-1 bg-red-50 text-red-700 px-2 py-1 rounded text-sm border border-red-100">
                        <span>{item}</span>
                        <button onClick={() => onRemove(item)} className="hover:text-red-900"><X size={14}/></button>
                    </div>
                ))}
            </div>
        </div>
    );
};

const AdminSettings: React.FC = () => {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [activeTab, setActiveTab] = useState('branding');

  // Tracker State
  const [isAddingTracker, setIsAddingTracker] = useState(false);
  const [newTracker, setNewTracker] = useState<Partial<TrackerConfig>>({
      provider: 'TELTONIKA',
      protocol: 'TCP',
      port: 5000,
      serverIp: '0.0.0.0'
  });

  // Template State
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [editingTemplate, setEditingTemplate] = useState<NotificationTemplate | null>(null);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);

  // Announcement State
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [newAnnouncement, setNewAnnouncement] = useState<{title: string; message: string; target: Announcement['target']}>({
      title: '',
      message: '',
      target: 'ALL'
  });

  useEffect(() => {
    getSystemSettings().then(setSettings);
    getTemplates().then(setTemplates);
    getAnnouncements().then(setAnnouncements);
  }, []);

  const handleSave = async () => {
    if (settings) {
      await updateSystemSettings(settings);
      speak("System settings saved successfully.");
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

  const updatePricing = (type: VehicleType, key: 'base' | 'perKm', value: number) => {
      if(!settings) return;
      setSettings({
          ...settings,
          pricing: {
              ...settings.pricing,
              [type]: {
                  ...settings.pricing[type],
                  [key]: value
              }
          }
      });
  };

  const updateLogisticsPricing = (key: string, value: number) => {
      if(!settings) return;
      setSettings({
          ...settings,
          pricing: {
              ...settings.pricing,
              logistics: {
                  ...settings.pricing.logistics,
                  [key]: value
              }
          }
      });
  };
  
  const updateLandingPageField = (key: string, value: any) => {
      if (!settings) return;
      setSettings({
        ...settings,
        landingPage: {
            ...settings.landingPage,
            [key]: value
        }
      });
  };

  const updateLandingPageStats = (key: string, value: any) => {
      if (!settings) return;
      setSettings({
        ...settings,
        landingPage: {
            ...settings.landingPage,
            stats: {
                ...settings.landingPage.stats,
                [key]: value
            }
        }
      });
  };

    const updateMobileAppField = (key: string, value: any) => {
      if (!settings) return;
      setSettings({
        ...settings,
        mobileApps: {
            ...settings.mobileApps,
            [key]: value
        }
      });
  };

  const updateSecurityList = (listKey: keyof SystemSettings['security'], action: 'ADD' | 'REMOVE', value: string) => {
      if(!settings) return;
      const list = settings.security[listKey];
      let newList = [...list];
      if(action === 'ADD' && !list.includes(value)) newList.push(value);
      if(action === 'REMOVE') newList = list.filter(i => i !== value);
      
      setSettings({
          ...settings,
          security: {
              ...settings.security,
              [listKey]: newList
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
      speak("New GPS tracker added.");
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

  const handleSaveTemplate = async () => {
      if(!editingTemplate) return;
      await saveTemplate(editingTemplate);
      setTemplates(await getTemplates());
      setEditingTemplate(null);
      setIsTemplateModalOpen(false);
      speak("Notification template saved.");
  };

  const handleDeleteTemplate = async (id: string) => {
      if(confirm('Delete this template?')) {
          await deleteTemplate(id);
          setTemplates(await getTemplates());
          speak("Template deleted.");
      }
  };

  const openNewTemplate = () => {
      setEditingTemplate({
          id: '',
          name: '',
          type: 'EMAIL',
          subject: '',
          body: '',
          variables: []
      });
      setIsTemplateModalOpen(true);
  };

  const handleSendAnnouncement = async () => {
      if(!newAnnouncement.title || !newAnnouncement.message) return;
      await createAnnouncement(newAnnouncement);
      setAnnouncements(await getAnnouncements());
      setNewAnnouncement({ title: '', message: '', target: 'ALL' });
      speak("Announcement broadcast sent successfully.");
  };


  if (!settings) return <div>Loading settings...</div>;

  const renderTabContent = () => {
    switch(activeTab) {
        case 'branding':
            return (
                <div className="space-y-6 animate-in fade-in">
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><LayoutTemplate size={20}/> Core Branding</h3>
                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Application Name</label>
                                <input className="w-full p-2 border rounded" value={settings.branding.appName} onChange={e => updateField('branding', 'appName', e.target.value)} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Logo URL</label>
                                <input className="w-full p-2 border rounded" value={settings.branding.logoUrl} onChange={e => updateField('branding', 'logoUrl', e.target.value)} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Support Email</label>
                                <input className="w-full p-2 border rounded" value={settings.landingPage.contactEmail} onChange={e => updateLandingPageField('contactEmail', e.target.value)} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Support Phone</label>
                                <input className="w-full p-2 border rounded" value={settings.landingPage.contactPhone} onChange={e => updateLandingPageField('contactPhone', e.target.value)} />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Globe size={20}/> Landing Page Content</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Hero Title</label>
                                <input className="w-full p-2 border rounded" value={settings.landingPage.heroTitle} onChange={e => updateLandingPageField('heroTitle', e.target.value)} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Hero Subtitle</label>
                                <input className="w-full p-2 border rounded" value={settings.landingPage.heroSubtitle} onChange={e => updateLandingPageField('heroSubtitle', e.target.value)} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Description</label>
                                <textarea className="w-full p-2 border rounded h-24" value={settings.landingPage.heroDescription} onChange={e => updateLandingPageField('heroDescription', e.target.value)} />
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {Object.entries(settings.landingPage.stats).map(([key, val]) => (
                                    <div key={key}>
                                        <label className="block text-xs font-bold text-gray-500 mb-1 capitalize">{key} Stat</label>
                                        <input className="w-full p-2 border rounded" value={val} onChange={e => updateLandingPageStats(key, e.target.value)} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            );
        case 'mobile':
            return (
                <div className="space-y-6 animate-in fade-in">
                    <h3 className="text-lg font-bold flex items-center gap-2"><Smartphone size={20}/> Mobile Application Management</h3>
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                        <div className="grid md:grid-cols-2 gap-6 mb-6">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Android Play Store URL</label>
                                <input className="w-full p-2 border rounded" value={settings.mobileApps.androidUrl} onChange={e => updateMobileAppField('androidUrl', e.target.value)} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">iOS App Store URL</label>
                                <input className="w-full p-2 border rounded" value={settings.mobileApps.iosUrl} onChange={e => updateMobileAppField('iosUrl', e.target.value)} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Current Version</label>
                                <input className="w-full p-2 border rounded" value={settings.mobileApps.version} onChange={e => updateMobileAppField('version', e.target.value)} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Last Updated</label>
                                <input type="date" className="w-full p-2 border rounded" value={settings.mobileApps.lastUpdated.split('T')[0]} onChange={e => updateMobileAppField('lastUpdated', new Date(e.target.value).toISOString())} />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">Release Notes</label>
                            <textarea className="w-full p-2 border rounded h-32" value={settings.mobileApps.releaseNotes} onChange={e => updateMobileAppField('releaseNotes', e.target.value)} />
                        </div>
                    </div>
                </div>
            );
        case 'pricing':
            return (
                <div className="space-y-6 animate-in fade-in">
                    <h3 className="text-lg font-bold flex items-center gap-2"><Coins size={20}/> Ride Pricing Control</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {Object.keys(settings.pricing).filter(k => k !== 'logistics').map((type) => (
                            <div key={type} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                                <h4 className="font-bold text-gray-900 mb-4">{type}</h4>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1">Base Fare ({CURRENCY_SYMBOL})</label>
                                        <input 
                                            type="number"
                                            className="w-full p-2 border rounded font-mono font-bold"
                                            value={settings.pricing[type as VehicleType].base}
                                            onChange={(e) => updatePricing(type as VehicleType, 'base', parseInt(e.target.value))}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1">Per KM Rate ({CURRENCY_SYMBOL})</label>
                                        <input 
                                            type="number"
                                            className="w-full p-2 border rounded font-mono font-bold"
                                            value={settings.pricing[type as VehicleType].perKm}
                                            onChange={(e) => updatePricing(type as VehicleType, 'perKm', parseInt(e.target.value))}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-8 border-t pt-8">
                        <h3 className="text-lg font-bold flex items-center gap-2 mb-4 text-orange-700">
                            <Box size={20}/> Logistics & Cargo Pricing
                        </h3>
                        <div className="bg-orange-50 p-6 rounded-xl border border-orange-100 max-w-3xl">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-bold text-orange-800 mb-1">Base Logistics Fee</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-2.5 text-gray-500 font-bold">{CURRENCY_SYMBOL}</span>
                                        <input 
                                            type="number"
                                            className="w-full pl-8 p-2 border border-orange-200 rounded"
                                            value={settings.pricing.logistics.baseFare}
                                            onChange={(e) => updateLogisticsPricing('baseFare', parseFloat(e.target.value))}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-orange-800 mb-1">Cost Per KG</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-2.5 text-gray-500 font-bold">{CURRENCY_SYMBOL}</span>
                                        <input 
                                            type="number"
                                            className="w-full pl-8 p-2 border border-orange-200 rounded"
                                            value={settings.pricing.logistics.perKg}
                                            onChange={(e) => updateLogisticsPricing('perKg', parseFloat(e.target.value))}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-orange-800 mb-1">Cost Per KM</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-2.5 text-gray-500 font-bold">{CURRENCY_SYMBOL}</span>
                                        <input 
                                            type="number"
                                            className="w-full pl-8 p-2 border border-orange-200 rounded"
                                            value={settings.pricing.logistics.perKm}
                                            onChange={(e) => updateLogisticsPricing('perKm', parseFloat(e.target.value))}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-orange-800 mb-1">Interstate Multiplier</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-2.5 text-gray-500 font-bold">x</span>
                                        <input 
                                            type="number"
                                            step="0.1"
                                            className="w-full pl-8 p-2 border border-orange-200 rounded"
                                            value={settings.pricing.logistics.interstateMultiplier}
                                            onChange={(e) => updateLogisticsPricing('interstateMultiplier', parseFloat(e.target.value))}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            );
        case 'payments':
            return (
                <div className="space-y-6 animate-in fade-in">
                    <h3 className="text-lg font-bold flex items-center gap-2"><CreditCard size={20}/> Payment Gateways</h3>
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden">
                            <div className="flex justify-between items-center mb-4">
                                <h4 className="font-bold text-gray-900">Paystack</h4>
                                <div onClick={() => updateField('payments', 'paystackEnabled', !settings.payments.paystackEnabled)} className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors ${settings.payments.paystackEnabled ? 'bg-emerald-500' : 'bg-gray-300'}`}>
                                    <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform ${settings.payments.paystackEnabled ? 'translate-x-6' : ''}`}></div>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <label className="block text-xs font-bold text-gray-500">Secret Key</label>
                                <PasswordInput 
                                    value={settings.payments.paystackSecretKey} 
                                    onChange={(v) => updateField('payments', 'paystackSecretKey', v)} 
                                    placeholder="sk_live_..." 
                                />
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden">
                            <div className="flex justify-between items-center mb-4">
                                <h4 className="font-bold text-gray-900">Flutterwave</h4>
                                <div onClick={() => updateField('payments', 'flutterwaveEnabled', !settings.payments.flutterwaveEnabled)} className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors ${settings.payments.flutterwaveEnabled ? 'bg-orange-500' : 'bg-gray-300'}`}>
                                    <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform ${settings.payments.flutterwaveEnabled ? 'translate-x-6' : ''}`}></div>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <label className="block text-xs font-bold text-gray-500">Secret Key</label>
                                <PasswordInput 
                                    value={settings.payments.flutterwaveSecretKey} 
                                    onChange={(v) => updateField('payments', 'flutterwaveSecretKey', v)} 
                                    placeholder="FLWSECK_..." 
                                />
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm col-span-2">
                            <div className="flex justify-between items-center mb-4">
                                <h4 className="font-bold text-gray-900">Manual Bank Transfer</h4>
                                <div onClick={() => updateField('payments', 'manualEnabled', !settings.payments.manualEnabled)} className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors ${settings.payments.manualEnabled ? 'bg-blue-500' : 'bg-gray-300'}`}>
                                    <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform ${settings.payments.manualEnabled ? 'translate-x-6' : ''}`}></div>
                                </div>
                            </div>
                            <label className="block text-xs font-bold text-gray-500 mb-2">Bank Account Details</label>
                            <textarea 
                                className="w-full p-3 border rounded h-24 font-mono text-sm" 
                                value={settings.payments.manualBankDetails}
                                onChange={(e) => updateField('payments', 'manualBankDetails', e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            );
        case 'trackers':
            return (
                <div className="space-y-6 animate-in fade-in">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-bold flex items-center gap-2"><Router size={20}/> GPS Integration Hub</h3>
                        <Button onClick={() => setIsAddingTracker(true)} size="sm"><Plus size={16} className="mr-2"/> Add Tracker</Button>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 text-gray-500 text-xs font-bold">
                                <tr>
                                    <th className="px-6 py-3">Name</th>
                                    <th className="px-6 py-3">Provider</th>
                                    <th className="px-6 py-3">Server IP</th>
                                    <th className="px-6 py-3">Port</th>
                                    <th className="px-6 py-3">Status</th>
                                    <th className="px-6 py-3 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {settings.trackers.integrations.map(tracker => (
                                    <tr key={tracker.id}>
                                        <td className="px-6 py-4 font-medium">{tracker.name}</td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{tracker.provider}</td>
                                        <td className="px-6 py-4 font-mono text-xs">{tracker.serverIp}</td>
                                        <td className="px-6 py-4 font-mono text-xs">{tracker.port}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded text-[10px] font-bold ${tracker.enabled ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                {tracker.enabled ? 'ONLINE' : 'OFFLINE'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button onClick={() => removeTracker(tracker.id)} className="text-red-500 hover:text-red-700"><Trash2 size={16}/></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {settings.trackers.integrations.length === 0 && <div className="p-8 text-center text-gray-500">No trackers configured.</div>}
                    </div>

                    {isAddingTracker && (
                        <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 space-y-4">
                            <h4 className="font-bold text-gray-900">New Tracker Configuration</h4>
                            <div className="grid md:grid-cols-3 gap-4">
                                <input placeholder="Tracker Name" className="p-2 border rounded" value={newTracker.name || ''} onChange={e => setNewTracker({...newTracker, name: e.target.value})} />
                                <select className="p-2 border rounded" value={newTracker.provider} onChange={e => setNewTracker({...newTracker, provider: e.target.value as any})}>
                                    <option value="TELTONIKA">Teltonika</option>
                                    <option value="CONCOX">Concox</option>
                                    <option value="RUPTELA">Ruptela</option>
                                </select>
                                <select className="p-2 border rounded" value={newTracker.protocol} onChange={e => setNewTracker({...newTracker, protocol: e.target.value as any})}>
                                    <option value="TCP">TCP</option>
                                    <option value="UDP">UDP</option>
                                </select>
                                <input placeholder="Server IP" className="p-2 border rounded" value={newTracker.serverIp} onChange={e => setNewTracker({...newTracker, serverIp: e.target.value})} />
                                <input placeholder="Port" type="number" className="p-2 border rounded" value={newTracker.port} onChange={e => setNewTracker({...newTracker, port: parseInt(e.target.value)})} />
                            </div>
                            <div className="flex gap-2 justify-end">
                                <Button variant="outline" onClick={() => setIsAddingTracker(false)}>Cancel</Button>
                                <Button onClick={addTracker}>Save Integration</Button>
                            </div>
                        </div>
                    )}
                </div>
            );
        case 'notifications':
            return (
                <div className="space-y-6 animate-in fade-in">
                    <div className="flex justify-between items-start">
                        <h3 className="text-lg font-bold flex items-center gap-2"><Bell size={20}/> Communication Center</h3>
                        <div className="flex gap-2">
                            <Button size="sm" onClick={openNewTemplate} variant="outline"><FileText size={16} className="mr-2"/> New Template</Button>
                        </div>
                    </div>

                    {/* Announcement Section */}
                    <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
                        <h4 className="font-bold text-blue-900 mb-4 flex items-center gap-2"><Megaphone size={18}/> Send Broadcast</h4>
                        <div className="grid md:grid-cols-2 gap-4 mb-4">
                            <input 
                                className="p-2 border rounded" 
                                placeholder="Title" 
                                value={newAnnouncement.title}
                                onChange={e => setNewAnnouncement({...newAnnouncement, title: e.target.value})}
                            />
                            <select 
                                className="p-2 border rounded"
                                value={newAnnouncement.target}
                                onChange={e => setNewAnnouncement({...newAnnouncement, target: e.target.value as any})}
                            >
                                <option value="ALL">All Users</option>
                                <option value="DRIVERS">Drivers Only</option>
                                <option value="PASSENGERS">Passengers Only</option>
                            </select>
                        </div>
                        <textarea 
                            className="w-full p-2 border rounded h-20 mb-4" 
                            placeholder="Message body..."
                            value={newAnnouncement.message}
                            onChange={e => setNewAnnouncement({...newAnnouncement, message: e.target.value})}
                        />
                        <Button onClick={handleSendAnnouncement}>Send Broadcast</Button>
                    </div>

                    {/* Templates List */}
                    <div className="grid md:grid-cols-2 gap-4">
                        {templates.map(tpl => (
                            <div key={tpl.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm relative group hover:border-emerald-500 transition-colors">
                                <div className="flex justify-between items-start mb-2">
                                    <h5 className="font-bold text-gray-900">{tpl.name}</h5>
                                    <span className="text-[10px] bg-gray-100 px-2 py-1 rounded uppercase font-bold text-gray-500">{tpl.type}</span>
                                </div>
                                <p className="text-xs text-gray-500 line-clamp-2">{tpl.body}</p>
                                <div className="absolute top-2 right-2 hidden group-hover:flex gap-1">
                                    <button onClick={() => {setEditingTemplate(tpl); setIsTemplateModalOpen(true);}} className="p-1 bg-gray-100 rounded hover:bg-emerald-100 text-emerald-600"><Edit size={14}/></button>
                                    <button onClick={() => handleDeleteTemplate(tpl.id)} className="p-1 bg-gray-100 rounded hover:bg-red-100 text-red-600"><Trash2 size={14}/></button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Template Modal */}
                    {isTemplateModalOpen && editingTemplate && (
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                            <div className="bg-white w-full max-w-lg rounded-xl p-6 shadow-2xl animate-in zoom-in-95">
                                <h3 className="font-bold text-lg mb-4">Edit Template</h3>
                                <div className="space-y-4">
                                    <input className="w-full p-2 border rounded" placeholder="Template Name" value={editingTemplate.name} onChange={e => setEditingTemplate({...editingTemplate, name: e.target.value})} />
                                    <select className="w-full p-2 border rounded" value={editingTemplate.type} onChange={e => setEditingTemplate({...editingTemplate, type: e.target.value as any})}>
                                        <option value="EMAIL">Email</option>
                                        <option value="SMS">SMS</option>
                                        <option value="PUSH">Push Notification</option>
                                    </select>
                                    {editingTemplate.type === 'EMAIL' && (
                                        <input className="w-full p-2 border rounded" placeholder="Subject Line" value={editingTemplate.subject} onChange={e => setEditingTemplate({...editingTemplate, subject: e.target.value})} />
                                    )}
                                    <textarea className="w-full p-2 border rounded h-32 font-mono text-sm" placeholder="Body content with {{variables}}..." value={editingTemplate.body} onChange={e => setEditingTemplate({...editingTemplate, body: e.target.value})} />
                                    <div className="flex justify-end gap-2">
                                        <Button variant="outline" onClick={() => setIsTemplateModalOpen(false)}>Cancel</Button>
                                        <Button onClick={handleSaveTemplate}>Save Template</Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            );
        case 'security':
            return (
                <div className="space-y-6 animate-in fade-in">
                    <h3 className="text-lg font-bold flex items-center gap-2"><Shield size={20}/> Firewall & Access Control</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <BlockListManager 
                            title="Blocked IP Addresses"
                            icon={Monitor}
                            items={settings.security.blockedIps}
                            onAdd={(v) => updateSecurityList('blockedIps', 'ADD', v)}
                            onRemove={(v) => updateSecurityList('blockedIps', 'REMOVE', v)}
                            placeholder="e.g. 192.168.1.1"
                        />
                        <BlockListManager 
                            title="Blocked Countries (ISO)"
                            icon={Globe2}
                            items={settings.security.blockedCountries}
                            onAdd={(v) => updateSecurityList('blockedCountries', 'ADD', v)}
                            onRemove={(v) => updateSecurityList('blockedCountries', 'REMOVE', v)}
                            placeholder="e.g. US, RU"
                        />
                    </div>
                </div>
            );
        case 'ai':
            return (
                <div className="space-y-6 animate-in fade-in">
                    <h3 className="text-lg font-bold flex items-center gap-2"><Sparkles size={20}/> Artificial Intelligence</h3>
                    <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-6 rounded-xl border border-emerald-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <h4 className="font-bold text-gray-900">Gemini AI Engine</h4>
                                <p className="text-sm text-gray-600">Powers fraud detection, route optimization, and chat support.</p>
                            </div>
                            <div onClick={() => updateField('ai', 'geminiEnabled', !settings.ai.geminiEnabled)} className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors ${settings.ai.geminiEnabled ? 'bg-emerald-500' : 'bg-gray-300'}`}>
                                <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform ${settings.ai.geminiEnabled ? 'translate-x-6' : ''}`}></div>
                            </div>
                        </div>
                    </div>
                </div>
            );
        default:
            return <div className="text-center p-10 text-gray-500">Select a category to configure.</div>;
    }
  };

  return (
    <div className="flex gap-6 h-[calc(100vh-140px)]">
        {/* Sidebar */}
        <div className="w-64 flex-shrink-0 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden h-full flex flex-col">
            <div className="p-4 border-b border-gray-100 bg-gray-50">
                <h2 className="font-bold text-gray-700">System Configuration</h2>
            </div>
            <nav className="flex-1 overflow-y-auto p-2 space-y-1">
                {[
                    { id: 'branding', icon: LayoutTemplate, label: 'Branding & CMS' },
                    { id: 'mobile', icon: Smartphone, label: 'Mobile Apps' },
                    { id: 'pricing', icon: Coins, label: 'Fares & Pricing' },
                    { id: 'payments', icon: CreditCard, label: 'Payment Gateways' },
                    { id: 'trackers', icon: Router, label: 'GPS Integrations' },
                    { id: 'notifications', icon: Bell, label: 'Notifications' },
                    { id: 'security', icon: Shield, label: 'Security & Access' },
                    { id: 'ai', icon: Sparkles, label: 'AI Settings' },
                ].map((item) => (
                    <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === item.id ? 'bg-emerald-50 text-emerald-700' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                        <item.icon size={18} />
                        {item.label}
                    </button>
                ))}
            </nav>
            <div className="p-4 border-t border-gray-100">
                <Button className="w-full" onClick={handleSave}><Save size={16} className="mr-2"/> Save Changes</Button>
            </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto pb-10">
            {renderTabContent()}
        </div>
    </div>
  );
};

export default AdminSettings;
