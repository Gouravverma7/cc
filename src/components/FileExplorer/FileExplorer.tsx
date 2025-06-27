import React from 'react';
import { FileNode } from '../../types';
import { FileTreeNode } from './FileTreeNode';

interface FileExplorerProps {
  files: FileNode[];
  onFileSelect: (file: FileNode) => void;
  onFileCreate: (parentId: string | null, name: string, type: 'file' | 'folder') => void;
  onFileDelete: (id: string) => void;
  onFileRename: (id: string, newName: string) => void;
  activeFileId?: string;
  isDarkTheme: boolean;
}

export const FileExplorer: React.FC<FileExplorerProps> = ({
  files,
  onFileSelect,
  onFileCreate,
  onFileDelete,
  onFileRename,
  activeFileId,
  isDarkTheme
}) => {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-2">
        {files.map(file => (
          <FileTreeNode
            key={file.id}
            node={file}
            level={0}
            onSelect={onFileSelect}
            onCreate={onFileCreate}
            onDelete={onFileDelete}
            onRename={onFileRename}
            isActive={activeFileId === file.id}
            isDarkTheme={isDarkTheme}
          />
        ))}
      </div>
    </div>
  );
};