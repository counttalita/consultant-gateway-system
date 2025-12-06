import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../hooks/useNotification';
import consultantService from '../../services/consultant.service';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import Select from '../../components/shared/Select';
import { cn } from '../../utils/cn';

export default function Availability() {
    const { user } = useAuth();
    const { showNotification } = useNotification();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [updatingAvailability, setUpdatingAvailability] = useState(false);
    const [selectedStatus, setSelectedStatus] = useState('');

    const loadProfile = async () => {
        setLoading(true);
        try {
            const data = await consultantService.getProfile(user.consultant_id);
            setProfile(data);
            setSelectedStatus(data.availability_status || '');
        } catch {
            showNotification({
                type: 'error',
                title: 'Error',
                message: 'Failed to load availability data'
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadProfile();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleUpdateAvailability = async () => {
        if (!selectedStatus) {
            showNotification({
                type: 'error',
                title: 'Error',
                message: 'Please select an availability status'
            });
            return;
        }

        if (selectedStatus === profile?.availability_status) {
            showNotification({
                type: 'info',
                title: 'No Change',
                message: 'Availability status is already set to this value'
            });
            return;
        }

        setUpdatingAvailability(true);
        try {
            await consultantService.updateAvailability(user.consultant_id, selectedStatus);
            showNotification({
                type: 'success',
                title: 'Success',
                message: 'Availability updated and synced to Airtable'
            });
            // Reload profile to get updated data
            await loadProfile();
        } catch (error) {
            showNotification({
                type: 'error',
                title: 'Error',
                message: error.response?.data?.error || 'Failed to update availability'
            });
        } finally {
            setUpdatingAvailability(false);
        }
    };

    const getAvailabilityColor = (status) => {
        switch (status) {
            case 'available':
                return 'text-green-600 bg-green-50 border-green-200';
            case 'partially_available':
                return 'text-yellow-600 bg-yellow-50 border-yellow-200';
            case 'unavailable':
                return 'text-red-600 bg-red-50 border-red-200';
            default:
                return 'text-gray-600 bg-gray-50 border-gray-200';
        }
    };

    const getAvailabilityLabel = (status) => {
        switch (status) {
            case 'available':
                return 'Available';
            case 'partially_available':
                return 'Partially Available';
            case 'unavailable':
                return 'Unavailable';
            default:
                return 'Not Set';
        }
    };

    const getUtilizationColor = (percentage) => {
        if (percentage >= 90) return 'text-red-600';
        if (percentage >= 70) return 'text-yellow-600';
        return 'text-green-600';
    };

    const getUtilizationStatus = (percentage) => {
        if (percentage >= 90) return { level: 'critical', message: 'Critical: At or near capacity' };
        if (percentage >= 70) return { level: 'warning', message: 'Warning: Approaching capacity' };
        return { level: 'healthy', message: 'Healthy utilization level' };
    };

    const calculateTotalAllocatedHours = () => {
        if (!profile?.project_assignments || profile.project_assignments.length === 0) {
            return 0;
        }
        return profile.project_assignments.reduce((total, assignment) => {
            return total + (assignment.allocated_hours || 0);
        }, 0);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <LoadingSpinner size="lg" showLabel label="Loading availability..." />
            </div>
        );
    }

    const utilization = profile?.utilization_percentage || 0;
    const utilizationStatus = getUtilizationStatus(utilization);
    const totalAllocatedHours = calculateTotalAllocatedHours();
    const availabilityOptions = [
        { value: 'available', label: 'Available' },
        { value: 'partially_available', label: 'Partially Available' },
        { value: 'unavailable', label: 'Unavailable' }
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Availability Management</h1>
                <p className="text-gray-600 mt-1">Manage your availability status and view your current utilization</p>
            </div>

            {/* Utilization Warning Banner */}
            {utilization >= 70 && (
                <div className={cn(
                    'border rounded-lg p-4',
                    utilization >= 90 
                        ? 'bg-red-50 border-red-200' 
                        : 'bg-yellow-50 border-yellow-200'
                )}>
                    <div className="flex items-start">
                        <div className="shrink-0">
                            <svg 
                                className={cn(
                                    'h-5 w-5',
                                    utilization >= 90 ? 'text-red-400' : 'text-yellow-400'
                                )} 
                                viewBox="0 0 20 20" 
                                fill="currentColor"
                            >
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <h3 className={cn(
                                'text-sm font-medium',
                                utilization >= 90 ? 'text-red-800' : 'text-yellow-800'
                            )}>
                                {utilizationStatus.level === 'critical' ? 'High Utilization Alert' : 'Utilization Warning'}
                            </h3>
                            <p className={cn(
                                'mt-1 text-sm',
                                utilization >= 90 ? 'text-red-700' : 'text-yellow-700'
                            )}>
                                {utilizationStatus.message}. Your current utilization is {utilization}%. 
                                {utilization >= 90 && ' Consider updating your availability status to reflect your capacity.'}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Current Status Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Current Availability Status */}
                <Card>
                    <div>
                        <p className="text-sm font-medium text-gray-500">Current Status</p>
                        <div className="mt-3">
                            <span className={cn(
                                'inline-flex items-center px-4 py-2 rounded-lg text-base font-semibold border',
                                getAvailabilityColor(profile?.availability_status)
                            )}>
                                {getAvailabilityLabel(profile?.availability_status)}
                            </span>
                        </div>
                        <p className="mt-3 text-xs text-gray-500">
                            Last updated: {profile?.updated_at 
                                ? new Date(profile.updated_at).toLocaleString()
                                : 'Never'}
                        </p>
                    </div>
                </Card>

                {/* Current Utilization */}
                <Card>
                    <div>
                        <p className="text-sm font-medium text-gray-500">Current Utilization</p>
                        <p className={cn('mt-3 text-4xl font-bold', getUtilizationColor(utilization))}>
                            {utilization}%
                        </p>
                        <p className="mt-2 text-xs text-gray-600">
                            {utilizationStatus.message}
                        </p>
                    </div>
                </Card>

                {/* Total Allocated Hours */}
                <Card>
                    <div>
                        <p className="text-sm font-medium text-gray-500">Total Allocated Hours</p>
                        <p className="mt-3 text-4xl font-bold text-gray-900">
                            {totalAllocatedHours}h
                        </p>
                        <p className="mt-2 text-xs text-gray-600">
                            Across {profile?.project_assignments?.length || 0} project(s)
                        </p>
                    </div>
                </Card>
            </div>

            {/* Update Availability Status */}
            <Card title="Update Availability Status">
                <div className="space-y-4">
                    <div>
                        <p className="text-sm text-gray-600 mb-4">
                            Update your availability status to reflect your current capacity. 
                            This will be synced to Airtable and visible to resource managers.
                        </p>
                        <Select
                            label="Availability Status"
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                            options={availabilityOptions}
                            disabled={updatingAvailability}
                        />
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-blue-900 mb-2">Status Definitions</h4>
                        <ul className="space-y-2 text-sm text-blue-800">
                            <li className="flex items-start">
                                <span className="inline-block w-2 h-2 bg-green-500 rounded-full mt-1.5 mr-2 shrink-0"></span>
                                <span><strong>Available:</strong> Ready to take on new projects with full capacity</span>
                            </li>
                            <li className="flex items-start">
                                <span className="inline-block w-2 h-2 bg-yellow-500 rounded-full mt-1.5 mr-2 shrink-0"></span>
                                <span><strong>Partially Available:</strong> Can take on limited additional work</span>
                            </li>
                            <li className="flex items-start">
                                <span className="inline-block w-2 h-2 bg-red-500 rounded-full mt-1.5 mr-2 shrink-0"></span>
                                <span><strong>Unavailable:</strong> At capacity or unable to take on new work</span>
                            </li>
                        </ul>
                    </div>

                    <div className="flex justify-end">
                        <Button
                            onClick={handleUpdateAvailability}
                            loading={updatingAvailability}
                            disabled={updatingAvailability || !selectedStatus || selectedStatus === profile?.availability_status}
                        >
                            {updatingAvailability ? 'Updating...' : 'Update Availability'}
                        </Button>
                    </div>
                </div>
            </Card>

            {/* Project Assignments */}
            <Card title="Current Project Assignments">
                {profile?.project_assignments && profile.project_assignments.length > 0 ? (
                    <div className="space-y-4">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Project
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Client
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Role
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Allocated Hours
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Period
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {profile.project_assignments.map((assignment) => (
                                        <tr key={assignment.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {assignment.project_name}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-600">
                                                    {assignment.client_name}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-600">
                                                    {assignment.role || 'Not specified'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-semibold text-gray-900">
                                                    {assignment.allocated_hours}h
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-600">
                                                    {assignment.start_date 
                                                        ? new Date(assignment.start_date).toLocaleDateString()
                                                        : 'Not set'} - 
                                                    {assignment.end_date 
                                                        ? new Date(assignment.end_date).toLocaleDateString()
                                                        : ' Ongoing'}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Summary */}
                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-gray-700">Total Allocated Hours:</span>
                                <span className="text-lg font-bold text-gray-900">{totalAllocatedHours}h</span>
                            </div>
                            <div className="flex justify-between items-center mt-2">
                                <span className="text-sm font-medium text-gray-700">Current Utilization:</span>
                                <span className={cn('text-lg font-bold', getUtilizationColor(utilization))}>
                                    {utilization}%
                                </span>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <svg
                            className="mx-auto h-12 w-12 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                        </svg>
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No active project assignments</h3>
                        <p className="mt-1 text-sm text-gray-500">
                            You currently have no projects assigned. Your utilization is 0%.
                        </p>
                    </div>
                )}
            </Card>

            {/* Utilization Thresholds Info */}
            <Card title="Utilization Thresholds">
                <div className="space-y-3">
                    <div className="flex items-start">
                        <div className="shrink-0">
                            <div className="h-3 w-3 bg-green-500 rounded-full mt-1"></div>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900">Healthy (0-69%)</p>
                            <p className="text-sm text-gray-600">
                                Good capacity available for new projects
                            </p>
                        </div>
                    </div>
                    <div className="flex items-start">
                        <div className="shrink-0">
                            <div className="h-3 w-3 bg-yellow-500 rounded-full mt-1"></div>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900">Warning (70-89%)</p>
                            <p className="text-sm text-gray-600">
                                Approaching capacity - limited availability for new work
                            </p>
                        </div>
                    </div>
                    <div className="flex items-start">
                        <div className="shrink-0">
                            <div className="h-3 w-3 bg-red-500 rounded-full mt-1"></div>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900">Critical (90-100%)</p>
                            <p className="text-sm text-gray-600">
                                At or near capacity - should not take on additional work
                            </p>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
}
