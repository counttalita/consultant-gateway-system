import { useForm } from '../../hooks/useForm';
import { required, maxLength, saPhoneNumber } from '../../utils/validationRules';
import FormField from '../shared/FormField';
import Button from '../shared/Button';
import Card from '../shared/Card';
import { useNotification } from '../../hooks/useNotification';

/**
 * Profile Form Component
 * Real-world example of using the validation system for consultant profile updates
 */
const ProfileForm = ({ profile, onSave }) => {
  const { showSuccess, showError } = useNotification();

  // Initial values from profile data
  const initialValues = {
    full_name: profile?.full_name || '',
    phone: profile?.phone || '',
    bio: profile?.bio || '',
    skills: profile?.skills?.join(', ') || '',
    linkedin_url: profile?.linkedin_url || '',
  };

  // Validation rules
  const validationRules = {
    full_name: required('Full name is required'),
    phone: [
      required('Phone number is required'),
      saPhoneNumber('Please enter a valid South African phone number'),
    ],
    bio: maxLength(1000, 'Bio must be less than 1000 characters'),
    skills: required('Please enter at least one skill'),
    linkedin_url: (value) => {
      if (!value) return null;
      const linkedinRegex = /^https?:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9-]+\/?$/;
      if (!linkedinRegex.test(value)) {
        return 'Please enter a valid LinkedIn profile URL';
      }
      return null;
    },
  };

  // Initialize form first
  const form = useForm(initialValues, validationRules);

  // Handle form submission
  const handleSubmit = async (values) => {
    try {
      // Convert skills string to array
      const formattedValues = {
        ...values,
        skills: values.skills.split(',').map(s => s.trim()).filter(Boolean),
      };

      await onSave(formattedValues);
      showSuccess('Profile updated successfully!');
    } catch (error) {
      showError(error.message || 'Failed to update profile');
      
      // Handle API validation errors
      if (error.response?.data?.errors) {
        form.setFieldErrors(error.response.data.errors);
      }
      
      throw error;
    }
  };

  return (
    <Card title="Edit Profile" subtitle="Update your professional information">
      <form onSubmit={(e) => { e.preventDefault(); handleSubmit(form.values); }} className="space-y-6">
        {/* Full Name */}
        <FormField
          name="full_name"
          label="Full Name"
          type="text"
          form={form}
          required
          placeholder="John Doe"
        />

        {/* Phone */}
        <FormField
          name="phone"
          label="Phone Number"
          type="tel"
          form={form}
          required
          placeholder="+27123456789 or 0123456789"
          helperText="South African phone number format"
        />

        {/* Bio */}
        <FormField
          name="bio"
          label="Professional Bio"
          type="textarea"
          form={form}
          placeholder="Tell us about your experience and expertise..."
          rows={6}
          maxLength={1000}
          showCount
          helperText="Describe your professional background, skills, and experience"
        />

        {/* Skills */}
        <FormField
          name="skills"
          label="Skills"
          type="text"
          form={form}
          required
          placeholder="React, Node.js, Python, AWS"
          helperText="Enter your skills separated by commas"
        />

        {/* LinkedIn URL */}
        <FormField
          name="linkedin_url"
          label="LinkedIn Profile"
          type="url"
          form={form}
          placeholder="https://www.linkedin.com/in/your-profile"
          helperText="Optional. Your LinkedIn profile URL"
        />

        {/* Form Actions */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm">
            {form.isDirty && !form.isValid && (
              <span className="text-red-600">Please fix the errors above</span>
            )}
            {form.isDirty && form.isValid && (
              <span className="text-green-600">Ready to save</span>
            )}
            {!form.isDirty && (
              <span className="text-gray-500">No changes</span>
            )}
          </div>

          <div className="flex space-x-3">
            <Button
              type="button"
              variant="secondary"
              onClick={form.resetForm}
              disabled={!form.isDirty || form.isSubmitting}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              variant="primary"
              loading={form.isSubmitting}
              disabled={!form.isDirty || form.isSubmitting}
            >
              {form.isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </form>
    </Card>
  );
};

export default ProfileForm;
