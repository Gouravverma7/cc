import React from 'react';
import { UserPlus, Circle } from 'lucide-react';
import { Collaborator } from '../../types';

interface CollaboratorPanelProps {
  collaborators: Collaborator[];
  onAddCollaborator: () => void;
  isDarkTheme: boolean;
}

export const CollaboratorPanel: React.FC<CollaboratorPanelProps> = ({
  collaborators,
  onAddCollaborator,
  isDarkTheme
}) => {
  return (
    <div className="p-3 h-full flex flex-col">
      <div className="mb-4">
        <button
          onClick={onAddCollaborator}
          className="w-full px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-sm transition-colors flex items-center justify-center space-x-2"
        >
          <UserPlus size={16} />
          <span>Add Collaborator</span>
        </button>
      </div>

      <div className="flex-1">
        <h3 className={`text-xs uppercase tracking-wider mb-3 ${
          isDarkTheme ? 'text-gray-400' : 'text-gray-600'
        }`}>
          Team Members ({collaborators.length})
        </h3>
        
        <div className="space-y-2">
          {collaborators.map(collaborator => (
            <div
              key={collaborator.id}
              className={`flex items-center space-x-3 p-2 rounded transition-colors ${
                isDarkTheme ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
              }`}
            >
              <div className="relative">
                <img
                  src={collaborator.avatar}
                  alt={collaborator.name}
                  className="w-8 h-8 rounded-full"
                />
                <Circle
                  size={8}
                  className={`absolute -bottom-0.5 -right-0.5 fill-current ${
                    collaborator.isOnline ? 'text-green-500' : 'text-gray-500'
                  }`}
                />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className={`text-sm font-medium truncate ${
                  isDarkTheme ? 'text-white' : 'text-gray-900'
                }`}>
                  {collaborator.name}
                </div>
                <div className={`text-xs ${
                  isDarkTheme ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  {collaborator.isOnline ? 'Online' : 'Offline'}
                </div>
              </div>
            </div>
          ))}
        </div>

        {collaborators.length === 0 && (
          <div className={`text-sm text-center py-8 ${
            isDarkTheme ? 'text-gray-500' : 'text-gray-600'
          }`}>
            No collaborators yet. Add someone to start coding together!
          </div>
        )}
      </div>
    </div>
  );
};