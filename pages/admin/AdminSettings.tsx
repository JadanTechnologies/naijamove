
import React, { useEffect, useState } from 'react';
import { getSystemSettings, updateSystemSettings, getTemplates, saveTemplate, deleteTemplate, getAnnouncements, createAnnouncement, speak } from '../../services/mockService';
import { SystemSettings, TrackerConfig, NotificationTemplate, Announcement, VehicleType } from '../../types';
import { Button } from '../../components/ui/Button';
import { Shield, CreditCard, Bell, Sparkles, Smartphone, Router, Trash2, Megaphone, Eye, EyeOff, X, Monitor, Globe2, LayoutTemplate, Coins, Save, Link, Plus, Check, Search, Tag, Mic, Plug } from 'lucide-react';
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

  // Announcement State
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [newAnnouncement, setNewAnnouncement] = useState<{title: string; message: string; target: Announcement['target']}>({
      title: '',
      message: '',
      target: 'ALL'
  });

  useEffect(() => {
    getSystemSettings().then(setSettings);
    getTemplates().then(() => {}); // Preload templates if needed
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

  const updateLandingPageStats = (key: string, value: string) => {
      if(!settings) return;
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

  const updateSeoField = (key: string, value: string) => {
      if(!settings) return;
      setSettings({
          ...settings,
          seo: {
              ...settings.seo,
              [key]: value
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

  const updateIntegrationField = (key: string, value: any) => {
      if (!settings) return;
      setSettings({
          ...settings,
          integrations: {
              ...settings.integrations,
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
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><LayoutTemplate size={20}/> Identity & CMS</h3>
                        <div className="grid md:grid-cols-2 gap-6 mb-6">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Application Name</label>
                                <input className="w-full p-2 border rounded" value={settings.branding.appName} onChange={e => updateField('branding', 'appName', e.target.value)} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Logo URL</label>
                                <input className="w-full p-2 border rounded" value={settings.branding.logoUrl} onChange={e => updateField('branding', 'logoUrl', e.target.value)} />
                            </div>
                        </div>

                        <div className="border-t pt-4">
                            <h4 className="font-bold text-gray-800 mb-4">Landing Page Content</h4>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Hero Title</label>
                                    <input className="w-full p-2 border rounded font-bold text-lg" value={settings.landingPage.heroTitle} onChange={e => updateLandingPageField('heroTitle', e.target.value)} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Hero Subtitle</label>
                                    <input className="w-full p-2 border rounded" value={settings.landingPage.heroSubtitle} onChange={e => updateLandingPageField('heroSubtitle', e.target.value)} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Description</label>
                                    <textarea className="w-full p-2 border rounded h-20" value={settings.landingPage.heroDescription} onChange={e => updateLandingPageField('heroDescription', e.target.value)} />
                                </div>
                            </div>
                        </div>

                        <div className="border-t pt-4 mt-4">
                            <h4 className="font-bold text-gray-800 mb-4">Display Stats</h4>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Total Rides</label>
                                    <input className="w-full p-2 border rounded" value={settings.landingPage.stats.rides} onChange={e => updateLandingPageStats('rides', e.target.value)} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Verified Drivers</label>
                                    <input className="w-full p-2 border rounded" value={settings.landingPage.stats.drivers} onChange={e => updateLandingPageStats('drivers', e.target.value)} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Cities Covered</label>
                                    <input className="w-full p-2 border rounded" value={settings.landingPage.stats.cities} onChange={e => updateLandingPageStats('cities', e.target.value)} />
                                </div>
                            </div>
                        </div>

                        <div className="border-t pt-4 mt-4">
                            <h4 className="font-bold text-gray-800 mb-4">Contact Information</h4>
                            <div className="grid grid-cols-2 gap-4">
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
                    </div>

                    {/* SEO Section */}
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Search size={20}/> SEO & Metadata</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Meta Title</label>
                                <input className="w-full p-2 border rounded" value={settings.seo?.metaTitle || ''} onChange={e => updateSeoField('metaTitle', e.target.value)} placeholder="App Name - Slogan" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Meta Description</label>
                                <textarea className="w-full p-2 border rounded h-20" value={settings.seo?.metaDescription || ''} onChange={e => updateSeoField('metaDescription', e.target.value)} placeholder="Description for search engines..." />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Keywords</label>
                                    <input className="w-full p-2 border rounded" value={settings.seo?.keywords || ''} onChange={e => updateSeoField('keywords', e.target.value)} placeholder="ride, taxi, logistics" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">OG Image URL</label>
                                    <input className="w-full p-2 border rounded" value={settings.seo?.ogImage || ''} onChange={e => updateSeoField('ogImage', e.target.value)} placeholder="https://..." />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            );
        
        case 'mobile':
            return (
                <div className="space-y-6 animate-in fade-in">
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Smartphone size={20}/> Mobile App Distribution</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Android Play Store URL</label>
                                <input className="w-full p-2 border rounded" value={settings.mobileApps.androidUrl} onChange={e => updateMobileAppField('androidUrl', e.target.value)} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">iOS App Store URL</label>
                                <input className="w-full p-2 border rounded" value={settings.mobileApps.iosUrl} onChange={e => updateMobileAppField('iosUrl', e.target.value)} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Current Version</label>
                                    <input className="w-full p-2 border rounded" value={settings.mobileApps.version} onChange={e => updateMobileAppField('version', e.target.value)} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Release Notes</label>
                                    <input className="w-full p-2 border rounded" value={settings.mobileApps.releaseNotes} onChange={e => updateMobileAppField('releaseNotes', e.target.value)} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            );

        case 'pricing':
            return (
                <div className="space-y-6 animate-in fade-in">
                    <h3 className="text-lg font-bold flex items-center gap-2"><Coins size={20}/> Fare & Pricing Model</h3>
                    
                    <div className="grid md:grid-cols-2 gap-6">
                        {Object.keys(settings.pricing).filter(k => k !== 'logistics').map((vType) => (
                            <div key={vType} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                                <h4 className="font-bold text-gray-900 mb-3 capitalize">{vType.toLowerCase()} Fares</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1">Base Fare ({CURRENCY_SYMBOL})</label>
                                        <input 
                                            type="number"
                                            className="w-full p-2 border rounded"
                                            value={settings.pricing[vType as VehicleType].base}
                                            onChange={e => updatePricing(vType as VehicleType, 'base', parseInt(e.target.value))}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1">Per KM ({CURRENCY_SYMBOL})</label>
                                        <input 
                                            type="number"
                                            className="w-full p-2 border rounded"
                                            value={settings.pricing[vType as VehicleType].perKm}
                                            onChange={e => updatePricing(vType as VehicleType, 'perKm', parseInt(e.target.value))}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="bg-orange-50 p-6 rounded-xl border border-orange-100">
                        <h4 className="font-bold text-orange-900 mb-4">Logistics & Cargo Pricing</h4>
                        <div className="grid md:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-orange-800 mb-1">Base Fee</label>
                                <input 
                                    type="number"
                                    className="w-full p-2 border border-orange-200 rounded"
                                    value={settings.pricing.logistics.baseFare}
                                    onChange={e => updateLogisticsPricing('baseFare', parseInt(e.target.value))}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-orange-800 mb-1">Per KG</label>
                                <input 
                                    type="number"
                                    className="w-full p-2 border border-orange-200 rounded"
                                    value={settings.pricing.logistics.perKg}
                                    onChange={e => updateLogisticsPricing('perKg', parseInt(e.target.value))}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-orange-800 mb-1">Per KM</label>
                                <input 
                                    type="number"
                                    className="w-full p-2 border border-orange-200 rounded"
                                    value={settings.pricing.logistics.perKm}
                                    onChange={e => updateLogisticsPricing('perKm', parseInt(e.target.value))}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-orange-800 mb-1">Interstate Multiplier</label>
                                <input 
                                    type="number"
                                    step="0.1"
                                    className="w-full p-2 border border-orange-200 rounded"
                                    value={settings.pricing.logistics.interstateMultiplier}
                                    onChange={e => updateLogisticsPricing('interstateMultiplier', parseFloat(e.target.value))}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            );

        case 'trackers':
            return (
                <div className="space-y-6 animate-in fade-in">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-bold flex items-center gap-2"><Router size={20}/> GPS Tracker Integrations</h3>
                        <Button onClick={() => setIsAddingTracker(!isAddingTracker)} size="sm">
                            {isAddingTracker ? 'Cancel' : 'Add Tracker'}
                        </Button>
                    </div>

                    {isAddingTracker && (
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-4 animate-in slide-in-from-top-2">
                            <h4 className="font-bold text-gray-700 mb-3">Configure New Device Stream</h4>
                            <div className="grid md:grid-cols-4 gap-4 mb-4">
                                <input placeholder="Integration Name" className="p-2 border rounded" value={newTracker.name} onChange={e => setNewTracker({...newTracker, name: e.target.value})} />
                                <select className="p-2 border rounded" value={newTracker.provider} onChange={e => setNewTracker({...newTracker, provider: e.target.value as any})}>
                                    <option value="TELTONIKA">Teltonika</option>
                                    <option value="CONCOX">Concox</option>
                                    <option value="RUPTELA">Ruptela</option>
                                    <option value="QUECLINK">Queclink</option>
                                </select>
                                <input placeholder="Server IP" className="p-2 border rounded" value={newTracker.serverIp} onChange={e => setNewTracker({...newTracker, serverIp: e.target.value})} />
                                <input placeholder="Port" type="number" className="p-2 border rounded" value={newTracker.port} onChange={e => setNewTracker({...newTracker, port: parseInt(e.target.value)})} />
                            </div>
                            <Button onClick={addTracker}>Establish Connection</Button>
                        </div>
                    )}

                    <div className="grid gap-4">
                        {settings.trackers.integrations.map(tracker => (
                            <div key={tracker.id} className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
                                <div className="flex items-center gap-4">
                                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Router size={24}/></div>
                                    <div>
                                        <h4 className="font-bold text-gray-900">{tracker.name}</h4>
                                        <p className="text-xs text-gray-500">{tracker.provider} • {tracker.protocol} • Port {tracker.port}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                        Active
                                    </span>
                                    <button onClick={() => removeTracker(tracker.id)} className="text-red-400 hover:text-red-600"><Trash2 size={18}/></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            );

        case 'notifications':
            return (
                <div className="space-y-6 animate-in fade-in">
                    <h3 className="text-lg font-bold flex items-center gap-2"><Bell size={20}/> Communication Center</h3>
                    
                    <div className="grid md:grid-cols-3 gap-6">
                        {/* Email Provider */}
                        <div className="bg-white p-4 rounded-xl border border-gray-200">
                            <h4 className="font-bold text-gray-700 mb-3">Email Gateway</h4>
                            <select 
                                className="w-full p-2 border rounded mb-2"
                                value={settings.communication.emailProvider}
                                onChange={e => updateField('communication', 'emailProvider', e.target.value)}
                            >
                                <option value="RESEND">Resend</option>
                                <option value="SMTP">SMTP</option>
                                <option value="SENDGRID">SendGrid</option>
                                <option value="MAILGUN">Mailgun</option>
                            </select>
                            <input 
                                type="password" 
                                className="w-full p-2 border rounded" 
                                placeholder="API Key" 
                                value={settings.communication.emailApiKey} 
                                onChange={e => updateField('communication', 'emailApiKey', e.target.value)}
                            />
                        </div>

                        {/* SMS Provider */}
                        <div className="bg-white p-4 rounded-xl border border-gray-200">
                            <h4 className="font-bold text-gray-700 mb-3">SMS Gateway</h4>
                            <select 
                                className="w-full p-2 border rounded mb-2"
                                value={settings.communication.smsProvider}
                                onChange={e => updateField('communication', 'smsProvider', e.target.value)}
                            >
                                <option value="TWILIO">Twilio</option>
                                <option value="TERMII">Termii (Nigeria)</option>
                                <option value="INFOBIP">Infobip</option>
                                <option value="AFRICASTALKING">AfricasTalking</option>
                            </select>
                            <input 
                                type="password" 
                                className="w-full p-2 border rounded" 
                                placeholder="API Key" 
                                value={settings.communication.smsApiKey} 
                                onChange={e => updateField('communication', 'smsApiKey', e.target.value)}
                            />
                        </div>

                        {/* Push Provider */}
                        <div className="bg-white p-4 rounded-xl border border-gray-200">
                            <h4 className="font-bold text-gray-700 mb-3">Push Notifications</h4>
                            <select 
                                className="w-full p-2 border rounded mb-2"
                                value={settings.communication.pushProvider}
                                onChange={e => updateField('communication', 'pushProvider', e.target.value)}
                            >
                                <option value="ONESIGNAL">OneSignal</option>
                                <option value="FIREBASE">Firebase FCM</option>
                            </select>
                            <input 
                                type="password" 
                                className="w-full p-2 border rounded" 
                                placeholder="API Key / Server Key" 
                                value={settings.communication.pushApiKey} 
                                onChange={e => updateField('communication', 'pushApiKey', e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 mt-6">
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
                </div>
            );

        case 'integrations':
            return (
                <div className="space-y-6 animate-in fade-in">
                    <h3 className="text-lg font-bold flex items-center gap-2"><Plug size={20}/> Third-Party Integrations</h3>
                    
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                        <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><Mic size={18}/> Voice & AI Agent Providers</h4>
                        <p className="text-sm text-gray-500 mb-4">Configure the backend for the AI Support Agent voice capabilities.</p>
                        
                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">Voice Provider</label>
                                <select 
                                    className="w-full p-2 border rounded"
                                    value={settings.integrations.voiceProvider}
                                    onChange={e => updateIntegrationField('voiceProvider', e.target.value)}
                                >
                                    <option value="ZEGOCLOUD">ZegoCloud (Recommended)</option>
                                    <option value="AGORA">Agora.io</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">App ID</label>
                                <input 
                                    className="w-full p-2 border rounded"
                                    placeholder="123456789"
                                    value={settings.integrations.voiceAppId}
                                    onChange={e => updateIntegrationField('voiceAppId', e.target.value)}
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-xs font-bold text-gray-700 mb-1">App Sign / Certificate</label>
                                <PasswordInput 
                                    value={settings.integrations.voiceAppSign}
                                    onChange={v => updateIntegrationField('voiceAppSign', v)}
                                    placeholder="0x..."
                                />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm mt-6">
                        <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><Shield size={18}/> Identity Verification</h4>
                        <div className="max-w-md">
                            <label className="block text-xs font-bold text-gray-700 mb-1">NIN Verification API Key</label>
                            <PasswordInput 
                                value={settings.integrations.ninApiKey}
                                onChange={v => updateIntegrationField('ninApiKey', v)}
                                placeholder="sk_live_..."
                            />
                        </div>
                    </div>
                </div>
            );

        case 'security':
            return (
                <div className="space-y-6 animate-in fade-in">
                    <h3 className="text-lg font-bold flex items-center gap-2"><Shield size={20}/> Firewall & Access Control</h3>
                    
                    <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-100 mb-6">
                        <h4 className="font-bold text-indigo-900 mb-2 flex items-center gap-2"><Link size={18}/> Staff Access Security</h4>
                        <p className="text-sm text-indigo-700 mb-4">Configure security parameters for staff magic link generation.</p>
                        <div className="max-w-xs">
                            <label className="block text-xs font-bold text-indigo-800 mb-1">Magic Link Expiry (Hours)</label>
                            <input 
                                type="number" 
                                min="1"
                                className="w-full p-2 border border-indigo-200 rounded text-sm"
                                value={settings.security.magicLinkExpiryHours}
                                onChange={e => setSettings({...settings, security: {...settings.security, magicLinkExpiryHours: parseInt(e.target.value)}})}
                            />
                            <p className="text-[10px] text-indigo-600 mt-1">Default is 24 hours.</p>
                        </div>
                    </div>

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
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h4 className="font-bold text-gray-900">AI Engine</h4>
                                <p className="text-sm text-gray-600">Powers fraud detection, route optimization, and chat support.</p>
                            </div>
                            <div onClick={() => updateField('ai', 'geminiEnabled', !settings.ai.geminiEnabled)} className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors ${settings.ai.geminiEnabled ? 'bg-emerald-500' : 'bg-gray-300'}`}>
                                <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform ${settings.ai.geminiEnabled ? 'translate-x-6' : ''}`}></div>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">Provider</label>
                                <select 
                                    className="w-full p-2 border rounded"
                                    value={settings.ai.provider}
                                    onChange={e => updateField('ai', 'provider', e.target.value)}
                                >
                                    <option value="GEMINI">Google Gemini</option>
                                    <option value="OPENAI">OpenAI (GPT-4)</option>
                                    <option value="ANTHROPIC">Anthropic (Claude)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">API Key</label>
                                <PasswordInput 
                                    value={settings.ai.apiKey}
                                    onChange={v => updateField('ai', 'apiKey', v)}
                                    placeholder="sk-..."
                                />
                            </div>
                        </div>
                    </div>
                </div>
            );

        // Payments (Default)
        default:
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
                                <div onClick={() => updateField('payments', 'flutterwaveEnabled', !settings.payments.flutterwaveEnabled)} className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors ${settings.payments.flutterwaveEnabled ? 'bg-emerald-500' : 'bg-gray-300'}`}>
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

                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm md:col-span-2">
                            <div className="flex justify-between items-center mb-4">
                                <h4 className="font-bold text-gray-900">Manual Bank Transfer</h4>
                                <div onClick={() => updateField('payments', 'manualEnabled', !settings.payments.manualEnabled)} className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors ${settings.payments.manualEnabled ? 'bg-emerald-500' : 'bg-gray-300'}`}>
                                    <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform ${settings.payments.manualEnabled ? 'translate-x-6' : ''}`}></div>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <label className="block text-xs font-bold text-gray-500">Bank Account Instructions</label>
                                <textarea 
                                    className="w-full p-3 border rounded text-sm h-24"
                                    value={settings.payments.manualBankDetails}
                                    onChange={(e) => updateField('payments', 'manualBankDetails', e.target.value)}
                                    placeholder="e.g. GTBank - 0123456789 - NaijaMove Ltd"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            );
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
                    { id: 'integrations', icon: Plug, label: 'Integrations' },
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
