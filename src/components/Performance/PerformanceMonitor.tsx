import React, { useState, useEffect } from 'react';
import { Activity, Zap, Database, Wifi, AlertTriangle } from 'lucide-react';
import { performanceService } from '../../services/performanceService';
import { collaborationService } from '../../services/collaborationService';

interface PerformanceMonitorProps {
  isDarkTheme: boolean;
}

export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({ isDarkTheme }) => {
  const [metrics, setMetrics] = useState({
    renderTime: 0,
    syncLatency: 0,
    memoryUsage: 0,
    cacheHitRate: 0
  });
  const [isConnected, setIsConnected] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const updateMetrics = () => {
      const currentMetrics = performanceService.getMetrics();
      setMetrics(currentMetrics);
      setIsConnected(collaborationService.isConnected());
    };

    // Update metrics every 2 seconds
    const interval = setInterval(updateMetrics, 2000);
    updateMetrics(); // Initial update

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (value: number, thresholds: { good: number; warning: number }) => {
    if (value <= thresholds.good) return 'text-green-500';
    if (value <= thresholds.warning) return 'text-yellow-500';
    return 'text-red-500';
  };

  const formatMemory = (mb: number) => {
    if (mb < 1024) return `${mb.toFixed(1)} MB`;
    return `${(mb / 1024).toFixed(1)} GB`;
  };

  return (
    <div className={`fixed bottom-4 right-4 z-50 ${
      isDarkTheme ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
    } border rounded-lg shadow-lg transition-all duration-300 ${
      showDetails ? 'w-80' : 'w-12'
    }`}>
      {!showDetails ? (
        <button
          onClick={() => setShowDetails(true)}
          className={`w-12 h-12 flex items-center justify-center rounded-lg transition-colors ${
            isDarkTheme ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
          }`}
          title="Performance Monitor"
        >
          <Activity size={20} className={
            metrics.renderTime > 16 || metrics.syncLatency > 1000 
              ? 'text-red-500' 
              : 'text-green-500'
          } />
        </button>
      ) : (
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className={`font-semibold ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
              Performance Monitor
            </h3>
            <button
              onClick={() => setShowDetails(false)}
              className={`text-sm ${
                isDarkTheme ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              ×
            </button>
          </div>

          <div className="space-y-3">
            {/* Render Performance */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Zap size={16} className={getStatusColor(metrics.renderTime, { good: 16, warning: 33 })} />
                <span className={`text-sm ${isDarkTheme ? 'text-gray-300' : 'text-gray-700'}`}>
                  Render Time
                </span>
              </div>
              <span className={`text-sm font-mono ${getStatusColor(metrics.renderTime, { good: 16, warning: 33 })}`}>
                {metrics.renderTime.toFixed(1)}ms
              </span>
            </div>

            {/* Sync Latency */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Wifi size={16} className={
                  isConnected 
                    ? getStatusColor(metrics.syncLatency, { good: 100, warning: 500 })
                    : 'text-red-500'
                } />
                <span className={`text-sm ${isDarkTheme ? 'text-gray-300' : 'text-gray-700'}`}>
                  Sync Latency
                </span>
              </div>
              <span className={`text-sm font-mono ${
                isConnected 
                  ? getStatusColor(metrics.syncLatency, { good: 100, warning: 500 })
                  : 'text-red-500'
              }`}>
                {isConnected ? `${metrics.syncLatency.toFixed(0)}ms` : 'Offline'}
              </span>
            </div>

            {/* Memory Usage */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Database size={16} className={getStatusColor(metrics.memoryUsage, { good: 100, warning: 250 })} />
                <span className={`text-sm ${isDarkTheme ? 'text-gray-300' : 'text-gray-700'}`}>
                  Memory
                </span>
              </div>
              <span className={`text-sm font-mono ${getStatusColor(metrics.memoryUsage, { good: 100, warning: 250 })}`}>
                {formatMemory(metrics.memoryUsage)}
              </span>
            </div>

            {/* Cache Hit Rate */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Activity size={16} className={getStatusColor(100 - metrics.cacheHitRate, { good: 20, warning: 50 })} />
                <span className={`text-sm ${isDarkTheme ? 'text-gray-300' : 'text-gray-700'}`}>
                  Cache Hit
                </span>
              </div>
              <span className={`text-sm font-mono ${getStatusColor(100 - metrics.cacheHitRate, { good: 20, warning: 50 })}`}>
                {metrics.cacheHitRate.toFixed(1)}%
              </span>
            </div>

            {/* Connection Status */}
            <div className={`flex items-center space-x-2 pt-2 border-t ${
              isDarkTheme ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-green-500' : 'bg-red-500'
              }`} />
              <span className={`text-xs ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>

            {/* Performance Warnings */}
            {(metrics.renderTime > 33 || metrics.syncLatency > 1000 || metrics.memoryUsage > 250) && (
              <div className={`flex items-start space-x-2 p-2 rounded ${
                isDarkTheme ? 'bg-yellow-900/20 border-yellow-700' : 'bg-yellow-50 border-yellow-200'
              } border`}>
                <AlertTriangle size={14} className="text-yellow-500 mt-0.5" />
                <div className="text-xs">
                  <div className="font-medium text-yellow-600 mb-1">Performance Issues Detected</div>
                  {metrics.renderTime > 33 && (
                    <div className={isDarkTheme ? 'text-yellow-400' : 'text-yellow-700'}>
                      • Slow rendering detected
                    </div>
                  )}
                  {metrics.syncLatency > 1000 && (
                    <div className={isDarkTheme ? 'text-yellow-400' : 'text-yellow-700'}>
                      • High network latency
                    </div>
                  )}
                  {metrics.memoryUsage > 250 && (
                    <div className={isDarkTheme ? 'text-yellow-400' : 'text-yellow-700'}>
                      • High memory usage
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};