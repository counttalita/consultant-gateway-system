import { useState, useEffect } from 'react';
import { runAllAccessibilityTests } from '../../utils/accessibilityTesting';
import Card from './Card';
import Button from './Button';

/**
 * AccessibilityStatus Component
 * Development tool for testing and monitoring accessibility compliance
 * Only visible in development mode
 */
const AccessibilityStatus = () => {
  const [results, setResults] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const isDevelopment = import.meta.env.DEV;

  const runTests = async () => {
    setIsRunning(true);
    // Small delay to allow UI to update
    await new Promise(resolve => setTimeout(resolve, 100));
    const testResults = runAllAccessibilityTests();
    setResults(testResults);
    setIsRunning(false);
  };

  useEffect(() => {
    if (!isDevelopment) return;
    
    // Keyboard shortcut to toggle visibility (Ctrl+Shift+A)
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'A') {
        e.preventDefault();
        setIsVisible(prev => !prev);
        if (!isVisible) {
          runTests();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isVisible, isDevelopment]);

  const getTotalIssues = () => {
    if (!results) return 0;
    return Object.values(results).reduce((sum, issues) => sum + issues.length, 0);
  };

  const getStatusColor = (issueCount) => {
    if (issueCount === 0) return 'text-green-600';
    if (issueCount < 5) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Only show in development
  if (!isDevelopment) {
    return null;
  }

  if (!isVisible) {
    return (
      <button
        onClick={() => {
          setIsVisible(true);
          runTests();
        }}
        className="fixed bottom-4 right-4 z-50 p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors"
        aria-label="Open accessibility status panel"
        title="Accessibility Status (Ctrl+Shift+A)"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>
    );
  }

  return (
    <div
      className="fixed bottom-4 right-4 z-50 w-96 max-h-[80vh] overflow-hidden"
      role="dialog"
      aria-labelledby="a11y-status-title"
      aria-modal="false"
    >
      <Card
        title="Accessibility Status"
        className="shadow-2xl"
        footer={
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500">Press Ctrl+Shift+A to toggle</span>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsVisible(false)}
              aria-label="Close accessibility status panel"
            >
              Close
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-gray-700">
                Total Issues: <span className={getStatusColor(getTotalIssues())}>{getTotalIssues()}</span>
              </p>
            </div>
            <Button
              size="sm"
              onClick={runTests}
              loading={isRunning}
              disabled={isRunning}
            >
              {isRunning ? 'Testing...' : 'Run Tests'}
            </Button>
          </div>

          {results && (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {Object.entries(results).map(([category, issues]) => (
                <div key={category} className="border-l-4 border-gray-200 pl-3">
                  <div className="flex justify-between items-center mb-1">
                    <h4 className="text-sm font-semibold text-gray-900 capitalize">
                      {category}
                    </h4>
                    <span
                      className={`text-xs font-medium px-2 py-1 rounded ${
                        issues.length === 0
                          ? 'bg-green-100 text-green-800'
                          : issues.length < 5
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {issues.length}
                    </span>
                  </div>
                  
                  {issues.length > 0 ? (
                    <ul className="space-y-2 mt-2">
                      {issues.slice(0, 3).map((issue, index) => (
                        <li key={index} className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                          <p className="font-medium text-gray-800">{issue.issue || issue.element}</p>
                          {issue.text && <p className="mt-1 truncate">Text: {issue.text}</p>}
                          {issue.ratio && <p className="mt-1">Ratio: {issue.ratio} (Required: {issue.required})</p>}
                        </li>
                      ))}
                      {issues.length > 3 && (
                        <li className="text-xs text-gray-500 italic">
                          ...and {issues.length - 3} more
                        </li>
                      )}
                    </ul>
                  ) : (
                    <p className="text-xs text-green-600 mt-1">✓ No issues found</p>
                  )}
                </div>
              ))}
            </div>
          )}

          {!results && (
            <div className="text-center py-8 text-gray-500">
              <p className="text-sm">Click "Run Tests" to check accessibility</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default AccessibilityStatus;
