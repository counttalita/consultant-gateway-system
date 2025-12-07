import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../hooks/useNotification';
import consultantService from '../../services/consultant.service';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';
import SkeletonLoader from '../../components/shared/SkeletonLoader';
import { cn } from '../../utils/cn';

export default function ConsultantDashboard() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { showNotification } = useNotification();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [updatingAvailability, setUpdatingAvailability] = useState(false);

    const loadProfile = async () => {
        try {
            const data = await consultantService.getProfile(user.consultant_id);
            setProfile(data);
        } catch {
            showNotification({
                type: 'error',
                title: 'Error',
                message: 'Failed to load profile data'
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadProfile();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleUpdateAvailability = async (newStatus) => {
        setUpdatingAvailability(true);
        try {
            await consultantService.updateAvailability(user.consultant_id, newStatus);
            showNotification({
                type: 'success',
                title: 'Success',
                message: 'Availability updated successfully'
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

    const calculateProfileCompletion = () => {
        if (!profile) return 0;
        
        const fields = [
            profile.bio,
            profile.skills && profile.skills.length > 0,
            profile.banking_details?.bank_name,
            profile.banking_details?.account_number,
            profile.tax_number,
            profile.phone
        ];
        
        const completedFields = fields.filter(Boolean).length;
        return Math.round((completedFields / fields.length) * 100);
    };

    const getAvailabilityColor = (status) => {
        switch (status) {
            case 'available':
                return 'text-green-600 bg-green-50';
            case 'partially_available':
                return 'text-yellow-600 bg-yellow-50';
            case 'unavailable':
                return 'text-red-600 bg-red-50';
            default:
                return 'text-gray-600 bg-gray-50';
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

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-gray-900">Consultant Dashboard</h1>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <SkeletonLoader type="metric" />
                    <SkeletonLoader type="metric" />
                    <SkeletonLoader type="metric" />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <SkeletonLoader type="card" className="h-64" />
                    <SkeletonLoader type="card" className="h-64" />
                </div>
            </div>
        );
    }

    const profileCompletion = calculateProfileCompletion();
    const utilization = profile?.utilization_percentage || 0;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                    <p className="text-gray-600 mt-1">Welcome back, {user?.email}</p>
                </div>
            </div>

            {/* Profile Completion Alert */}
            {profileCompletion < 100 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-start">
                        <div className="shrink-0">
                            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3 flex-1">
                            <h3 className="text-sm font-medium text-yellow-800">
                                Complete your profile
                            </h3>
                            <p className="mt-1 text-sm text-yellow-700">
                                Your profile is {profileCompletion}% complete. Complete your profile to be visible in the talent pool.
                            </p>
                            <div className="mt-2">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => navigate('/consultant/profile')}
                                >
                                    Complete Profile
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Profile Completion Card */}
                <Card>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Profile Completion</p>
                            <p className="mt-2 text-3xl font-bold text-gray-900">{profileCompletion}%</p>
                        </div>
                        <div className="h-16 w-16">
                            <svg className="transform -rotate-90" viewBox="0 0 36 36">
                                <path
                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                    fill="none"
                                    stroke="#E5E7EB"
                                    strokeWidth="3"
                                />
                                <path
                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                    fill="none"
                                    stroke="#3B82F6"
                                    strokeWidth="3"
                                    strokeDasharray={`${profileCompletion}, 100`}
                                />
                            </svg>
                        </div>
                    </div>
                </Card>

                {/* Availability Card */}
                <Card>
                    <div>
                        <p className="text-sm font-medium text-gray-500">Current Availability</p>
                        <div className="mt-2 flex items-center">
                            <span className={cn(
                                'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium',
                                getAvailabilityColor(profile?.availability_status)
                            )}>
                                {getAvailabilityLabel(profile?.availability_status)}
                            </span>
                        </div>
                        <div className="mt-4 flex gap-2">
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleUpdateAvailability('available')}
                                disabled={updatingAvailability || profile?.availability_status === 'available'}
                            >
                                Available
                            </Button>
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleUpdateAvailability('partially_available')}
                                disabled={updatingAvailability || profile?.availability_status === 'partially_available'}
                            >
                                Partial
                            </Button>
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleUpdateAvailability('unavailable')}
                                disabled={updatingAvailability || profile?.availability_status === 'unavailable'}
                            >
                                Unavailable
                            </Button>
                        </div>
                    </div>
                </Card>

                {/* Utilization Card */}
                <Card>
                    <div>
                        <p className="text-sm font-medium text-gray-500">Current Utilization</p>
                        <p className={cn('mt-2 text-3xl font-bold', getUtilizationColor(utilization))}>
                            {utilization}%
                        </p>
                        {utilization >= 90 && (
                            <p className="mt-2 text-sm text-red-600">
                                ⚠️ High utilization
                            </p>
                        )}
                        {utilization >= 70 && utilization < 90 && (
                            <p className="mt-2 text-sm text-yellow-600">
                                ⚠️ Approaching capacity
                            </p>
                        )}
                    </div>
                </Card>
            </div>

            {/* Profile Summary */}
            <Card title="Profile Summary">
                <div className="space-y-4">
                    <div>
                        <h4 className="text-sm font-medium text-gray-700">Bio</h4>
                        <p className="mt-1 text-sm text-gray-600">
                            {profile?.bio || 'No bio added yet'}
                        </p>
                    </div>
                    
                    <div>
                        <h4 className="text-sm font-medium text-gray-700">Skills</h4>
                        <div className="mt-2 flex flex-wrap gap-2">
                            {profile?.skills && profile.skills.length > 0 ? (
                                profile.skills.map((skill, index) => (
                                    <span
                                        key={index}
                                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                                    >
                                        {skill}
                                    </span>
                                ))
                            ) : (
                                <p className="text-sm text-gray-500">No skills added yet</p>
                            )}
                        </div>
                    </div>

                    <div>
                        <h4 className="text-sm font-medium text-gray-700">Contact</h4>
                        <p className="mt-1 text-sm text-gray-600">
                            {profile?.phone || 'No phone number added'}
                        </p>
                    </div>
                </div>
            </Card>

            {/* Assigned Projects */}
            <Card title="Assigned Projects">
                {profile?.project_assignments && profile.project_assignments.length > 0 ? (
                    <div className="space-y-4">
                        {profile.project_assignments.map((assignment) => (
                            <div
                                key={assignment.id}
                                className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
                            >
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <h4 className="text-lg font-semibold text-gray-900">
                                            {assignment.project_name}
                                        </h4>
                                        <p className="text-sm text-gray-600 mt-1">
                                            Client: {assignment.client_name}
                                        </p>
                                        {assignment.role && (
                                            <p className="text-sm text-gray-600">
                                                Role: {assignment.role}
                                            </p>
                                        )}
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-medium text-gray-900">
                                            {assignment.allocated_hours}h allocated
                                        </p>
                                        {assignment.start_date && (
                                            <p className="text-xs text-gray-500 mt-1">
                                                {new Date(assignment.start_date).toLocaleDateString()} - 
                                                {assignment.end_date 
                                                    ? new Date(assignment.end_date).toLocaleDateString()
                                                    : 'Ongoing'}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8">
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
                        <p className="mt-2 text-sm text-gray-500">No active project assignments</p>
                    </div>
                )}
            </Card>

            {/* Quick Actions */}
            <Card title="Quick Actions">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button
                        variant="outline"
                        onClick={() => navigate('/consultant/profile')}
                        className="justify-start"
                    >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Edit Profile
                    </Button>
                    
                    {profile?.onboarding_status !== 'completed' && (
                        <Button
                            variant="outline"
                            onClick={() => navigate('/consultant/onboarding')}
                            className="justify-start"
                        >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Complete Onboarding
                        </Button>
                    )}
                </div>
            </Card>

            {/* Onboarding Status */}
            {profile?.onboarding_status !== 'completed' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start">
                        <div className="shrink-0">
                            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-blue-800">
                                Onboarding in progress
                            </h3>
                            <p className="mt-1 text-sm text-blue-700">
                                Complete your onboarding to access all features and be added to the talent pool.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
