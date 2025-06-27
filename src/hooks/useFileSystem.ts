import { useState, useCallback } from 'react';
import { FileNode } from '../types';

const initialFiles: FileNode[] = [
  {
    id: '1',
    name: 'src',
    type: 'folder',
    path: '/src',
    children: [
      {
        id: '2',
        name: 'App.tsx',
        type: 'file',
        path: '/src/App.tsx',
        language: 'typescript',
        content: `import React from 'react';

function App() {
  return (
    <div className="App">
      <h1>Welcome to CodeBuddy.Ai</h1>
      <p>Start coding with AI assistance!</p>
    </div>
  );
}

export default App;`
      },
      {
        id: '3',
        name: 'index.css',
        type: 'file',
        path: '/src/index.css',
        language: 'css',
        content: `body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}`
      }
    ]
  },
  {
    id: '4',
    name: 'package.json',
    type: 'file',
    path: '/package.json',
    language: 'json',
    content: `{
  "name": "my-app",
  "version": "1.0.0",
  "dependencies": {
    "react": "^18.0.0"
  }
}`
  },
  {
    id: '5',
    name: 'README.md',
    type: 'file',
    path: '/README.md',
    language: 'markdown',
    content: `# My Project

This is a sample project created with CodeBuddy.Ai

## Getting Started

Start coding and use the AI assistant for help!`
  }
];

export const useFileSystem = () => {
  const [files, setFiles] = useState<FileNode[]>(initialFiles);

  const findFileById = useCallback((id: string, nodes: FileNode[] = files): FileNode | null => {
    for (const node of nodes) {
      if (node.id === id) return node;
      if (node.children) {
        const found = findFileById(id, node.children);
        if (found) return found;
      }
    }
    return null;
  }, [files]);

  const createFile = useCallback((parentId: string | null, name: string, type: 'file' | 'folder') => {
    const newId = Date.now().toString();
    const newNode: FileNode = {
      id: newId,
      name,
      type,
      path: parentId ? `${findFileById(parentId)?.path}/${name}` : `/${name}`,
      content: type === 'file' ? '' : undefined,
      children: type === 'folder' ? [] : undefined,
      language: type === 'file' ? getLanguageFromExtension(name) : undefined
    };

    setFiles(prev => {
      if (!parentId) {
        return [...prev, newNode];
      }

      const updateNode = (nodes: FileNode[]): FileNode[] =>
        nodes.map(node => {
          if (node.id === parentId && node.type === 'folder') {
            return {
              ...node,
              children: [...(node.children || []), newNode]
            };
          }
          if (node.children) {
            return { ...node, children: updateNode(node.children) };
          }
          return node;
        });

      return updateNode(prev);
    });

    return newId;
  }, [findFileById]);

  const deleteFile = useCallback((id: string) => {
    setFiles(prev => {
      const filterNode = (nodes: FileNode[]): FileNode[] =>
        nodes.filter(node => {
          if (node.id === id) return false;
          if (node.children) {
            return { ...node, children: filterNode(node.children) };
          }
          return true;
        }).map(node => 
          node.children ? { ...node, children: filterNode(node.children) } : node
        );

      return filterNode(prev);
    });
  }, []);

  const renameFile = useCallback((id: string, newName: string) => {
    setFiles(prev => {
      const updateNode = (nodes: FileNode[]): FileNode[] =>
        nodes.map(node => {
          if (node.id === id) {
            const pathParts = node.path.split('/');
            pathParts[pathParts.length - 1] = newName;
            return {
              ...node,
              name: newName,
              path: pathParts.join('/'),
              language: node.type === 'file' ? getLanguageFromExtension(newName) : undefined
            };
          }
          if (node.children) {
            return { ...node, children: updateNode(node.children) };
          }
          return node;
        });

      return updateNode(prev);
    });
  }, []);

  const updateFileContent = useCallback((id: string, content: string) => {
    setFiles(prev => {
      const updateNode = (nodes: FileNode[]): FileNode[] =>
        nodes.map(node => {
          if (node.id === id && node.type === 'file') {
            return { ...node, content };
          }
          if (node.children) {
            return { ...node, children: updateNode(node.children) };
          }
          return node;
        });

      return updateNode(prev);
    });
  }, []);

  return {
    files,
    findFileById,
    createFile,
    deleteFile,
    renameFile,
    updateFileContent
  };
};

const getLanguageFromExtension = (filename: string): string => {
  const ext = filename.split('.').pop()?.toLowerCase();
  const languageMap: Record<string, string> = {
    'ts': 'typescript',
    'tsx': 'typescript',
    'js': 'javascript',
    'jsx': 'javascript',
    'py': 'python',
    'java': 'java',
    'cpp': 'cpp',
    'c': 'c',
    'css': 'css',
    'html': 'html',
    'json': 'json',
    'md': 'markdown',
    'yml': 'yaml',
    'yaml': 'yaml',
    'xml': 'xml',
    'sql': 'sql'
  };
  return languageMap[ext || ''] || 'plaintext';
};