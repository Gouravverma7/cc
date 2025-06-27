import React, { useState } from 'react';
import { 
  File, 
  Folder, 
  FolderOpen, 
  MoreVertical,
  Plus,
  Edit,
  Trash,
  FileText
} from 'lucide-react';
import { FileNode } from '../../types';

interface FileTreeNodeProps {
  node: FileNode;
  level: number;
  onSelect: (file: FileNode) => void;
  onCreate: (parentId: string | null, name: string, type: 'file' | 'folder') => void;
  onDelete: (id: string) => void;
  onRename: (id: string, newName: string) => void;
  isActive?: boolean;
  isDarkTheme: boolean;
}

export const FileTreeNode: React.FC<FileTreeNodeProps> = ({
  node,
  level,
  onSelect,
  onCreate,
  onDelete,
  onRename,
  isActive,
  isDarkTheme
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameName, setRenameName] = useState(node.name);

  const handleClick = () => {
    if (node.type === 'folder') {
      setIsExpanded(!isExpanded);
    } else {
      onSelect(node);
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowContextMenu(!showContextMenu);
  };

  const handleRename = () => {
    if (renameName.trim() && renameName !== node.name) {
      onRename(node.id, renameName.trim());
    }
    setIsRenaming(false);
    setShowContextMenu(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRename();
    } else if (e.key === 'Escape') {
      setRenameName(node.name);
      setIsRenaming(false);
    }
  };

  const getFileIcon = () => {
    if (node.type === 'folder') {
      return isExpanded ? <FolderOpen size={16} /> : <Folder size={16} />;
    }
    
    const ext = node.name.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'tsx':
      case 'ts':
        return <FileText size={16} className="text-blue-400" />;
      case 'jsx':
      case 'js':
        return <FileText size={16} className="text-yellow-400" />;
      case 'css':
        return <FileText size={16} className="text-green-400" />;
      case 'json':
        return <FileText size={16} className="text-orange-400" />;
      case 'md':
        return <FileText size={16} className="text-purple-400" />;
      default:
        return <File size={16} />;
    }
  };

  return (
    <div>
      <div
        className={`relative flex items-center px-2 py-1 text-sm cursor-pointer rounded group ${
          isActive 
            ? 'bg-blue-600 text-white' 
            : isDarkTheme
              ? 'text-gray-300 hover:bg-gray-700'
              : 'text-gray-700 hover:bg-gray-100'
        }`}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
      >
        <div className="flex items-center space-x-2 flex-1 min-w-0">
          {getFileIcon()}
          {isRenaming ? (
            <input
              type="text"
              value={renameName}
              onChange={(e) => setRenameName(e.target.value)}
              onBlur={handleRename}
              onKeyDown={handleKeyPress}
              className={`px-1 py-0.5 rounded text-xs flex-1 min-w-0 ${
                isDarkTheme 
                  ? 'bg-gray-600 text-white' 
                  : 'bg-gray-200 text-gray-900'
              }`}
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span className="truncate">{node.name}</span>
          )}
        </div>

        <button
          onClick={handleContextMenu}
          className={`opacity-0 group-hover:opacity-100 p-1 rounded transition-opacity ${
            isDarkTheme ? 'hover:bg-gray-600' : 'hover:bg-gray-200'
          }`}
        >
          <MoreVertical size={12} />
        </button>

        {showContextMenu && (
          <div className={`absolute right-0 top-full mt-1 border rounded shadow-lg z-10 min-w-32 ${
            isDarkTheme 
              ? 'bg-gray-700 border-gray-600' 
              : 'bg-white border-gray-200'
          }`}>
            {node.type === 'folder' && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const name = prompt('File name:');
                    if (name) onCreate(node.id, name, 'file');
                    setShowContextMenu(false);
                  }}
                  className={`w-full px-3 py-2 text-left text-sm flex items-center space-x-2 ${
                    isDarkTheme ? 'hover:bg-gray-600' : 'hover:bg-gray-100'
                  }`}
                >
                  <Plus size={12} />
                  <span>New File</span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const name = prompt('Folder name:');
                    if (name) onCreate(node.id, name, 'folder');
                    setShowContextMenu(false);
                  }}
                  className={`w-full px-3 py-2 text-left text-sm flex items-center space-x-2 ${
                    isDarkTheme ? 'hover:bg-gray-600' : 'hover:bg-gray-100'
                  }`}
                >
                  <Plus size={12} />
                  <span>New Folder</span>
                </button>
                <hr className={isDarkTheme ? 'border-gray-600' : 'border-gray-200'} />
              </>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsRenaming(true);
                setShowContextMenu(false);
              }}
              className={`w-full px-3 py-2 text-left text-sm flex items-center space-x-2 ${
                isDarkTheme ? 'hover:bg-gray-600' : 'hover:bg-gray-100'
              }`}
            >
              <Edit size={12} />
              <span>Rename</span>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (confirm(`Delete ${node.name}?`)) {
                  onDelete(node.id);
                }
                setShowContextMenu(false);
              }}
              className={`w-full px-3 py-2 text-left text-sm text-red-400 flex items-center space-x-2 ${
                isDarkTheme ? 'hover:bg-gray-600' : 'hover:bg-gray-100'
              }`}
            >
              <Trash size={12} />
              <span>Delete</span>
            </button>
          </div>
        )}
      </div>

      {node.type === 'folder' && isExpanded && node.children && (
        <div>
          {node.children.map(child => (
            <FileTreeNode
              key={child.id}
              node={child}
              level={level + 1}
              onSelect={onSelect}
              onCreate={onCreate}
              onDelete={onDelete}
              onRename={onRename}
              isActive={isActive}
              isDarkTheme={isDarkTheme}
            />
          ))}
        </div>
      )}
    </div>
  );
};