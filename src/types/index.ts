export interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  content?: string;
  children?: FileNode[];
  path: string;
  language?: string;
}

export interface Tab {
  id: string;
  name: string;
  path: string;
  content: string;
  language: string;
  isDirty: boolean;
}

export interface Collaborator {
  id: string;
  name: string;
  avatar: string;
  cursor?: {
    line: number;
    column: number;
  };
  isOnline: boolean;
}

export interface AIMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface Terminal {
  id: string;
  name: string;
  isActive: boolean;
}

export interface GitHubUser {
  login: string;
  name: string;
  avatar_url: string;
}

export interface CodeExecutionResult {
  success: boolean;
  output: string;
  error: string;
}