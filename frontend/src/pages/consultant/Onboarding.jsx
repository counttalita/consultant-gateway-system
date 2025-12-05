import React, { useState, useEffect } from 'react';
import { CheckCircle, Circle, ArrowRight, ArrowLeft, Upload, Loader2, AlertCircle } from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '../../contexts/AuthContext';
import onboardingService from '../../services/onboarding.service';
import consultantService from '../../services/consultant.service';

const steps = [
    { id: 'personal_details', title: 'Personal Details' },
    { id: 'professional_info', title: 'Professional Info' },
    { id: 'banking_details', title: 'Banking Details' },
    { id: 'legal', title: 'Legal & Compliance' },
];

export default function Onboarding() {
    const { user } = useAuth();
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        personal_details: {},
        professional_info: {},
        banking_details: {},
        legal: {}
    });
    const [cvFile, setCvFile] = useState(null);
    const [uploadProgress, setUploadProgress] = useState(0);

    useEffect(() => {
        fetchOnboardingStatus();
    }, []);

    const fetchOnboardingStatus = async () => {
        try {
            const status = await onboardingService.getStatus();
            // Determine current step based on status
            // Assuming status returns current_step or completed_steps
            // For now, we'll just start at 0 or map status.current_step to index
            if (status.current_step) {
                const index = steps.findIndex(s => s.id === status.current_step);
                if (index !== -1) setCurrentStepIndex(index);
            }
            
            // Pre-fill data if available
            if (status.consultant) {
                 setFormData(prev => ({
                     ...prev,
                     personal_details: {
                         first_name: status.consultant.user?.first_name || '',
                         last_name: status.consultant.user?.last_name || '',
                         phone_number: status.consultant.phone_number || '',
                         city: status.consultant.city || '',
                         country: status.consultant.country || ''
                     },
                     // Populate other fields if available
                 }));
            }
        } catch (err) {
            console.error("Failed to fetch onboarding status", err);
            // If 404, maybe initialize?
            // onboardingService.initialize();
        } finally {
            setInitialLoading(false);
        }
    };

    const handleInputChange = (stepId, field, value) => {
        setFormData(prev => ({
            ...prev,
            [stepId]: {
                ...prev[stepId],
                [field]: value
            }
        }));
    };

    const handleFileChange = (e) => {
        if (e.target.files[0]) {
            setCvFile(e.target.files[0]);
        }
    };

    const handleNext = async () => {
        setLoading(true);
        setError('');
        
        const currentStepId = steps[currentStepIndex].id;
        const stepData = formData[currentStepId];

        try {
            // Special handling for Professional Info (CV Upload)
            if (currentStepId === 'professional_info' && cvFile) {
                const formData = new FormData();
                formData.append('file', cvFile);
                // We need consultant ID. Assuming user object has it or we can get it.
                // For now, let's try using user.id if backend supports finding consultant by user,
                // Or we need to fetch consultant ID first.
                // Assuming user.consultant_id exists or user.id maps to it.
                // Let's assume user.consultant.id is available
                if (user?.consultant?.id) {
                     await consultantService.uploadCv(user.consultant.id, formData);
                } else {
                    // Fallback or error
                    console.warn("Consultant ID not found for CV upload");
                }
            }

            await onboardingService.completeStep(currentStepId, stepData);

            if (currentStepIndex < steps.length - 1) {
                setCurrentStepIndex(currentStepIndex + 1);
            } else {
                // Finished
                window.location.href = '/consultant'; // Redirect to dashboard
            }
        } catch (err) {
            setError(err.response?.data?.error || err.message || 'Failed to complete step');
        } finally {
            setLoading(false);
        }
    };

    const handleBack = () => {
        if (currentStepIndex > 0) {
            setCurrentStepIndex(currentStepIndex - 1);
        }
    };

    if (initialLoading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-900 mb-8">Consultant Onboarding</h1>

            {/* Progress Steps */}
            <div className="mb-8">
                <div className="flex items-center justify-between relative">
                    <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-1 bg-gray-200 -z-10" />
                    {steps.map((step, index) => (
                        <div key={step.id} className="flex flex-col items-center bg-gray-100 p-2 rounded-lg z-10">
                            <div
                                className={clsx(
                                    'w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm mb-2',
                                    index <= currentStepIndex ? 'bg-indigo-600 text-white' : 'bg-gray-300 text-gray-600'
                                )}
                            >
                                {index + 1}
                            </div>
                            <span className={clsx('text-xs font-medium', index <= currentStepIndex ? 'text-indigo-600' : 'text-gray-500')}>
                                {step.title}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Form Content */}
            <div className="bg-white shadow-lg rounded-xl p-8 border border-gray-100">
                {error && (
                    <div className="mb-4 p-4 bg-red-50 text-red-700 rounded flex items-center">
                        <AlertCircle className="w-5 h-5 mr-2" />
                        {error}
                    </div>
                )}

                {currentStepIndex === 0 && (
                    <div className="space-y-4">
                        <h2 className="text-xl font-semibold">Personal Details</h2>
                        <p className="text-gray-500">Please provide your basic contact information.</p>
                        <div className="grid grid-cols-2 gap-4">
                            <input 
                                type="text" 
                                placeholder="First Name" 
                                className="border p-2 rounded w-full"
                                value={formData.personal_details.first_name || ''}
                                onChange={(e) => handleInputChange('personal_details', 'first_name', e.target.value)}
                            />
                            <input 
                                type="text" 
                                placeholder="Last Name" 
                                className="border p-2 rounded w-full"
                                value={formData.personal_details.last_name || ''}
                                onChange={(e) => handleInputChange('personal_details', 'last_name', e.target.value)}
                            />
                            <input 
                                type="text" 
                                placeholder="Phone Number" 
                                className="border p-2 rounded w-full"
                                value={formData.personal_details.phone_number || ''}
                                onChange={(e) => handleInputChange('personal_details', 'phone_number', e.target.value)}
                            />
                            <input 
                                type="text" 
                                placeholder="City" 
                                className="border p-2 rounded w-full"
                                value={formData.personal_details.city || ''}
                                onChange={(e) => handleInputChange('personal_details', 'city', e.target.value)}
                            />
                             <input 
                                type="text" 
                                placeholder="Country" 
                                className="border p-2 rounded w-full"
                                value={formData.personal_details.country || ''}
                                onChange={(e) => handleInputChange('personal_details', 'country', e.target.value)}
                            />
                        </div>
                    </div>
                )}

                {currentStepIndex === 1 && (
                    <div className="space-y-4">
                        <h2 className="text-xl font-semibold">Professional Info</h2>
                        <p className="text-gray-500">Tell us about your skills and experience.</p>
                        <textarea 
                            placeholder="Bio" 
                            className="border p-2 rounded w-full h-32"
                            value={formData.professional_info.bio || ''}
                            onChange={(e) => handleInputChange('professional_info', 'bio', e.target.value)}
                        />
                        
                        <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Upload CV (PDF/DOCX)</label>
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center">
                                <Upload className="w-8 h-8 text-gray-400 mb-2" />
                                <input 
                                    type="file" 
                                    accept=".pdf,.doc,.docx"
                                    onChange={handleFileChange}
                                    className="block w-full text-sm text-gray-500
                                      file:mr-4 file:py-2 file:px-4
                                      file:rounded-full file:border-0
                                      file:text-sm file:font-semibold
                                      file:bg-indigo-50 file:text-indigo-700
                                      hover:file:bg-indigo-100"
                                />
                                {cvFile && <p className="mt-2 text-sm text-green-600">Selected: {cvFile.name}</p>}
                            </div>
                        </div>
                    </div>
                )}

                {currentStepIndex === 2 && (
                    <div className="space-y-4">
                        <h2 className="text-xl font-semibold">Banking Details</h2>
                        <p className="text-gray-500">Required for payments.</p>
                        <input 
                            type="text" 
                            placeholder="Bank Name" 
                            className="border p-2 rounded w-full"
                            value={formData.banking_details.bank_name || ''}
                            onChange={(e) => handleInputChange('banking_details', 'bank_name', e.target.value)}
                        />
                        <input 
                            type="text" 
                            placeholder="Account Number" 
                            className="border p-2 rounded w-full"
                            value={formData.banking_details.account_number || ''}
                            onChange={(e) => handleInputChange('banking_details', 'account_number', e.target.value)}
                        />
                         <input 
                            type="text" 
                            placeholder="Branch Code" 
                            className="border p-2 rounded w-full"
                            value={formData.banking_details.branch_code || ''}
                            onChange={(e) => handleInputChange('banking_details', 'branch_code', e.target.value)}
                        />
                         <select
                            className="border p-2 rounded w-full"
                            value={formData.banking_details.account_type || ''}
                            onChange={(e) => handleInputChange('banking_details', 'account_type', e.target.value)}
                        >
                            <option value="">Select Account Type</option>
                            <option value="checking">Checking</option>
                            <option value="savings">Savings</option>
                        </select>
                         <input 
                            type="text" 
                            placeholder="Tax Number (Optional)" 
                            className="border p-2 rounded w-full"
                            value={formData.banking_details.tax_number || ''}
                            onChange={(e) => handleInputChange('banking_details', 'tax_number', e.target.value)}
                        />
                         <input 
                            type="text" 
                            placeholder="VAT Number (Optional)" 
                            className="border p-2 rounded w-full"
                            value={formData.banking_details.vat_number || ''}
                            onChange={(e) => handleInputChange('banking_details', 'vat_number', e.target.value)}
                        />
                    </div>
                )}

                {currentStepIndex === 3 && (
                    <div className="space-y-4">
                        <h2 className="text-xl font-semibold">Legal & Compliance</h2>
                        <p className="text-gray-500">Review and sign the agreement.</p>
                        <div className="bg-gray-50 p-4 rounded border h-40 overflow-y-auto">
                            <p className="text-sm text-gray-600">
                                Consultant Agreement Terms... (Placeholder text)
                                Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                            </p>
                        </div>
                        <label className="flex items-center space-x-2">
                            <input 
                                type="checkbox" 
                                className="rounded text-indigo-600"
                                checked={formData.legal.agreed || false}
                                onChange={(e) => handleInputChange('legal', 'agreed', e.target.checked)}
                            />
                            <span className="text-sm">I agree to the terms and conditions</span>
                        </label>
                    </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex justify-between mt-8 pt-4 border-t">
                    <button
                        onClick={handleBack}
                        disabled={currentStepIndex === 0 || loading}
                        className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back
                    </button>

                    <button
                        onClick={handleNext}
                        disabled={loading}
                        className="flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-70"
                    >
                        {loading ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : null}
                        {currentStepIndex === steps.length - 1 ? 'Finish' : 'Next'}
                        {currentStepIndex !== steps.length - 1 && !loading && <ArrowRight className="w-4 h-4 ml-2" />}
                    </button>
                </div>
            </div>
        </div>
    );
}
