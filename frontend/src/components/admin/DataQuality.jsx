import { memo } from 'react';
import Card from '../shared/Card';
import { AlertCircle, CheckCircle, Users, FileText, Link as LinkIcon } from 'lucide-react';
import { cn } from '../../utils/cn';

const DataQuality = memo(({ quality, loading, onViewDetails }) => {
  if (loading) {
    return (
      <Card title="Data Quality">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  if (!quality) {
    return (
      <Card title="Data Quality">
        <p className="text-gray-500 text-center py-8">No data quality information available</p>
      </Card>
    );
  }

  const overallScore = quality.overall_score || 0;
  const totalIssues = quality.total_issues || 0;

  const getScoreColor = (score) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score) => {
    if (score >= 90) return 'bg-green-50 border-green-200';
    if (score >= 70) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };

  const issues = [
    {
      key: 'incomplete_profiles',
      label: 'Incomplete Profiles',
      icon: Users,
      color: 'blue',
      data: quality.incomplete_profiles,
      description: 'Consultants with missing profile information',
    },
    {
      key: 'pending_onboarding',
      label: 'Pending Onboarding',
      icon: FileText,
      color: 'purple',
      data: quality.pending_onboarding,
      description: 'Consultants who haven\'t completed onboarding',
    },
    {
      key: 'missing_integrations',
      label: 'Missing Integrations',
      icon: LinkIcon,
      color: 'orange',
      data: quality.missing_integrations,
      description: 'Records not synced with external systems',
    },
  ];

  const colorClasses = {
    blue: {
      bg: 'bg-blue-50',
      text: 'text-blue-600',
      border: 'border-blue-200',
    },
    purple: {
      bg: 'bg-purple-50',
      text: 'text-purple-600',
      border: 'border-purple-200',
    },
    orange: {
      bg: 'bg-orange-50',
      text: 'text-orange-600',
      border: 'border-orange-200',
    },
  };

  return (
    <Card title="Data Quality">
      <div className="space-y-6">
        {/* Overall score */}
        <div className={cn(
          'flex items-center justify-between p-4 rounded-lg border',
          getScoreBgColor(overallScore)
        )}>
          <div className="flex items-center space-x-3">
            {overallScore >= 90 ? (
              <CheckCircle className="h-6 w-6 text-green-600" />
            ) : (
              <AlertCircle className="h-6 w-6 text-yellow-600" />
            )}
            <div>
              <p className="text-sm font-medium text-gray-900">Overall Data Quality Score</p>
              <p className="text-xs text-gray-600">
                {totalIssues} {totalIssues === 1 ? 'issue' : 'issues'} found
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className={cn('text-3xl font-bold', getScoreColor(overallScore))}>
              {overallScore.toFixed(0)}%
            </p>
            <p className="text-xs text-gray-600">Quality Score</p>
          </div>
        </div>

        {/* Issue breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {issues.map((issue) => {
            const Icon = issue.icon;
            const colors = colorClasses[issue.color];
            const count = issue.data?.count || 0;
            const percentage = issue.data?.percentage || 0;
            const hasIssues = count > 0;

            return (
              <div
                key={issue.key}
                className={cn(
                  'border rounded-lg p-4 transition-all',
                  hasIssues && onViewDetails && 'cursor-pointer hover:shadow-md',
                  colors.border
                )}
                onClick={() => hasIssues && onViewDetails && onViewDetails(issue.key)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={cn('p-2 rounded-lg', colors.bg)}>
                    <Icon className={cn('h-5 w-5', colors.text)} />
                  </div>
                  {hasIssues && (
                    <span className={cn(
                      'px-2 py-1 text-xs font-medium rounded-full',
                      colors.bg,
                      colors.text
                    )}>
                      {count}
                    </span>
                  )}
                </div>

                <h3 className="text-sm font-medium text-gray-900 mb-1">
                  {issue.label}
                </h3>
                <p className="text-xs text-gray-500 mb-3">
                  {issue.description}
                </p>

                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-gray-900">{count}</span>
                  {percentage > 0 && (
                    <span className="text-xs text-gray-500">
                      {percentage.toFixed(1)}%
                    </span>
                  )}
                </div>

                {/* Progress bar */}
                {percentage > 0 && (
                  <div className="mt-3 w-full bg-gray-200 rounded-full h-1.5">
                    <div
                      className={cn('h-1.5 rounded-full', colors.bg.replace('50', '500'))}
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Additional details */}
        {quality.details && quality.details.length > 0 && (
          <div className="pt-4 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Additional Details</h4>
            <ul className="space-y-1">
              {quality.details.map((detail, idx) => (
                <li key={idx} className="text-xs text-gray-600 flex items-start">
                  <span className="mr-2">•</span>
                  <span>{detail}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Action message */}
        {totalIssues > 0 && (
          <div className="pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600 text-center">
              {overallScore >= 90 ? (
                <span className="text-green-600 font-medium">
                  ✓ Data quality is excellent. Minor issues detected.
                </span>
              ) : overallScore >= 70 ? (
                <span className="text-yellow-600 font-medium">
                  ⚠ Data quality needs attention. Please review issues.
                </span>
              ) : (
                <span className="text-red-600 font-medium">
                  ✗ Data quality is poor. Immediate action required.
                </span>
              )}
            </p>
          </div>
        )}
      </div>
    </Card>
  );
});

DataQuality.displayName = 'DataQuality';

export default DataQuality;
