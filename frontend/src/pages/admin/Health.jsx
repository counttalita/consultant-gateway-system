import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { CheckCircle, XCircle, Clock } from 'lucide-react';

export default function Health() {
    const [health, setHealth] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchHealth();
    }, []);

    const fetchHealth = async () => {
        try {
            const response = await api.get('/up');
            // The Rails health check usually returns 200 OK with HTML or simple text
            // We'll simulate a structured response for now or just check status
            setHealth({ status: 'ok', timestamp: new Date().toISOString() });
        } catch (error) {
            setHealth({ status: 'error', error: error.message });
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">System Health</h1>

            <div className="bg-white shadow-sm rounded-xl border border-gray-100 p-6">
                <div className="flex items-center space-x-4">
                    {health?.status === 'ok' ? (
                        <CheckCircle className="h-12 w-12 text-green-500" />
                    ) : (
                        <XCircle className="h-12 w-12 text-red-500" />
                    )}
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900">
                            System is {health?.status === 'ok' ? 'Operational' : 'Down'}
                        </h2>
                        <p className="text-gray-500 flex items-center mt-1">
                            <Clock className="h-4 w-4 mr-1" />
                            Last checked: {new Date().toLocaleTimeString()}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
