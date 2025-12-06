import { useForm } from '../../hooks/useForm';
import { required } from '../../utils/validationRules';
import Checkbox from '../shared/Checkbox';
import Button from '../shared/Button';

const ContractStep = ({ data, onComplete, onBack, canGoBack }) => {
  const { values, errors, touched, handleChange, handleBlur, handleSubmit, isSubmitting } = useForm(
    data || {
      agreed_to_terms: false,
      agreed_to_privacy: false,
      agreed_to_code_of_conduct: false,
      signature: ''
    },
    {
      agreed_to_terms: [
        (value) => !value && 'You must agree to the terms and conditions'
      ],
      agreed_to_privacy: [
        (value) => !value && 'You must agree to the privacy policy'
      ],
      agreed_to_code_of_conduct: [
        (value) => !value && 'You must agree to the code of conduct'
      ],
      signature: [required('Signature is required')]
    },
    async (values) => {
      await onComplete('contract', values);
    }
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Contract & Agreement</h2>
        <p className="text-gray-600">Please review and accept the terms to complete your onboarding.</p>
      </div>

      <div className="space-y-6">
        {/* Contract Terms */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Consultant Agreement</h3>
          <div className="max-h-64 overflow-y-auto bg-white border border-gray-200 rounded p-4 text-sm text-gray-700 space-y-3">
            <p className="font-semibold">1. Independent Contractor Relationship</p>
            <p>
              You acknowledge that you are an independent contractor and not an employee of the company. 
              You are responsible for your own taxes, insurance, and business expenses.
            </p>

            <p className="font-semibold">2. Scope of Work</p>
            <p>
              You agree to provide consulting services as requested and agreed upon for specific projects. 
              The scope, duration, and compensation for each project will be defined in separate project agreements.
            </p>

            <p className="font-semibold">3. Payment Terms</p>
            <p>
              Payment will be made according to the terms specified in individual project agreements. 
              Invoices must be submitted monthly and will be processed within 30 days of receipt.
            </p>

            <p className="font-semibold">4. Confidentiality</p>
            <p>
              You agree to maintain confidentiality of all client information, proprietary data, and 
              business processes you encounter during your engagement.
            </p>

            <p className="font-semibold">5. Intellectual Property</p>
            <p>
              Unless otherwise agreed in writing, all work product created during your engagement 
              shall be the property of the client or the company as specified in project agreements.
            </p>

            <p className="font-semibold">6. Termination</p>
            <p>
              Either party may terminate this agreement with 30 days written notice. 
              Termination does not affect obligations for ongoing projects.
            </p>

            <p className="font-semibold">7. Professional Conduct</p>
            <p>
              You agree to maintain professional standards, meet deadlines, communicate effectively, 
              and represent the company and clients in a professional manner.
            </p>
          </div>
        </div>

        {/* Agreement Checkboxes */}
        <div className="space-y-4">
          <Checkbox
            id="agreed_to_terms"
            checked={values.agreed_to_terms}
            onChange={(e) => handleChange('agreed_to_terms', e.target.checked)}
            onBlur={() => handleBlur('agreed_to_terms')}
            error={touched.agreed_to_terms && errors.agreed_to_terms}
            label="I have read and agree to the Consultant Agreement terms and conditions"
          />

          <Checkbox
            id="agreed_to_privacy"
            checked={values.agreed_to_privacy}
            onChange={(e) => handleChange('agreed_to_privacy', e.target.checked)}
            onBlur={() => handleBlur('agreed_to_privacy')}
            error={touched.agreed_to_privacy && errors.agreed_to_privacy}
            label="I have read and agree to the Privacy Policy"
          />

          <Checkbox
            id="agreed_to_code_of_conduct"
            checked={values.agreed_to_code_of_conduct}
            onChange={(e) => handleChange('agreed_to_code_of_conduct', e.target.checked)}
            onBlur={() => handleBlur('agreed_to_code_of_conduct')}
            error={touched.agreed_to_code_of_conduct && errors.agreed_to_code_of_conduct}
            label="I agree to abide by the Code of Conduct"
          />
        </div>

        {/* Digital Signature */}
        <div className="border-t pt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Digital Signature <span className="text-red-500">*</span>
          </label>
          <input
            id="signature"
            type="text"
            value={values.signature}
            onChange={(e) => handleChange('signature', e.target.value)}
            onBlur={() => handleBlur('signature')}
            placeholder="Type your full name as signature"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-serif text-lg italic"
          />
          {touched.signature && errors.signature && (
            <p className="mt-1 text-sm text-red-600">{errors.signature}</p>
          )}
          <p className="mt-2 text-xs text-gray-500">
            By typing your name, you are providing a legal digital signature
          </p>
        </div>

        {/* Date Display */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <span className="font-semibold">Date:</span> {new Date().toLocaleDateString('en-ZA', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        </div>
      </div>

      <div className="flex justify-between pt-6 border-t">
        {canGoBack ? (
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            disabled={isSubmitting}
          >
            Back
          </Button>
        ) : (
          <div />
        )}

        <Button
          type="submit"
          loading={isSubmitting}
          disabled={isSubmitting}
        >
          Continue
        </Button>
      </div>
    </form>
  );
};

export default ContractStep;
