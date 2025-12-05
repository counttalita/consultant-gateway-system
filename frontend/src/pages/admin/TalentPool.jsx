import React, { useState, useEffect } from 'react';
import { Search, Filter, User, MapPin, Briefcase, Star, Loader2 } from 'lucide-react';
import consultantService from '../../services/consultant.service';

export default function TalentPool() {
    const [consultants, setConsultants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [availabilityFilter, setAvailabilityFilter] = useState('all');

    useEffect(() => {
        fetchTalentPool();
    }, []);

    const fetchTalentPool = async () => {
        try {
            const data = await consultantService.getTalentPool();
            setConsultants(data);
        } catch (err) {
            setError('Failed to fetch talent pool');
        } finally {
            setLoading(false);
        }
    };

    const filteredConsultants = consultants.filter(c => {
        const matchesSearch = (c.consultant.user.first_name + ' ' + c.consultant.user.last_name).toLowerCase().includes(searchTerm.toLowerCase()) ||
                              (c.consultant.bio || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesAvailability = availabilityFilter === 'all' || c.availability_status === availabilityFilter;
        return matchesSearch && matchesAvailability;
    });

    if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="max-w-6xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Talent Pool</h1>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search consultants by name or skill..."
                        className="pl-10 block w-full sm:text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 py-2"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center space-x-4">
                    <div className="flex items-center">
                        <Filter className="h-5 w-5 text-gray-400 mr-2" />
                        <select
                            value={availabilityFilter}
                            onChange={(e) => setAvailabilityFilter(e.target.value)}
                            className="block w-full sm:text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                        >
                            <option value="all">All Availability</option>
                            <option value="available">Available</option>
                            <option value="partially_available">Partially Available</option>
                            <option value="unavailable">Unavailable</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredConsultants.map((item) => (
                    <div key={item.consultant.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                        <div className="p-6">
                            <div className="flex items-center mb-4">
                                <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-lg">
                                    {item.consultant.user.first_name[0]}{item.consultant.user.last_name[0]}
                                </div>
                                <div className="ml-4">
                                    <h3 className="text-lg font-bold text-gray-900">{item.consultant.user.first_name} {item.consultant.user.last_name}</h3>
                                    <div className="flex items-center text-sm text-gray-500">
                                        <MapPin className="w-3 h-3 mr-1" />
                                        {item.consultant.city || 'Remote'}
                                    </div>
                                </div>
                            </div>
                            
                            <div className="mb-4">
                                <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    item.availability_status === 'available' ? 'bg-green-100 text-green-800' :
                                    item.availability_status === 'unavailable' ? 'bg-red-100 text-red-800' :
                                    'bg-yellow-100 text-yellow-800'
                                }`}>
                                    {item.availability_status.replace('_', ' ')}
                                </div>
                                <span className="ml-2 text-xs text-gray-500">
                                    {item.utilization_percentage}% Utilized
                                </span>
                            </div>

                            <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                                {item.consultant.bio || 'No bio available'}
                            </p>

                            <div className="flex flex-wrap gap-2 mb-4">
                                {(item.skills || []).slice(0, 3).map((skill, i) => (
                                    <span key={i} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                        {skill}
                                    </span>
                                ))}
                                {(item.skills || []).length > 3 && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                        +{item.skills.length - 3} more
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="bg-gray-50 px-6 py-3 flex justify-between items-center">
                            <div className="text-xs text-gray-500">
                                {item.active_projects} Active Projects
                            </div>
                            <button className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                                View Profile
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
