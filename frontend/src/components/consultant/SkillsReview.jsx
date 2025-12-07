import { useState } from 'react';
import { CheckCircle, XCircle, Plus, X } from 'lucide-react';
import { cn } from '../../utils/cn';
import Button from '../shared/Button';
import Card from '../shared/Card';
import Input from '../shared/Input';

const SkillsReview = ({ parsedData, onConfirm, onCancel }) => {
  const [skills, setSkills] = useState(parsedData?.parsed_skills || []);
  const [experience, setExperience] = useState(parsedData?.parsed_experience || '');
  const [qualifications, setQualifications] = useState(parsedData?.parsed_qualifications || []);
  const [newSkill, setNewSkill] = useState('');
  const [newQualification, setNewQualification] = useState('');

  const handleAddSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setSkills(skills.filter(skill => skill !== skillToRemove));
  };

  const handleAddQualification = () => {
    if (newQualification.trim() && !qualifications.includes(newQualification.trim())) {
      setQualifications([...qualifications, newQualification.trim()]);
      setNewQualification('');
    }
  };

  const handleRemoveQualification = (qualToRemove) => {
    setQualifications(qualifications.filter(qual => qual !== qualToRemove));
  };

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm({
        skills,
        experience,
        qualifications
      });
    }
  };

  const handleKeyPress = (e, addFunction) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addFunction();
    }
  };

  return (
    <Card 
      title="Review Parsed Information" 
      subtitle="Review and edit the information extracted from your CV"
    >
      <div className="space-y-6">
        {/* Skills Section */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">Skills</h4>
          
          {/* Skills List */}
          <div className="flex flex-wrap gap-2 mb-3">
            {skills.length === 0 ? (
              <p className="text-sm text-gray-500 italic">No skills detected. Add some below.</p>
            ) : (
              skills.map((skill, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                >
                  {skill}
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(skill)}
                    className="ml-2 text-blue-600 hover:text-blue-800"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))
            )}
          </div>

          {/* Add Skill Input */}
          <div className="flex space-x-2">
            <Input
              type="text"
              placeholder="Add a skill..."
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              onKeyPress={(e) => handleKeyPress(e, handleAddSkill)}
              className="flex-1"
            />
            <Button
              type="button"
              onClick={handleAddSkill}
              variant="secondary"
              size="md"
              disabled={!newSkill.trim()}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Experience Section */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">Experience Summary</h4>
          <textarea
            className={cn(
              'w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm',
              'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
              'resize-y'
            )}
            rows={6}
            placeholder="Brief summary of your professional experience..."
            value={experience}
            onChange={(e) => setExperience(e.target.value)}
          />
          {!experience && (
            <p className="mt-1 text-xs text-gray-500">
              No experience summary detected. You can add one manually.
            </p>
          )}
        </div>

        {/* Qualifications Section */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">Qualifications</h4>
          
          {/* Qualifications List */}
          <div className="space-y-2 mb-3">
            {qualifications.length === 0 ? (
              <p className="text-sm text-gray-500 italic">No qualifications detected. Add some below.</p>
            ) : (
              qualifications.map((qual, index) => (
                <div
                  key={index}
                  className="flex items-start justify-between p-3 bg-gray-50 rounded-md border border-gray-200"
                >
                  <p className="text-sm text-gray-900 flex-1">{qual}</p>
                  <button
                    type="button"
                    onClick={() => handleRemoveQualification(qual)}
                    className="ml-2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Add Qualification Input */}
          <div className="flex space-x-2">
            <Input
              type="text"
              placeholder="Add a qualification..."
              value={newQualification}
              onChange={(e) => setNewQualification(e.target.value)}
              onKeyPress={(e) => handleKeyPress(e, handleAddQualification)}
              className="flex-1"
            />
            <Button
              type="button"
              onClick={handleAddQualification}
              variant="secondary"
              size="md"
              disabled={!newQualification.trim()}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          {onCancel && (
            <Button
              type="button"
              variant="secondary"
              onClick={onCancel}
            >
              Cancel
            </Button>
          )}
          <Button
            type="button"
            variant="primary"
            onClick={handleConfirm}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Confirm & Save
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default SkillsReview;
