import { useState } from 'react';
import { useForm } from '../../hooks/useForm';
import { required, maxLength } from '../../utils/validationRules';
import Input from '../shared/Input';
import TextArea from '../shared/TextArea';
import Button from '../shared/Button';
import { useAuth } from '../../contexts/AuthContext';
import consultantService from '../../services/consultant.service';
import { useNotification } from '../../hooks/useNotification';

const SkillsStep = ({ data, onComplete, onBack, canGoBack }) => {
  const { user } = useAuth();
  const { showError, showSuccess } = useNotification();
  const [cvFile, setCvFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [parsedSkills, setParsedSkills] = useState(data?.parsed_skills || []);
  const [skillInput, setSkillInput] = useState('');

  const { values, errors, touched, handleChange, handleBlur, handleSubmit, isSubmitting, setFieldValue } = useForm(
    data || {
      bio: '',
      skills: [],
      years_of_experience: '',
      qualifications: ''
    },
    {
      bio: [maxLength(1000, 'Bio must be less than 1000 characters')],
      skills: [required('At least one skill is required')],
      years_of_experience: [required('Years of experience is required')]
    },
    async (values) => {
      await onComplete('skills', values);
    }
  );

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setCvFile(file);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      
      // Get consultant ID from user
      const consultantId = user?.consultant?.id || user?.id;
      
      const result = await consultantService.uploadCv(consultantId, formData);
      
      if (result.parsed_skills && result.parsed_skills.length > 0) {
        setParsedSkills(result.parsed_skills);
        // Merge parsed skills with existing skills
        const mergedSkills = [...new Set([...values.skills, ...result.parsed_skills])];
        setFieldValue('skills', mergedSkills);
        showSuccess('CV uploaded and parsed successfully');
      } else {
        showSuccess('CV uploaded successfully');
      }
    } catch (error) {
      showError(error.response?.data?.error || 'Failed to upload CV');
      setCvFile(null);
    } finally {
      setUploading(false);
    }
  };

  const handleAddSkill = () => {
    if (skillInput.trim() && !values.skills.includes(skillInput.trim())) {
      setFieldValue('skills', [...values.skills, skillInput.trim()]);
      setSkillInput('');
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setFieldValue('skills', values.skills.filter(skill => skill !== skillToRemove));
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddSkill();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Skills & Experience</h2>
        <p className="text-gray-600">Tell us about your professional background.</p>
      </div>

      <div className="space-y-4">
        <TextArea
          id="bio"
          label="Professional Bio"
          value={values.bio}
          onChange={(e) => handleChange('bio', e.target.value)}
          onBlur={() => handleBlur('bio')}
          error={touched.bio && errors.bio}
          placeholder="Brief description of your professional background and expertise..."
          rows={4}
          maxLength={1000}
          showCount
          helperText="A brief summary of your professional experience"
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Upload CV (Optional)
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
              aria-hidden="true"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <div className="mt-4">
              <label
                htmlFor="cv-upload"
                className="cursor-pointer inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {uploading ? 'Uploading...' : 'Choose file'}
                <input
                  id="cv-upload"
                  type="file"
                  className="sr-only"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileChange}
                  disabled={uploading}
                />
              </label>
            </div>
            <p className="mt-2 text-xs text-gray-500">PDF, DOC, or DOCX up to 10MB</p>
            {cvFile && (
              <p className="mt-2 text-sm text-green-600 font-medium">
                ✓ {cvFile.name}
              </p>
            )}
          </div>
          {parsedSkills.length > 0 && (
            <p className="mt-2 text-sm text-blue-600">
              {parsedSkills.length} skills extracted from CV
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Skills <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-2">
            <Input
              id="skill-input"
              type="text"
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="e.g., React, Python, Project Management"
              className="flex-1"
            />
            <Button
              type="button"
              onClick={handleAddSkill}
              disabled={!skillInput.trim()}
            >
              Add
            </Button>
          </div>
          {touched.skills && errors.skills && (
            <p className="mt-1 text-sm text-red-600">{errors.skills}</p>
          )}
          
          {values.skills.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {values.skills.map((skill, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                >
                  {skill}
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(skill)}
                    className="ml-2 inline-flex items-center justify-center w-4 h-4 text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <Input
          id="years_of_experience"
          label="Years of Experience"
          type="number"
          required
          value={values.years_of_experience}
          onChange={(e) => handleChange('years_of_experience', e.target.value)}
          onBlur={() => handleBlur('years_of_experience')}
          error={touched.years_of_experience && errors.years_of_experience}
          placeholder="5"
          min="0"
          max="50"
        />

        <TextArea
          id="qualifications"
          label="Qualifications"
          value={values.qualifications}
          onChange={(e) => handleChange('qualifications', e.target.value)}
          onBlur={() => handleBlur('qualifications')}
          error={touched.qualifications && errors.qualifications}
          placeholder="Degrees, certifications, and other qualifications..."
          rows={3}
          helperText="Optional: List your educational background and certifications"
        />
      </div>

      <div className="flex justify-between pt-6 border-t">
        {canGoBack ? (
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            disabled={isSubmitting || uploading}
          >
            Back
          </Button>
        ) : (
          <div />
        )}

        <Button
          type="submit"
          loading={isSubmitting}
          disabled={isSubmitting || uploading}
        >
          Continue
        </Button>
      </div>
    </form>
  );
};

export default SkillsStep;
