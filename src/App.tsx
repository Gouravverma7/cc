import React, { useState, useCallback, useRef, useEffect } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { Navbar } from './components/Layout/Navbar';
import { Sidebar } from './components/Layout/Sidebar';
import { EditorTabs } from './components/Editor/EditorTabs';
import { CodeEditor } from './components/Editor/CodeEditor';
import { AIAssistant } from './components/AI/AIAssistant';
import { Terminal } from './components/Terminal/Terminal';
import { HomePanel } from './components/Home/HomePanel';
import { PerformanceMonitor } from './components/Performance/PerformanceMonitor';
import { CrashRecovery } from './components/Reliability/CrashRecovery';
import { useFileSystem } from './hooks/useFileSystem';
import { githubService } from './services/githubService';
import { performanceService } from './services/performanceService';
import { reliabilityService } from './services/reliabilityService';
import { collaborationService } from './services/collaborationService';
import { FileNode, Tab, Collaborator, GitHubUser } from './types';

// Error Fallback Component
const ErrorFallback: React.FC<{ error: Error; resetErrorBoundary: () => void }> = ({ 
  error, 
  resetErrorBoundary 
}) => (
  <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
    <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full">
      <h2 className="text-xl font-bold text-red-400 mb-4">Something went wrong</h2>
      <p className="text-gray-300 mb-4">{error.message}</p>
      <button
        onClick={resetErrorBoundary}
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors"
      >
        Try again
      </button>
    </div>
  </div>
);

