import { memo } from 'react';
import Card from '../shared/Card';
import { TrendingUp, Activity, UserPlus, FileEdit } from 'lucide-react';

const ActivityTrends = memo(({ trends, loading }) => {
  const summary = trends?.summary || {};

  const activities = [
    {
      label: 'Total Logins',
      value: summary.total_logins || 0,
      icon: Activity,
      color: 'blue',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
    },
    {
      label: 'Profile Updates',
      value: summary.total_profile_updates || 0,
      icon: FileEdit,
      color: 'green',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600',
    },
    {
      label: 'Onboarding Completions',
      value: summary.total_onboarding_completions || 0,
      icon: UserPlus,
      color: 'purple',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600',
    },
  ];

  // Calculate daily averages
  const days = 7;
  const dailyAverages = {
    logins: Math.round((summary.total_logins || 0) / days),
    updates: Math.round((summary.total_profile_updates || 0) / days),
    completions: Math.round((summary.total_onboarding_completions || 0) / days),
  };

  if (loading) {
    return (
      <Card title="Activity Trends (Last 7 Days)">
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </Card>
    );
  }

  if (!trends || !trends.summary) {
    return (
      <Card title="Activity Trends (Last 7 Days)">
        <p className="text-gray-500 text-center py-8">No activity data available</p>
      </Card>
    );
  }

  // Simple bar chart visualization
  const maxValue = Math.max(
    summary.total_logins || 0,
    summary.total_profile_updates || 0,
    summary.total_onboarding_completions || 0
  );

  return (
    <Card title="Activity Trends (Last 7 Days)">
      <div className="space-y-4">
        {activities.map((activity) => {
          const Icon = activity.icon;
          const percentage = maxValue > 0 ? (activity.value / maxValue) * 100 : 0;

          return (
            <div key={activity.label} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${activity.bgColor}`}>
                    <Icon className={`h-4 w-4 ${activity.textColor}`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">{activity.label}</p>
                    <p className="text-xs text-gray-500">
                      Avg: {activity.label === 'Total Logins' ? dailyAverages.logins : 
                            activity.label === 'Profile Updates' ? dailyAverages.updates : 
                            dailyAverages.completions}/day
                    </p>
                  </div>
                </div>
                <span className={`text-lg font-bold ${activity.textColor}`}>
                  {activity.value}
                </span>
              </div>
              
              {/* Progress bar */}
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-500 ${activity.bgColor.replace('50', '500')}`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}

        {/* Trend indicator */}
        {summary.total_logins > 0 && (
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span>
                Activity tracking over the past 7 days
              </span>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
});

ActivityTrends.displayName = 'ActivityTrends';

export default ActivityTrends;
