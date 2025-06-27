import React from 'react';
import { 
  Code, 
  Users, 
  GitBranch, 
  MessageSquare,
  FileText,
  Terminal,
  Zap
} from 'lucide-react';

interface HomePanelProps {
  onClose: () => void;
}

export const HomePanel: React.FC<HomePanelProps> = ({ onClose }) => {
  const features = [
    {
      icon: Code,
      title: 'Professional Code Editor',
      description: 'VS Code-like editing experience with syntax highlighting, IntelliSense, and advanced features'
    },
    {
      icon: MessageSquare,
      title: 'AI Assistant',
      description: 'Get help with code explanations, bug fixes, optimizations, and programming questions'
    },
    {
      icon: Users,
      title: 'Real-time Collaboration',
      description: 'Code together with your team in real-time with live cursors and instant sync'
    },
    {
      icon: GitBranch,
      title: 'GitHub Integration',
      description: 'Export your projects to GitHub repositories and gists with seamless OAuth integration'
    },
    {
      icon: FileText,
      title: 'File Management',
      description: 'Full file system operations - create, delete, rename, upload files and folders'
    },
    {
      icon: Terminal,
      title: 'Integrated Terminal',
      description: 'Multiple terminal instances with bash, PowerShell support right in your browser'
    }
  ];

  return (
    <div className="flex-1 bg-gray-900 overflow-y-auto">
      <div className="max-w-4xl mx-auto p-8">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center">
              <Zap className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">
            Welcome to CodeBuddy.Ai
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            A powerful, collaborative code editor with built-in AI assistance. 
            Code smarter, collaborate better, and ship faster.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-gray-600 transition-colors"
            >
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                  <feature.icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white">{feature.title}</h3>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">
            Ready to start coding?
          </h2>
          <p className="text-blue-100 mb-6">
            Select a file from the sidebar to begin editing, or ask the AI assistant for help!
          </p>
          <button
            onClick={onClose}
            className="bg-white text-blue-600 font-semibold px-6 py-3 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Start Coding
          </button>
        </div>
      </div>
    </div>
  );
};