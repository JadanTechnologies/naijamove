
import React, { useState, useEffect } from 'react';
import { getCronJobs, toggleCronJob, runCronJob } from '../../services/mockService';
import { CronJob } from '../../types';
import { Button } from '../../components/ui/Button';
import { Clock, Play, Pause, RefreshCw, Zap, Server } from 'lucide-react';

const Automation: React.FC = () => {
    const [jobs, setJobs] = useState<CronJob[]>([]);
    const [runningId, setRunningId] = useState<string | null>(null);

    useEffect(() => {
        refresh();
        // Poll for status updates
        const interval = setInterval(refresh, 5000);
        return () => clearInterval(interval);
    }, []);

    const refresh = () => getCronJobs().then(setJobs);

    const handleToggle = async (id: string) => {
        await toggleCronJob(id);
        refresh();
    };

    const handleRunNow = async (id: string) => {
        setRunningId(id);
        await runCronJob(id);
        setRunningId(null);
        refresh();
    };

    return (
        <div className="space-y-6 animate-in fade-in">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Automation & Jobs</h1>
                    <p className="text-sm text-gray-500">Manage recurring system tasks and background processes.</p>
                </div>
                <div className="flex items-center gap-2 bg-gray-100 p-2 rounded-lg text-sm text-gray-600">
                    <Server size={16}/>
                    <span className="font-mono">Cron Daemon: Active</span>
                </div>
            </div>

            <div className="grid gap-4">
                {jobs.map(job => (
                    <div key={job.id} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-full ${job.status === 'RUNNING' ? 'bg-blue-100 text-blue-600 animate-spin' : job.enabled ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                                {job.status === 'RUNNING' ? <RefreshCw size={24}/> : <Zap size={24}/>}
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900">{job.name}</h3>
                                <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                                    <span className="flex items-center gap-1"><Clock size={14}/> {job.schedule}</span>
                                    <span>Next: {new Date(job.nextRun).toLocaleTimeString()}</span>
                                    {job.lastRun && <span>Last: {new Date(job.lastRun).toLocaleTimeString()}</span>}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            {job.status === 'RUNNING' ? (
                                <span className="text-blue-600 font-bold text-sm px-4">Running...</span>
                            ) : (
                                <>
                                    <button 
                                        onClick={() => handleToggle(job.id)}
                                        className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${job.enabled ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}
                                    >
                                        {job.enabled ? 'Disable' : 'Enable'}
                                    </button>
                                    <Button 
                                        onClick={() => handleRunNow(job.id)} 
                                        variant="outline" 
                                        disabled={!job.enabled || runningId !== null}
                                    >
                                        <Play size={16} className="mr-2"/> Run Now
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Automation;
