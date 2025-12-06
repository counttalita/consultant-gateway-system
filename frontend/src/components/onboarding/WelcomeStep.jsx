import { useNavigate } from 'react-router-dom';
import Button from '../shared/Button';

const WelcomeStep = () => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/consultant');
  };

  return (
    <div className="text-center space-y-8 py-12">
      {/* Success Icon */}
      <div className="flex justify-center">
        <div className="rounded-full bg-green-100 p-6">
          <svg
            className="h-24 w-24 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
      </div>

      {/* Welcome Message */}
      <div className="space-y-4">
        <h2 className="text-3xl font-bold text-gray-900">
          Welcome Aboard! 🎉
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Congratulations! You've successfully completed the onboarding process. 
          Your profile has been created and you're now ready to start your journey with us.
        </p>
      </div>

      {/* Next Steps */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-2xl mx-auto text-left">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">What's Next?</h3>
        <ul className="space-y-3 text-gray-700">
          <li className="flex items-start">
            <svg
              className="h-6 w-6 text-blue-600 mr-3 shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>
              <strong>Complete Your Profile:</strong> Add more details to your profile to help us match you with the right projects
            </span>
          </li>
          <li className="flex items-start">
            <svg
              className="h-6 w-6 text-blue-600 mr-3 shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>
              <strong>Set Your Availability:</strong> Let us know when you're available for new projects
            </span>
          </li>
          <li className="flex items-start">
            <svg
              className="h-6 w-6 text-blue-600 mr-3 shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>
              <strong>Explore Your Dashboard:</strong> Familiarize yourself with the platform and its features
            </span>
          </li>
          <li className="flex items-start">
            <svg
              className="h-6 w-6 text-blue-600 mr-3 shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>
              <strong>Wait for Project Assignments:</strong> Our team will reach out when suitable projects become available
            </span>
          </li>
        </ul>
      </div>

      {/* Support Information */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 max-w-2xl mx-auto text-left">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Need Help?</h3>
        <p className="text-gray-600">
          If you have any questions or need assistance, please don't hesitate to reach out to our support team. 
          We're here to help you succeed!
        </p>
      </div>

      {/* Action Button */}
      <div className="pt-6">
        <Button
          size="lg"
          onClick={handleGetStarted}
          className="px-8"
        >
          Go to Dashboard
        </Button>
      </div>
    </div>
  );
};

export default WelcomeStep;
