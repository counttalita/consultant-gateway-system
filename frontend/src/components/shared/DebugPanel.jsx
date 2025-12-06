/**
 * Debug Panel Component
 * Provides a UI for viewing logs, performance metrics, and monitoring status
 * Only visible in development mode or when debug mode is enabled
 */

import { useState, useEffect } from 'react';
import { 
  getMonitoringStatus, 
  getBufferedLogs, 
  clearLogs, 
  exportLogs,
  enableDebugMode,
  disableDebugMode,
} from '../../utils/monitoring';
import { getMemoryUsage, getNavigationTiming, getSlowResources } from '../../utils/performance';
import Button from './Button';
import Card from './Card';

const DebugPanel = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('logs');
  const [logs, setLogs] = useState([]);
  const [status, setStatus] = useState({});
  const [filter, setFilter] = useState({ level: '' });

  const refreshData = () => {
    setLogs(getBufferedLogs(filter));
    setStatus(getMonitoringStatus());
  };

  useEffect(() => {
    if (isOpen) {
      refreshData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, filter]);

  const handleClearLogs = () => {
    clearLogs();
    refreshData();
  };

  const handleExportLogs = () => {
    exportLogs();
  };

  const handleToggleDebugMode = () => {
    if (status.debugMode) {
      disableDebugMode();
    } else {
      enableDebugMode();
    }
    refreshData();
  };

  const renderLogs = () => {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium">Filter by level:</label>
            <select
              value={filter.level}
              onChange={(e) => setFilter({ ...filter, level: e.target.value })}
              className="px-2 py-1 border rounded text-sm"
            >
              <option value="">All</option>
              <option value="debug">Debug</option>
              <option value="info">Info</option>
              <option value="warn">Warn</option>
              <option value="error">Error</option>
            </select>
          </div>
          <div className="flex space-x-2">
            <Button size="sm" onClick={refreshData}>Refresh</Button>
            <Button size="sm" onClick={handleClearLogs} variant="secondary">Clear</Button>
            <Button size="sm" onClick={handleExportLogs} variant="secondary">Export</Button>
          </div>
        </div>

        <div className="max-h-96 overflow-y-auto space-y-1">
          {logs.length === 0 ? (
            <p className="text-sm text-gray-500">No logs to display</p>
          ) : (
            logs.map((log, index) => (
              <div
                key={index}
                className={`p-2 rounded text-xs font-mono ${
                  log.level === 'error' ? 'bg-red-50 text-red-900' :
                  log.level === 'warn' ? 'bg-yellow-50 text-yellow-900' :
                  log.level === 'info' ? 'bg-blue-50 text-blue-900' :
                  'bg-gray-50 text-gray-900'
                }`}
              >
                <div className="flex items-start justify-between">
                  <span className="font-semibold uppercase">[{log.level}]</span>
                  <span className="text-gray-500">{new Date(log.timestamp).toLocaleTimeString()}</span>
                </div>
                <div className="mt-1">{log.message}</div>
                {Object.keys(log.data).length > 0 && (
                  <details className="mt-1">
                    <summary className="cursor-pointer text-gray-600">Data</summary>
                    <pre className="mt-1 text-xs overflow-x-auto">
                      {JSON.stringify(log.data, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  const renderPerformance = () => {
    const memory = getMemoryUsage();
    const navigation = getNavigationTiming();
    const slowResources = getSlowResources();

    return (
      <div className="space-y-4">
        <div>
          <h4 className="font-semibold mb-2">Memory Usage</h4>
          {memory ? (
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>Used: {(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB</div>
              <div>Total: {(memory.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB</div>
              <div>Limit: {(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)} MB</div>
              <div>Usage: {memory.usedPercentage}%</div>
            </div>
          ) : (
            <p className="text-sm text-gray-500">Memory API not available</p>
          )}
        </div>

        <div>
          <h4 className="font-semibold mb-2">Navigation Timing</h4>
          {navigation ? (
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>DNS: {navigation.dnsTime}ms</div>
              <div>TCP: {navigation.tcpTime}ms</div>
              <div>Request: {navigation.requestTime}ms</div>
              <div>Response: {navigation.responseTime}ms</div>
              <div>DOM Processing: {navigation.domProcessingTime}ms</div>
              <div>Total: {navigation.totalTime}ms</div>
            </div>
          ) : (
            <p className="text-sm text-gray-500">Navigation timing not available</p>
          )}
        </div>

        <div>
          <h4 className="font-semibold mb-2">Slow Resources (&gt; 1s)</h4>
          {slowResources.length > 0 ? (
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {slowResources.map((resource, index) => (
                <div key={index} className="text-xs p-2 bg-yellow-50 rounded">
                  <div className="font-semibold">{resource.name}</div>
                  <div className="text-gray-600">
                    {resource.type} - {resource.duration.toFixed(2)}ms
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No slow resources detected</p>
          )}
        </div>
      </div>
    );
  };

  const renderStatus = () => {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Log Level</label>
            <p className="text-lg">{status.logLevel}</p>
          </div>
          <div>
            <label className="text-sm font-medium">Debug Mode</label>
            <div className="flex items-center space-x-2">
              <p className="text-lg">{status.debugMode ? 'Enabled' : 'Disabled'}</p>
              <Button size="sm" onClick={handleToggleDebugMode}>
                {status.debugMode ? 'Disable' : 'Enable'}
              </Button>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Error Tracking</label>
            <p className="text-lg">{status.errorTrackingEnabled ? 'Enabled' : 'Disabled'}</p>
          </div>
          <div>
            <label className="text-sm font-medium">Analytics</label>
            <p className="text-lg">{status.analyticsEnabled ? 'Enabled' : 'Disabled'}</p>
          </div>
          <div>
            <label className="text-sm font-medium">Buffered Logs</label>
            <p className="text-lg">{status.bufferedLogsCount}</p>
          </div>
        </div>
      </div>
    );
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-gray-700 z-50"
      >
        🐛 Debug
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-[600px] max-h-[600px] bg-white rounded-lg shadow-2xl z-50 flex flex-col">
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="text-lg font-semibold">Debug Panel</h3>
        <button
          onClick={() => setIsOpen(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>

      <div className="flex border-b">
        <button
          onClick={() => setActiveTab('logs')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'logs'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Logs
        </button>
        <button
          onClick={() => setActiveTab('performance')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'performance'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Performance
        </button>
        <button
          onClick={() => setActiveTab('status')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'status'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Status
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'logs' && renderLogs()}
        {activeTab === 'performance' && renderPerformance()}
        {activeTab === 'status' && renderStatus()}
      </div>
    </div>
  );
};

export default DebugPanel;
