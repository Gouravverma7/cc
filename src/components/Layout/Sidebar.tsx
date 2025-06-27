import React, { useState } from 'react';
import { FileExplorer } from '../FileExplorer/FileExplorer';
import { CollaboratorPanel } from '../Collaboration/CollaboratorPanel';
import { FileNode, Collaborator } from '../../types';
import { 
  Files, 
  Users, 
  Upload,
  Plus,
  FolderPlus,
  FilePlus
} from 'lucide-react';

interface SidebarProps {
  files: FileNode[];
  collaborators: Collaborator[];
  onFileSelect: (file: FileNode) => void;
  onFileCreate: (parentId: string | null, name: string, type: 'file' | 'folder') => void;
  onFileDelete: (id: string) => void;
  onFileRename: (id: string, newName: string) => void;
  onUpload: () => void;
  onAddCollaborator: () => void;
  activeFileId?: string;
  isDarkTheme: boolean;
}

type SidebarTab = 'files' | 'collaborators';

export const Sidebar: React.FC<SidebarProps> = ({
  files,
  collaborators,
  onFileSelect,
  onFileCreate,
  onFileDelete,
  onFileRename,
  onUpload,
  onAddCollaborator,
  activeFileId,
  isDarkTheme
}) => {
  const [activeTab, setActiveTab] = useState<SidebarTab>('files');

  const handleCreateFile = () => {
    const name = prompt('File name:');
    if (name) onFileCreate(null, name, 'file');
  };

  const handleCreateFolder = () => {
    const name = prompt('Folder name:');
    if (name) onFileCreate(null, name, 'folder');
  };

  return (
    <div className={`w-64 border-r flex flex-col ${
      isDarkTheme 
        ? 'bg-gray-800 border-gray-700' 
        : 'bg-gray-50 border-gray-200'
    }`}>
      <div className={`flex border-b ${isDarkTheme ? 'border-gray-700' : 'border-gray-200'}`}>
        <button
          onClick={() => setActiveTab('files')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors flex items-center justify-center space-x-2 ${
            activeTab === 'files'
              ? isDarkTheme 
                ? 'text-white bg-gray-700'
                : 'text-gray-900 bg-white'
              : isDarkTheme
                ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <Files size={16} />
          <span>Files</span>
        </button>
        
        <button
          onClick={() => setActiveTab('collaborators')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors flex items-center justify-center space-x-2 ${
            activeTab === 'collaborators'
              ? isDarkTheme 
                ? 'text-white bg-gray-700'
                : 'text-gray-900 bg-white'
              : isDarkTheme
                ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <Users size={16} />
          <span>Team</span>
        </button>
      </div>

      <div className="flex-1 overflow-hidden">
        {activeTab === 'files' && (
          <div className="h-full flex flex-col">
            <div className={`p-3 border-b space-y-2 ${isDarkTheme ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={onUpload}
                  className="px-2 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs transition-colors flex items-center justify-center space-x-1"
                  title="Upload Files"
                >
                  <Upload size={14} />
                  <span>Upload</span>
                </button>
                
                <button
                  onClick={handleCreateFile}
                  className={`px-2 py-2 rounded text-xs transition-colors flex items-center justify-center space-x-1 ${
                    isDarkTheme 
                      ? 'bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white'
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-700 hover:text-gray-900'
                  }`}
                  title="New File"
                >
                  <FilePlus size={14} />
                  <span>File</span>
                </button>
                
                <button
                  onClick={handleCreateFolder}
                  className={`px-2 py-2 rounded text-xs transition-colors flex items-center justify-center space-x-1 ${
                    isDarkTheme 
                      ? 'bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white'
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-700 hover:text-gray-900'
                  }`}
                  title="New Folder"
                >
                  <FolderPlus size={14} />
                  <span>Folder</span>
                </button>
              </div>
            </div>
            <FileExplorer
              files={files}
              onFileSelect={onFileSelect}
              onFileCreate={onFileCreate}
              onFileDelete={onFileDelete}
              onFileRename={onFileRename}
              activeFileId={activeFileId}
              isDarkTheme={isDarkTheme}
            />
          </div>
        )}
        
        {activeTab === 'collaborators' && (
          <CollaboratorPanel
            collaborators={collaborators}
            onAddCollaborator={onAddCollaborator}
            isDarkTheme={isDarkTheme}
          />
        )}
      </div>
    </div>
  );
};