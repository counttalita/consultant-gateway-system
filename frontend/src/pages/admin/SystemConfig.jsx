import { useState, useEffect } from 'react';
import { Card, Button, LoadingSpinner } from '../../components/shared';
import { useNotification } from '../../hooks/useNotification';
import adminService from '../../services/admin.service';

const SystemConfig = () => {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reloading, setReloading] = useState(false);
  const { showSuccess, showError } = useNotification();

  useEffect(() => {
    loadConfig();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const response = await adminService.getConfig();
      setConfig(response.config);
    } catch (error) {
      showError('Failed to load configuration');
      console.error('Error loading config:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReload = async () => {
    if (!confirm('Reload configuration from environment variables? This will apply any changes made to environment settings.')) {
      return;
    }

    setReloading(true);
    try {
      const response = await adminService.reloadConfig();
      showSuccess(response.message || 'Configuration reloaded successfully');
      await loadConfig(); // Reload the config display
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to reload configuration';
      const errorDetails = error.response?.data?.details;
      showError(errorDetails ? `${errorMessage}: ${errorDetails}` : errorMessage);
      console.error('Error reloading config:', error);
    } finally {
      setReloading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System Configuration</h1>
          <p className="mt-1 text-sm text-gray-500">
            View current system configuration and reload from environment variables
          </p>
        </div>
        <Button
          onClick={handleReload}
          disabled={reloading}
          loading={reloading}
          variant="primary"
        >
          {reloading ? 'Reloading...' : 'Reload Configuration'}
        </Button>
      </div>

      {config && (
        <div className="space-y-6">
          {/* Environment */}
          <Card title="Environment">
            <ConfigSection
              data={{
                'Environment': config.environment
              }}
            />
          </Card>

          {/* Airtable Configuration */}
          <Card title="Airtable">
            <ConfigSection
              data={{
                'Base ID': config.airtable?.base_id || 'Not configured',
                'Timeout (seconds)': config.airtable?.timeout || 'Not configured'
              }}
            />
          </Card>

          {/* Xero Configuration */}
          <Card title="Xero">
            <ConfigSection
              data={{
                'Client ID': config.xero?.client_id || 'Not configured',
                'Tenant ID': config.xero?.tenant_id || 'Not configured',
                'Redirect URI': config.xero?.redirect_uri || 'Not configured'
              }}
            />
          </Card>

          {/* Harvest Configuration */}
          <Card title="Harvest">
            <ConfigSection
              data={{
                'Account ID': config.harvest?.account_id || 'Not configured',
                'Timeout (seconds)': config.harvest?.timeout || 'Not configured'
              }}
            />
          </Card>

          {/* ClickUp Configuration */}
          <Card title="ClickUp">
            <ConfigSection
              data={{
                'Team ID': config.clickup?.team_id || 'Not configured',
                'Timeout (seconds)': config.clickup?.timeout || 'Not configured'
              }}
            />
          </Card>

          {/* Google Drive Configuration */}
          <Card title="Google Drive">
            <ConfigSection
              data={{
                'Folder ID': config.google_drive?.folder_id || 'Not configured'
              }}
            />
          </Card>

          {/* Resend Configuration */}
          <Card title="Resend (Email)">
            <ConfigSection
              data={{
                'From Email': config.resend?.from_email || 'Not configured',
                'From Name': config.resend?.from_name || 'Not configured'
              }}
            />
          </Card>

          {/* SimplePay Configuration */}
          <Card title="SimplePay">
            <ConfigSection
              data={{
                'Company ID': config.simplepay?.company_id || 'Not configured'
              }}
            />
          </Card>

          {/* Application Configuration */}
          <Card title="Application">
            <ConfigSection
              data={{
                'Host': config.application?.host || 'Not configured',
                'Protocol': config.application?.protocol || 'Not configured',
                'Frontend URL': config.application?.frontend_url || 'Not configured'
              }}
            />
          </Card>

          {/* OTP Configuration */}
          <Card title="OTP Settings">
            <ConfigSection
              data={{
                'Expiry (minutes)': config.otp?.expiry_minutes || 'Not configured',
                'Max Attempts': config.otp?.max_attempts || 'Not configured',
                'Rate Limit (per hour)': config.otp?.rate_limit_per_hour || 'Not configured'
              }}
            />
          </Card>

          {/* Session Configuration */}
          <Card title="Session Settings">
            <ConfigSection
              data={{
                'Expiry (hours)': config.session?.expiry_hours || 'Not configured'
              }}
            />
          </Card>

          {/* Cache Configuration */}
          <Card title="Cache Settings">
            <ConfigSection
              data={{
                'TTL (minutes)': config.cache?.ttl_minutes || 'Not configured',
                'Stale Serve Enabled': config.cache?.stale_serve_enabled !== undefined 
                  ? (config.cache.stale_serve_enabled ? 'Yes' : 'No')
                  : 'Not configured'
              }}
            />
          </Card>

          {/* Retry Configuration */}
          <Card title="Retry Settings">
            <ConfigSection
              data={{
                'Max Retries': config.retry?.max_retries || 'Not configured',
                'Base Delay (seconds)': config.retry?.base_delay_seconds || 'Not configured'
              }}
            />
          </Card>

          {/* Circuit Breaker Configuration */}
          <Card title="Circuit Breaker Settings">
            <ConfigSection
              data={{
                'Failure Threshold': config.circuit_breaker?.failure_threshold || 'Not configured',
                'Timeout (seconds)': config.circuit_breaker?.timeout_seconds || 'Not configured'
              }}
            />
          </Card>

          {/* Notification Configuration */}
          <Card title="Notification Settings">
            <ConfigSection
              data={{
                'Admin Emails': config.notifications?.admin_emails?.length > 0 
                  ? config.notifications.admin_emails.join(', ')
                  : 'Not configured',
                'Finance Emails': config.notifications?.finance_emails?.length > 0
                  ? config.notifications.finance_emails.join(', ')
                  : 'Not configured'
              }}
            />
          </Card>

          {/* Feature Flags */}
          {config.feature_flags && Object.keys(config.feature_flags).length > 0 && (
            <Card title="Feature Flags">
              <ConfigSection
                data={Object.entries(config.feature_flags).reduce((acc, [key, value]) => {
                  acc[key] = value ? 'Enabled' : 'Disabled';
                  return acc;
                }, {})}
              />
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

// Helper component to display configuration sections
const ConfigSection = ({ data }) => {
  return (
    <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
      {Object.entries(data).map(([key, value]) => (
        <div key={key} className="sm:col-span-1">
          <dt className="text-sm font-medium text-gray-500">{key}</dt>
          <dd className="mt-1 text-sm text-gray-900 wrap-break-word">
            {value || 'Not set'}
          </dd>
        </div>
      ))}
    </dl>
  );
};

export default SystemConfig;
