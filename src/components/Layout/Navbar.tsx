import React from 'react';
import { 
  Home, 
  MessageSquare, 
  Upload, 
  Github, 
  Settings, 
  User,
  Sun,
  Moon
} from 'lucide-react';
import { GitHubUser } from '../../types';

interface NavbarProps {
  user: GitHubUser | null;
  onHomeClick: () => void;
  onAIToggle: () => void;
  onExportClick: () => void;
  onLoginClick: () => void;
  onThemeToggle: () => void;
  isDarkTheme: boolean;
  isAIVisible: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  onHomeClick,
  onAIToggle,
  onExportClick,
  onLoginClick,
  onThemeToggle,
  isDarkTheme,
  isAIVisible
}) => {
  return (
    <nav className={`h-12 border-b flex items-center justify-between px-4 ${
      isDarkTheme 
        ? 'bg-gray-900 border-gray-700' 
        : 'bg-white border-gray-200'
    }`}>
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 bg-blue-500 rounded flex items-center justify-center">
            <span className="text-white text-xs font-bold">CB</span>
          </div>
          <span className={`font-semibold ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
            CodeBuddy.Ai
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={onHomeClick}
            className={`px-3 py-1.5 rounded transition-colors flex items-center space-x-1 ${
              isDarkTheme 
                ? 'text-gray-300 hover:text-white hover:bg-gray-700' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <Home size={16} />
            <span>Home</span>
          </button>
          
          <button
            onClick={onAIToggle}
            className={`px-3 py-1.5 rounded transition-colors flex items-center space-x-1 ${
              isAIVisible 
                ? 'text-blue-400 bg-blue-900/30' 
                : isDarkTheme
                  ? 'text-gray-300 hover:text-white hover:bg-gray-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <MessageSquare size={16} />
            <span>Ask AI</span>
          </button>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <button
          onClick={onThemeToggle}
          className={`p-2 rounded transition-colors ${
            isDarkTheme 
              ? 'text-gray-300 hover:text-white hover:bg-gray-700' 
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
          title={isDarkTheme ? 'Switch to light theme' : 'Switch to dark theme'}
        >
          {isDarkTheme ? <Sun size={16} /> : <Moon size={16} />}
        </button>
        
        <button
          onClick={onExportClick}
          className={`px-3 py-1.5 rounded transition-colors flex items-center space-x-1 ${
            isDarkTheme 
              ? 'text-gray-300 hover:text-white hover:bg-gray-700' 
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <Github size={16} />
          <span>Export</span>
        </button>

        {user ? (
          <div className={`flex items-center space-x-2 rounded-full py-1 px-3 ${
            isDarkTheme ? 'bg-gray-800' : 'bg-gray-100'
          }`}>
            <img 
              src={user.avatar_url} 
              alt={user.name} 
              className="w-6 h-6 rounded-full"
            />
            <span className={`text-sm ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
              {user.name}
            </span>
          </div>
        ) : (
          <button
            onClick={onLoginClick}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors flex items-center space-x-1"
          >
            <User size={16} />
            <span>Login</span>
          </button>
        )}
      </div>
    </nav>
  );
};