function App() {
  const { files, findFileById, createFile, deleteFile, renameFile, updateFileContent } = useFileSystem();
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string>('');
  const [isAIVisible, setIsAIVisible] = useState(false);
  const [isTerminalVisible, setIsTerminalVisible] = useState(false);
  const [showHome, setShowHome] = useState(true);
  const [isDarkTheme, setIsDarkTheme] = useState(true);
  const [user, setUser] = useState<GitHubUser | null>(null);
  const [showCrashRecovery, setShowCrashRecovery] = useState(false);
  const terminalRef = useRef<any>(null);

  // Mock collaborators
  const [collaborators] = useState<Collaborator[]>([
    {
      id: '1',
      name: 'Alice Johnson',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b9b6bab8?w=40&h=40&fit=crop&crop=face',
      isOnline: true
    },
    {
      id: '2',
      name: 'Bob Smith',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face',
      isOnline: false
    }
  ]);

  // Initialize services
  useEffect(() => {
    // Start auto-backup
    reliabilityService.startAutoBackup(() => ({
      files,
      tabs,
      activeTabId,
      timestamp: Date.now()
    }));

    // Check for crash recovery
    if (reliabilityService.isCrashRecoveryAvailable()) {
      setShowCrashRecovery(true);
    }

    // Initialize collaboration (in production, this would be based on room/project ID)
    const initCollaboration = async () => {
      try {
        await collaborationService.initializeRoom('default-room', {
          name: user?.name || 'Anonymous User',
          avatar: user?.avatar_url || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face'
        });
      } catch (error) {
        console.warn('Collaboration initialization failed:', error);
      }
    };

    initCollaboration();

    return () => {
      reliabilityService.stopAutoBackup();
      collaborationService.disconnect();
      performanceService.cleanup();
    };
  }, [files, tabs, activeTabId, user]);

  // Performance-optimized file selection
  const handleFileSelect = useCallback((file: FileNode) => {
    if (file.type !== 'file') return;

    return performanceService.measureRenderTime(() => {
      setShowHome(false);

      // Check cache first
      const cacheKey = `tab_${file.id}`;
      let existingTab = performanceService.getCache(cacheKey);
      
      if (!existingTab) {
        existingTab = tabs.find(tab => tab.path === file.path);
        if (existingTab) {
          performanceService.setCache(cacheKey, existingTab);
        }
      }

      if (existingTab) {
        setActiveTabId(existingTab.id);
        return;
      }

      // Create new tab
      const newTab: Tab = {
        id: file.id,
        name: file.name,
        path: file.path,
        content: file.content || '',
        language: file.language || 'plaintext',
        isDirty: false
      };

      setTabs(prev => [...prev, newTab]);
      setActiveTabId(newTab.id);
      performanceService.setCache(cacheKey, newTab);
    });
  }, [tabs]);

  const handleTabClose = useCallback((tabId: string) => {
    setTabs(prev => {
      const newTabs = prev.filter(tab => tab.id !== tabId);
      if (tabId === activeTabId) {
        if (newTabs.length > 0) {
          setActiveTabId(newTabs[newTabs.length - 1].id);
        } else {
          setActiveTabId('');
          setShowHome(true);
        }
      }
      return newTabs;
    });
  }, [activeTabId]);

  // Debounced code change handler
  const handleCodeChange = useCallback(
    performanceService.debouncedAutoSave.bind(null, (value: string) => {
      const activeTab = tabs.find(tab => tab.id === activeTabId);
      if (!activeTab) return;

      setTabs(prev => prev.map(tab => 
        tab.id === activeTabId 
          ? { ...tab, content: value, isDirty: value !== tab.content }
          : tab
      ));

      updateFileContent(activeTabId, value);
      reliabilityService.markUnsavedChanges();
    }),
    [activeTabId, tabs, updateFileContent]
  );

  const handleUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = '.js,.ts,.jsx,.tsx,.py,.java,.cpp,.c,.css,.html,.json,.md,.txt';
    
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files) {
        Array.from(files).forEach(file => {
          const reader = new FileReader();
          reader.onload = (e) => {
            const content = e.target?.result as string;
            createFile(null, file.name, 'file');
            setTimeout(() => {
              const newFile = findFileById(Date.now().toString());
              if (newFile) {
                updateFileContent(newFile.id, content);
              }
            }, 100);
          };
          reader.readAsText(file);
        });
      }
    };
    
    input.click();
  };

  const handleAddCollaborator = () => {
    const username = prompt('Enter GitHub username:');
    if (username) {
      alert(`Invite sent to ${username}!`);
    }
  };

  const handleExport = async () => {
    if (!githubService.isAuthenticated()) {
      const authenticated = await githubService.authenticate();
      if (!authenticated) {
        alert('GitHub authentication failed. Please try again.');
        return;
      }
    }

    const exportType = confirm('Click OK to export as Repository, Cancel for Gist');
    
    if (exportType) {
      const repoName = prompt('Repository name:', 'codebuddy-project');
      const description = prompt('Repository description:', 'Exported from CodeBuddy.Ai');
      const isPrivate = confirm('Make repository private?');
      
      if (repoName) {
        const repoUrl = await githubService.createRepository(repoName, description || '', isPrivate);
        if (repoUrl) {
          alert(`Repository created successfully!\n${repoUrl}`);
          window.open(repoUrl, '_blank');
        } else {
          alert('Failed to create repository. Please try again.');
        }
      }
    } else {
      const gistFiles: Record<string, string> = {};
      
      const collectFiles = (nodes: FileNode[]) => {
        nodes.forEach(node => {
          if (node.type === 'file' && node.content) {
            gistFiles[node.path.replace('/', '')] = node.content;
          }
          if (node.children) {
            collectFiles(node.children);
          }
        });
      };
      
      collectFiles(files);
      
      if (Object.keys(gistFiles).length === 0) {
        alert('No files to export!');
        return;
      }
      
      const description = prompt('Gist description:', 'CodeBuddy.Ai Project Export');
      const isPublic = confirm('Make gist public?');
      
      const gistUrl = await githubService.createGist(gistFiles, description || '', isPublic);
      if (gistUrl) {
        alert(`Gist created successfully!\n${gistUrl}`);
        window.open(gistUrl, '_blank');
      } else {
        alert('Failed to create gist. Please try again.');
      }
    }
  };

  const handleLogin = async () => {
    const authenticated = await githubService.authenticate();
    if (authenticated) {
      const userInfo = await githubService.getUserInfo();
      if (userInfo) {
        setUser({
          login: userInfo.login,
          name: userInfo.name || userInfo.login,
          avatar_url: userInfo.avatar_url
        });
      }
    } else {
      alert('GitHub authentication failed. Please try again.');
    }
  };

  const handleTerminalOutput = (output: string, isError: boolean = false) => {
    if (terminalRef.current?.writeToTerminal) {
      terminalRef.current.writeToTerminal(output, isError);
    }
    if (!isTerminalVisible) {
      setIsTerminalVisible(true);
    }
  };

  const handleCrashRecovery = (recoveryData: any) => {
    if (recoveryData.files) {
      // Restore files (implementation depends on your file system structure)
      console.log('Restoring files from crash recovery:', recoveryData);
    }
    if (recoveryData.tabs) {
      setTabs(recoveryData.tabs);
    }
    if (recoveryData.activeTabId) {
      setActiveTabId(recoveryData.activeTabId);
    }
    setShowCrashRecovery(false);
    setShowHome(false);
  };

  const activeTab = tabs.find(tab => tab.id === activeTabId);

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <div className={`h-screen flex flex-col ${isDarkTheme ? 'dark' : ''}`}>
        <Navbar
          user={user}
          onHomeClick={() => setShowHome(true)}
          onAIToggle={() => setIsAIVisible(!isAIVisible)}
          onExportClick={handleExport}
          onLoginClick={handleLogin}
          onThemeToggle={() => setIsDarkTheme(!isDarkTheme)}
          isDarkTheme={isDarkTheme}
          isAIVisible={isAIVisible}
        />

        <div className="flex flex-1 overflow-hidden">
          <Sidebar
            files={files}
            collaborators={collaborators}
            onFileSelect={handleFileSelect}
            onFileCreate={createFile}
            onFileDelete={deleteFile}
            onFileRename={renameFile}
            onUpload={handleUpload}
            onAddCollaborator={handleAddCollaborator}
            activeFileId={activeTabId}
            isDarkTheme={isDarkTheme}
          />

          <div className="flex-1 flex flex-col overflow-hidden">
            {showHome ? (
              <HomePanel onClose={() => setShowHome(false)} />
            ) : (
              <>
                <EditorTabs
                  tabs={tabs}
                  activeTabId={activeTabId}
                  onTabSelect={setActiveTabId}
                  onTabClose={handleTabClose}
                  isDarkTheme={isDarkTheme}
                />

                <div className="flex-1 flex overflow-hidden">
                  <div className={`flex-1 ${isDarkTheme ? 'bg-gray-900' : 'bg-white'}`}>
                    {activeTab ? (
                      <CodeEditor
                        value={activeTab.content}
                        language={activeTab.language}
                        onChange={(value) => handleCodeChange(value, activeTab.id)}
                        theme={isDarkTheme ? 'vs-dark' : 'vs-light'}
                      />
                    ) : (
                      <div className={`h-full flex items-center justify-center ${
                        isDarkTheme ? 'text-gray-500' : 'text-gray-600'
                      }`}>
                        <div className="text-center">
                          <p className="mb-2">No file selected</p>
                          <p className="text-sm">Choose a file from the sidebar to start editing</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {isAIVisible && (
                    <AIAssistant
                      currentCode={activeTab?.content}
                      onCodeInsert={(code) => {
                        if (activeTab) {
                          handleCodeChange(activeTab.content + '\n' + code, activeTab.id);
                        }
                      }}
                      onTerminalOutput={handleTerminalOutput}
                      isDarkTheme={isDarkTheme}
                    />
                  )}
                </div>

                <div className={`flex justify-between items-center px-4 py-1 border-t ${
                  isDarkTheme 
                    ? 'bg-gray-800 border-gray-700' 
                    : 'bg-gray-100 border-gray-200'
                }`}>
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => setIsTerminalVisible(!isTerminalVisible)}
                      className={`text-sm px-2 py-1 rounded transition-colors ${
                        isTerminalVisible 
                          ? isDarkTheme
                            ? 'text-white bg-gray-700'
                            : 'text-gray-900 bg-gray-200'
                          : isDarkTheme
                            ? 'text-gray-400 hover:text-white'
                            : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Terminal
                    </button>
                  </div>
                  
                  <div className={`text-xs ${
                    isDarkTheme ? 'text-gray-500' : 'text-gray-600'
                  }`}>
                    {activeTab && `${activeTab.language} • Line 1, Column 1`}
                  </div>
                </div>

                <Terminal 
                  isVisible={isTerminalVisible} 
                  isDarkTheme={isDarkTheme}
                  ref={terminalRef}
                />
              </>
            )}
          </div>
        </div>

        {/* Performance Monitor */}
        <PerformanceMonitor isDarkTheme={isDarkTheme} />

        {/* Crash Recovery Modal */}
        {showCrashRecovery && (
          <CrashRecovery
            onRecover={handleCrashRecovery}
            onDismiss={() => setShowCrashRecovery(false)}
            isDarkTheme={isDarkTheme}
          />
        )}
      </div>
    </ErrorBoundary>
  );
}

export default App;