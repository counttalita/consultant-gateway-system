import { useState, useEffect } from 'react';
import { User, Briefcase, CreditCard, Upload as UploadIcon } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../hooks/useNotification';
import consultantService from '../../services/consultant.service';
import Tabs from '../../components/shared/Tabs';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import ProfileForm from '../../components/forms/ProfileForm';
import BankingDetailsForm from '../../components/forms/BankingDetailsForm';
import CvUpload from '../../components/consultant/CvUpload';
import SkillsReview from '../../components/consultant/SkillsReview';

export default function ConsultantProfile() {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [parsedCvData, setParsedCvData] = useState(null);
  const [showSkillsReview, setShowSkillsReview] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const data = await consultantService.getProfile(user.consultant_id || user.id);
      setProfile(data);
    } catch (error) {
      showError('Failed to load profile');
      console.error('Failed to fetch profile', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSave = async (profileData) => {
    try {
      const updatedProfile = await consultantService.updateProfile(
        user.consultant_id || user.id,
        profileData
      );
      setProfile(updatedProfile);
      showSuccess('Profile updated successfully!');
      return updatedProfile;
    } catch (error) {
      showError(error.response?.data?.error || 'Failed to update profile');
      throw error;
    }
  };

  const handleBankingSave = async (bankingData) => {
    try {
      const updatedProfile = await consultantService.updateProfile(
        user.consultant_id || user.id,
        { banking_details: bankingData }
      );
      setProfile(updatedProfile);
      showSuccess('Banking details updated successfully!');
      return updatedProfile;
    } catch (error) {
      showError(error.response?.data?.error || 'Failed to update banking details');
      throw error;
    }
  };

  const handleCvParsed = (data) => {
    setParsedCvData(data);
    setShowSkillsReview(true);
  };

  const handleSkillsConfirm = async (confirmedData) => {
    try {
      // Update profile with confirmed skills and experience
      const updatedProfile = await consultantService.updateProfile(
        user.consultant_id || user.id,
        {
          skills: confirmedData.skills,
          experience: confirmedData.experience,
          qualifications: confirmedData.qualifications
        }
      );
      setProfile(updatedProfile);
      setShowSkillsReview(false);
      setParsedCvData(null);
      showSuccess('Skills and experience updated from CV!');
    } catch (error) {
      showError('Failed to update profile with CV data');
      console.error('Failed to update profile', error);
    }
  };

  const handleSkillsCancel = () => {
    setShowSkillsReview(false);
    setParsedCvData(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" showLabel label="Loading profile..." />
      </div>
    );
  }

  const tabs = [
    {
      label: 'Profile',
      icon: <User className="h-4 w-4" />,
      content: (
        <ProfileForm
          profile={profile}
          onSave={handleProfileSave}
        />
      )
    },
    {
      label: 'Banking',
      icon: <CreditCard className="h-4 w-4" />,
      content: (
        <BankingDetailsForm
          bankingDetails={profile?.banking_details}
          onSave={handleBankingSave}
        />
      )
    },
    {
      label: 'CV Upload',
      icon: <UploadIcon className="h-4 w-4" />,
      content: (
        <div className="space-y-6">
          <CvUpload
            consultantId={user.consultant_id || user.id}
            onUploadSuccess={fetchProfile}
            onParsed={handleCvParsed}
          />
          {showSkillsReview && parsedCvData && (
            <SkillsReview
              parsedData={parsedCvData}
              onConfirm={handleSkillsConfirm}
              onCancel={handleSkillsCancel}
            />
          )}
        </div>
      )
    }
  ];

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
        <p className="mt-2 text-sm text-gray-600">
          Manage your professional information, banking details, and upload your CV
        </p>
      </div>

      <Tabs tabs={tabs} defaultTab={0} />
    </div>
  );
}
