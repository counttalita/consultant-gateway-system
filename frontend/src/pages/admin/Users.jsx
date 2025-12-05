import React, { useState, useEffect } from 'react';
import { User, Shield, Edit2, Check, X, Loader2 } from 'lucide-react';
import adminService from '../../services/admin.service';

export default function Users() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [editingUserId, setEditingUserId] = useState(null);
    const [selectedRoles, setSelectedRoles] = useState([]);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const data = await adminService.getUsers();
            setUsers(data);
        } catch (err) {
            setError('Failed to fetch users');
        } finally {
            setLoading(false);
        }
    };

    const handleEditClick = (user) => {
        setEditingUserId(user.id);
        setSelectedRoles(user.roles || []);
    };

    const handleCancelEdit = () => {
        setEditingUserId(null);
        setSelectedRoles([]);
    };

    const handleSaveRoles = async (userId) => {
        try {
            await adminService.updateUserRoles(userId, selectedRoles);
            setUsers(users.map(u => u.id === userId ? { ...u, roles: selectedRoles } : u));
            setEditingUserId(null);
        } catch (err) {
            setError('Failed to update roles');
        }
    };

    const toggleRole = (role) => {
        if (selectedRoles.includes(role)) {
            setSelectedRoles(selectedRoles.filter(r => r !== role));
        } else {
            setSelectedRoles([...selectedRoles, role]);
        }
    };

    if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="max-w-6xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">User Management</h1>

            {error && (
                <div className="mb-4 p-4 bg-red-50 text-red-700 rounded">
                    {error}
                </div>
            )}

            <div className="bg-white shadow-lg rounded-xl overflow-hidden border border-gray-100">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Roles</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {users.map((user) => (
                                <tr key={user.id}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                                                <User className="h-5 w-5 text-indigo-600" />
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {user.first_name} {user.last_name}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">{user.email}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {editingUserId === user.id ? (
                                            <div className="flex space-x-2">
                                                {['admin', 'consultant', 'finance'].map(role => (
                                                    <label key={role} className="inline-flex items-center">
                                                        <input
                                                            type="checkbox"
                                                            className="form-checkbox h-4 w-4 text-indigo-600"
                                                            checked={selectedRoles.includes(role)}
                                                            onChange={() => toggleRole(role)}
                                                        />
                                                        <span className="ml-1 text-xs text-gray-700 capitalize">{role}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="flex space-x-1">
                                                {(user.roles || []).map((role, index) => (
                                                    <span key={index} className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 capitalize">
                                                        {role}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {editingUserId === user.id ? (
                                            <div className="flex space-x-2">
                                                <button onClick={() => handleSaveRoles(user.id)} className="text-green-600 hover:text-green-900">
                                                    <Check className="h-5 w-5" />
                                                </button>
                                                <button onClick={handleCancelEdit} className="text-red-600 hover:text-red-900">
                                                    <X className="h-5 w-5" />
                                                </button>
                                            </div>
                                        ) : (
                                            <button onClick={() => handleEditClick(user)} className="text-indigo-600 hover:text-indigo-900">
                                                <Edit2 className="h-5 w-5" />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
