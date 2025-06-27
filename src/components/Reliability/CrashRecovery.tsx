import React, { useState, useEffect } from 'react';
import { AlertTriangle, RefreshCw, Save, X } from 'lucide-react';
import { reliabilityService } from '../../services/reliabilityService';

interface CrashRecoveryProps {
  onRecover: (data: any) => void;
  onDismiss: () => void;
  isDarkTheme: boolean;
}

export const CrashRecovery: React.FC<CrashRecoveryProps> = ({
  onRecover,
  onDismiss,
  isDarkTheme
}) => {
  const [isRecovering, setIsRecovering] = useState(false);
  const [recoveryData, setRecoveryData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if recovery is available on mount
    if (reliabilityService.isCrashRecoveryAvailable()) {
      loadRecoveryData();
    }
  }, []);

  const loadRecoveryData = async () => {
    try {
      setIsRecovering(true);
      const data = await reliabilityService.triggerRecovery();
      setRecoveryData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Recovery failed');
    } finally {
      setIsRecovering(false);
    }
  };

  const handleRecover = () => {
    if (recoveryData) {
      onRecover(recoveryData);
    }
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  if (!reliabilityService.isCrashRecoveryAvailable() && !recoveryData) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`max-w-md w-full mx-4 rounded-lg shadow-xl ${
        isDarkTheme ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      } border`}>
        <div className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <h3 className={`text-lg font-semibold ${
                isDarkTheme ? 'text-white' : 'text-gray-900'
              }`}>
                Session Recovery Available
              </h3>
              <p className={`text-sm ${
                isDarkTheme ? 'text-gray-400' : 'text-gray-600'
              }`}>
                We detected an unexpected shutdown
              </p>
            </div>
          </div>

          {isRecovering ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
              <span className={`ml-2 ${isDarkTheme ? 'text-gray-300' : 'text-gray-700'}`}>
                Loading recovery data...
              </span>
            </div>
          ) : error ? (
            <div className={`p-4 rounded-lg mb-4 ${
              isDarkTheme ? 'bg-red-900/20 border-red-700' : 'bg-red-50 border-red-200'
            } border`}>
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <span className={`text-sm ${
                  isDarkTheme ? 'text-red-400' : 'text-red-700'
                }`}>
                  {error}
                </span>
              </div>
            </div>
          ) : recoveryData ? (
            <div className="space-y-4">
              <div className={`p-4 rounded-lg ${
                isDarkTheme ? 'bg-blue-900/20 border-blue-700' : 'bg-blue-50 border-blue-200'
              } border`}>
                <div className="flex items-center space-x-2 mb-2">
                  <Save className="w-4 h-4 text-blue-500" />
                  <span className={`text-sm font-medium ${
                    isDarkTheme ? 'text-blue-400' : 'text-blue-700'
                  }`}>
                    Recovery Data Found
                  </span>
                </div>
                <div className={`text-xs space-y-1 ${
                  isDarkTheme ? 'text-blue-300' : 'text-blue-600'
                }`}>
                  <div>Files: {recoveryData.files?.length || 0}</div>
                  <div>Last saved: {formatTimestamp(Date.now())}</div>
                </div>
              </div>

              <div className={`text-sm ${
                isDarkTheme ? 'text-gray-400' : 'text-gray-600'
              }`}>
                We found a backup of your work from before the unexpected shutdown. 
                Would you like to restore it?
              </div>
            </div>
          ) : null}

          <div className="flex space-x-3 mt-6">
            <button
              onClick={handleRecover}
              disabled={!recoveryData || isRecovering}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center space-x-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Restore Session</span>
            </button>
            <button
              onClick={onDismiss}
              className={`px-4 py-2 rounded-lg transition-colors ${
                isDarkTheme 
                  ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className={`mt-4 text-xs text-center ${
            isDarkTheme ? 'text-gray-500' : 'text-gray-500'
          }`}>
            Auto-save keeps your work safe every 30 seconds
          </div>
        </div>
      </div>
    </div>
  );
};