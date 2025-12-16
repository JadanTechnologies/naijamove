import React, { useEffect, useState } from 'react';
import { getSystemSettings, updateSystemSettings, getTemplates, saveTemplate, deleteTemplate, getAnnouncements, createAnnouncement } from '../../services/mockService';
import { SystemSettings, TrackerConfig, NotificationTemplate, Announcement } from '../../types';
import { Button } from '../../components/ui/Button';
import { Shield, CreditCard, Bell, Sparkles, Smartphone, Globe, Lock, Activity, Radio, Router, Plus, Trash2, FileText, Megaphone, Edit, Send, Eye, EyeOff } from 'lucide-react';

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
    )
}

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

  // --- Tracker Handlers ---
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

  // --- Template Handlers ---
  const handleSaveTemplate = async () => {
      if(!editingTemplate) return;
      await saveTemplate(editingTemplate);
      setTemplates(await getTemplates());
      setEditingTemplate(null);
      setIsTemplateModalOpen(false);
  };

  const handleDeleteTemplate = async (id: string) => {
      if(confirm('Delete this template?')) {
          await deleteTemplate(id);
          setTemplates(await getTemplates());
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

  // --- Announcement Handlers ---
  const handleSendAnnouncement = async () => {
      if(!newAnnouncement.title || !newAnnouncement.message) return;
      await createAnnouncement(newAnnouncement);
      setAnnouncements(await getAnnouncements());
      setNewAnnouncement({ title: '', message: '', target: 'ALL' });
  };


  if (!settings) return <div>Loading settings...</div>;

  const renderTabContent = () => {
    switch(activeTab) {
        case 'branding':
            return (
                <div className="space-y-6 animate-in fade-in">
                    <h3 className="text-lg font-bold">App Branding</h3>
                    <div className="grid gap-4 max-w-xl">
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
                    </div>
                </div>
            );
        case 'payments':
            return (
                <div className="space-y-6 animate-in fade-in">
                    <h3 className="text-lg font-bold">Payment Gateways</h3>
                    <div className="space-y-6">
                        <div className="border rounded-lg bg-gray-50 overflow-hidden">
                            <label className="flex items-center space-x-3 p-4 border-b">
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
                            {settings.payments.paystackEnabled && (
                                <div className="p-4 bg-white space-y-2">
                                    <label className="text-xs font-bold text-gray-700">Secret Key (Live/Test)</label>
                                    <PasswordInput 
                                        value={settings.payments.paystackSecretKey}
                                        onChange={(val) => updateField('payments', 'paystackSecretKey', val)}
                                        placeholder="sk_live_..."
                                    />
                                </div>
                            )}
                        </div>

                        <div className="border rounded-lg bg-gray-50 overflow-hidden">
                            <label className="flex items-center space-x-3 p-4 border-b">
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
                            {settings.payments.flutterwaveEnabled && (
                                <div className="p-4 bg-white space-y-2">
                                    <label className="text-xs font-bold text-gray-700">Secret Key</label>
                                    <PasswordInput 
                                        value={settings.payments.flutterwaveSecretKey}
                                        onChange={(val) => updateField('payments', 'flutterwaveSecretKey', val)}
                                        placeholder="FLWSECK_..."
                                    />
                                </div>
                            )}
                        </div>
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
                     <div className="grid gap-6 max-w-2xl">
                         <div>
                             <label className="block text-sm font-bold mb-2">SMS Provider (OTP)</label>
                             <div className="flex gap-2">
                                <select 
                                    value={settings.communication.smsProvider} 
                                    className="w-1/3 p-2 border rounded bg-gray-50"
                                    onChange={(e) => updateField('communication', 'smsProvider', e.target.value)}
                                >
                                    <option value="TWILIO">Twilio</option>
                                    <option value="INFOBIP">Infobip</option>
                                    <option value="TERMII">Termii (Nigeria)</option>
                                </select>
                                <PasswordInput 
                                    value={settings.communication.smsApiKey}
                                    onChange={(val) => updateField('communication', 'smsApiKey', val)}
                                    placeholder="API Key / Auth Token"
                                />
                             </div>
                         </div>
                         <div>
                             <label className="block text-sm font-bold mb-2">Push Notifications</label>
                             <div className="flex gap-2">
                                <select 
                                    value={settings.communication.pushProvider}
                                    className="w-1/3 p-2 border rounded bg-gray-50"
                                    onChange={(e) => updateField('communication', 'pushProvider', e.target.value)}
                                >
                                    <option value="ONESIGNAL">OneSignal</option>
                                    <option value="FIREBASE">Firebase Cloud Messaging</option>
                                </select>
                                <PasswordInput 
                                    value={settings.communication.pushApiKey}
                                    onChange={(val) => updateField('communication', 'pushApiKey', val)}
                                    placeholder="Rest API Key"
                                />
                             </div>
                         </div>
                         <div>
                             <label className="block text-sm font-bold mb-2">Email Service</label>
                             <div className="flex gap-2">
                                <select 
                                    value={settings.communication.emailProvider}
                                    className="w-1/3 p-2 border rounded bg-gray-50"
                                    onChange={(e) => updateField('communication', 'emailProvider', e.target.value)}
                                >
                                    <option value="RESEND">Resend</option>
                                    <option value="SMTP">Custom SMTP</option>
                                </select>
                                <PasswordInput 
                                    value={settings.communication.emailApiKey}
                                    onChange={(val) => updateField('communication', 'emailApiKey', val)}
                                    placeholder="API Key"
                                />
                             </div>
                         </div>
                     </div>
                </div>
            );
        case 'templates':
            return (
                <div className="space-y-6 animate-in fade-in">
                    <div className="flex justify-between items-center">
                        <div>
                            <h3 className="text-lg font-bold">Message Templates</h3>
                            <p className="text-sm text-gray-500">Manage Email, SMS, and Push content.</p>
                        </div>
                        <Button size="sm" onClick={openNewTemplate}>
                            <Plus size={16} className="mr-2"/> New Template
                        </Button>
                    </div>

                    {isTemplateModalOpen && editingTemplate && (
                        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95">
                                <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                                    <h4 className="font-bold">{editingTemplate.id ? 'Edit Template' : 'New Template'}</h4>
                                    <button onClick={() => setIsTemplateModalOpen(false)}><Trash2 size={20} className="text-gray-400 hover:text-red-500" /></button>
                                </div>
                                <div className="p-6 space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 mb-1">Template Name</label>
                                        <input 
                                            className="w-full p-2 border rounded text-sm"
                                            value={editingTemplate.name}
                                            onChange={e => setEditingTemplate({...editingTemplate, name: e.target.value})}
                                            placeholder="e.g. Welcome Email"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 mb-1">Type</label>
                                            <select 
                                                className="w-full p-2 border rounded text-sm bg-white"
                                                value={editingTemplate.type}
                                                onChange={e => setEditingTemplate({...editingTemplate, type: e.target.value as any})}
                                            >
                                                <option value="EMAIL">Email</option>
                                                <option value="SMS">SMS</option>
                                                <option value="PUSH">Push</option>
                                            </select>
                                        </div>
                                    </div>
                                    {editingTemplate.type === 'EMAIL' && (
                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 mb-1">Subject</label>
                                            <input 
                                                className="w-full p-2 border rounded text-sm"
                                                value={editingTemplate.subject}
                                                onChange={e => setEditingTemplate({...editingTemplate, subject: e.target.value})}
                                                placeholder="Email Subject"
                                            />
                                        </div>
                                    )}
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 mb-1">Content Body</label>
                                        <textarea 
                                            className="w-full p-2 border rounded text-sm h-32"
                                            value={editingTemplate.body}
                                            onChange={e => setEditingTemplate({...editingTemplate, body: e.target.value})}
                                            placeholder="Type your message here..."
                                        />
                                        <p className="text-[10px] text-gray-500 mt-1">Available variables: {'{{name}}, {{otp}}, {{driver_name}}'}</p>
                                    </div>
                                </div>
                                <div className="p-4 bg-gray-50 text-right flex justify-end gap-2">
                                    <Button size="sm" variant="outline" onClick={() => setIsTemplateModalOpen(false)}>Cancel</Button>
                                    <Button size="sm" onClick={handleSaveTemplate}>Save Template</Button>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="grid gap-4 md:grid-cols-2">
                        {templates.map(tpl => (
                            <div key={tpl.id} className="p-4 bg-white border rounded-xl hover:shadow-md transition-shadow relative group">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2">
                                        <span className={`px-2 py-1 rounded text-[10px] font-bold ${
                                            tpl.type === 'EMAIL' ? 'bg-blue-100 text-blue-800' :
                                            tpl.type === 'SMS' ? 'bg-orange-100 text-orange-800' :
                                            'bg-purple-100 text-purple-800'
                                        }`}>{tpl.type}</span>
                                        <h4 className="font-bold text-sm">{tpl.name}</h4>
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button 
                                            onClick={() => { setEditingTemplate(tpl); setIsTemplateModalOpen(true); }}
                                            className="p-1.5 hover:bg-gray-100 rounded text-blue-600"
                                        >
                                            <Edit size={16} />
                                        </button>
                                        <button 
                                            onClick={() => handleDeleteTemplate(tpl.id)}
                                            className="p-1.5 hover:bg-red-50 rounded text-red-600"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                                {tpl.subject && <p className="text-xs font-semibold text-gray-700 mb-1 truncate">{tpl.subject}</p>}
                                <p className="text-xs text-gray-500 line-clamp-3 whitespace-pre-line">{tpl.body}</p>
                            </div>
                        ))}
                    </div>
                </div>
            );
        case 'announcements':
             return (
                <div className="space-y-6 animate-in fade-in">
                    <div className="flex flex-col md:flex-row gap-6">
                        {/* Create Announcement */}
                        <div className="md:w-1/3 space-y-4">
                            <h3 className="text-lg font-bold">Broadcast Message</h3>
                            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 mb-1">Title</label>
                                        <input 
                                            className="w-full p-2 border rounded text-sm"
                                            value={newAnnouncement.title}
                                            onChange={e => setNewAnnouncement({...newAnnouncement, title: e.target.value})}
                                            placeholder="Announcement Headline"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 mb-1">Target Audience</label>
                                        <div className="flex gap-2">
                                            {['ALL', 'DRIVERS', 'PASSENGERS'].map(target => (
                                                <button 
                                                    key={target}
                                                    onClick={() => setNewAnnouncement({...newAnnouncement, target: target as any})}
                                                    className={`flex-1 py-1.5 text-xs font-medium rounded border ${
                                                        newAnnouncement.target === target 
                                                        ? 'bg-emerald-600 text-white border-emerald-600' 
                                                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                                                    }`}
                                                >
                                                    {target}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 mb-1">Message</label>
                                        <textarea 
                                            className="w-full p-2 border rounded text-sm h-32"
                                            value={newAnnouncement.message}
                                            onChange={e => setNewAnnouncement({...newAnnouncement, message: e.target.value})}
                                            placeholder="Write your announcement here..."
                                        />
                                    </div>
                                    <Button className="w-full" onClick={handleSendAnnouncement}>
                                        <Send size={16} className="mr-2" /> Send Broadcast
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* History */}
                        <div className="flex-1 space-y-4">
                            <h3 className="text-lg font-bold">History</h3>
                            <div className="space-y-4">
                                {announcements.map(ann => (
                                    <div key={ann.id} className="bg-white p-4 rounded-xl border border-gray-200">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h4 className="font-bold text-gray-900">{ann.title}</h4>
                                                <p className="text-xs text-gray-500 mt-0.5">
                                                    Sent to <span className="font-semibold">{ann.target}</span> • {new Date(ann.sentAt!).toLocaleString()}
                                                </p>
                                            </div>
                                            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-1 rounded">SENT</span>
                                        </div>
                                        <div className="mt-3 text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                                            {ann.message}
                                        </div>
                                    </div>
                                ))}
                                {announcements.length === 0 && (
                                    <div className="text-center py-10 text-gray-500 text-sm">No announcements sent yet.</div>
                                )}
                            </div>
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
    { id: 'templates', icon: FileText, label: 'Templates' },
    { id: 'announcements', icon: Megaphone, label: 'Announcements' },
    { id: 'ai', icon: Sparkles, label: 'AI & Fraud' },
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