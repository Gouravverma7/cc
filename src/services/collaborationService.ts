import { io, Socket } from 'socket.io-client';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { MonacoBinding } from 'y-monaco';

interface CollaborationUser {
  id: string;
  name: string;
  avatar: string;
  cursor?: {
    line: number;
    column: number;
  };
  selection?: {
    startLine: number;
    startColumn: number;
    endLine: number;
    endColumn: number;
  };
  color: string;
}

interface RoomState {
  users: Map<string, CollaborationUser>;
  activeFile: string | null;
  isConnected: boolean;
}

class CollaborationService {
  private socket: Socket | null = null;
  private ydoc: Y.Doc | null = null;
  private provider: WebsocketProvider | null = null;
  private binding: MonacoBinding | null = null;
  private roomId: string | null = null;
  private userId: string;
  private state: RoomState = {
    users: new Map(),
    activeFile: null,
    isConnected: false
  };

  private callbacks: {
    onUserJoin?: (user: CollaborationUser) => void;
    onUserLeave?: (userId: string) => void;
    onCursorMove?: (userId: string, cursor: any) => void;
    onFileChange?: (fileId: string, content: string) => void;
    onConnectionChange?: (isConnected: boolean) => void;
  } = {};

  constructor() {
    this.userId = this.generateUserId();
  }

  // Initialize collaboration for a room
  async initializeRoom(roomId: string, user: Omit<CollaborationUser, 'id' | 'color'>): Promise<void> {
    this.roomId = roomId;
    
    try {
      // Initialize Yjs document
      this.ydoc = new Y.Doc();
      
      // Setup WebSocket provider for real-time sync
      this.provider = new WebsocketProvider(
        process.env.NODE_ENV === 'production' 
          ? 'wss://api.codebuddy.ai/collaboration'
          : 'ws://localhost:3001/collaboration',
        roomId,
        this.ydoc
      );

      // Initialize Socket.IO for presence and cursor tracking
      this.socket = io(
        process.env.NODE_ENV === 'production'
          ? 'https://api.codebuddy.ai'
          : 'http://localhost:3001',
        {
          transports: ['websocket', 'polling'],
          timeout: 5000,
          retries: 3
        }
      );

      this.setupSocketListeners();
      
      // Join room with user info
      this.socket.emit('join-room', {
        roomId,
        user: {
          ...user,
          id: this.userId,
          color: this.generateUserColor()
        }
      });

      this.state.isConnected = true;
      this.callbacks.onConnectionChange?.(true);
      
    } catch (error) {
      console.error('Failed to initialize collaboration:', error);
      this.handleConnectionError();
    }
  }

  // Bind Monaco editor for collaborative editing
  bindEditor(editor: any, fileId: string): void {
    if (!this.ydoc) return;

    // Create or get shared text for this file
    const ytext = this.ydoc.getText(fileId);
    
    // Create Monaco binding
    this.binding = new MonacoBinding(
      ytext,
      editor.getModel(),
      new Set([editor]),
      this.provider?.awareness
    );

    this.state.activeFile = fileId;

    // Track cursor movements
    editor.onDidChangeCursorPosition((e: any) => {
      this.broadcastCursor(e.position);
    });

    // Track selections
    editor.onDidChangeCursorSelection((e: any) => {
      this.broadcastSelection(e.selection);
    });
  }

  // Broadcast cursor position
  private broadcastCursor(position: { lineNumber: number; column: number }): void {
    if (!this.socket || !this.roomId) return;

    this.socket.emit('cursor-move', {
      roomId: this.roomId,
      userId: this.userId,
      cursor: {
        line: position.lineNumber,
        column: position.column
      }
    });
  }

  // Broadcast selection
  private broadcastSelection(selection: any): void {
    if (!this.socket || !this.roomId) return;

    this.socket.emit('selection-change', {
      roomId: this.roomId,
      userId: this.userId,
      selection: {
        startLine: selection.startLineNumber,
        startColumn: selection.startColumn,
        endLine: selection.endLineNumber,
        endColumn: selection.endColumn
      }
    });
  }

  // Setup socket event listeners
  private setupSocketListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Connected to collaboration server');
      this.state.isConnected = true;
      this.callbacks.onConnectionChange?.(true);
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from collaboration server');
      this.state.isConnected = false;
      this.callbacks.onConnectionChange?.(false);
    });

    this.socket.on('user-joined', (user: CollaborationUser) => {
      this.state.users.set(user.id, user);
      this.callbacks.onUserJoin?.(user);
    });

    this.socket.on('user-left', (userId: string) => {
      this.state.users.delete(userId);
      this.callbacks.onUserLeave?.(userId);
    });

    this.socket.on('cursor-moved', ({ userId, cursor }) => {
      const user = this.state.users.get(userId);
      if (user) {
        user.cursor = cursor;
        this.callbacks.onCursorMove?.(userId, cursor);
      }
    });

    this.socket.on('selection-changed', ({ userId, selection }) => {
      const user = this.state.users.get(userId);
      if (user) {
        user.selection = selection;
      }
    });

    this.socket.on('file-changed', ({ fileId, content, userId }) => {
      if (userId !== this.userId) {
        this.callbacks.onFileChange?.(fileId, content);
      }
    });

    // Handle connection errors
    this.socket.on('connect_error', (error) => {
      console.error('Collaboration connection error:', error);
      this.handleConnectionError();
    });
  }

  // Handle connection errors with retry logic
  private handleConnectionError(): void {
    this.state.isConnected = false;
    this.callbacks.onConnectionChange?.(false);

    // Implement exponential backoff retry
    let retryCount = 0;
    const maxRetries = 5;
    
    const retry = () => {
      if (retryCount >= maxRetries) {
        console.error('Max collaboration retries reached');
        return;
      }

      setTimeout(() => {
        retryCount++;
        console.log(`Retrying collaboration connection (${retryCount}/${maxRetries})`);
        
        if (this.socket) {
          this.socket.connect();
        }
      }, Math.pow(2, retryCount) * 1000);
    };

    retry();
  }

  // Event listeners
  onUserJoin(callback: (user: CollaborationUser) => void): void {
    this.callbacks.onUserJoin = callback;
  }

  onUserLeave(callback: (userId: string) => void): void {
    this.callbacks.onUserLeave = callback;
  }

  onCursorMove(callback: (userId: string, cursor: any) => void): void {
    this.callbacks.onCursorMove = callback;
  }

  onFileChange(callback: (fileId: string, content: string) => void): void {
    this.callbacks.onFileChange = callback;
  }

  onConnectionChange(callback: (isConnected: boolean) => void): void {
    this.callbacks.onConnectionChange = callback;
  }

  // Utility methods
  private generateUserId(): string {
    return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateUserColor(): string {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
      '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  // Getters
  getUsers(): CollaborationUser[] {
    return Array.from(this.state.users.values());
  }

  isConnected(): boolean {
    return this.state.isConnected;
  }

  getCurrentUserId(): string {
    return this.userId;
  }

  // Cleanup
  disconnect(): void {
    if (this.binding) {
      this.binding.destroy();
      this.binding = null;
    }

    if (this.provider) {
      this.provider.destroy();
      this.provider = null;
    }

    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    if (this.ydoc) {
      this.ydoc.destroy();
      this.ydoc = null;
    }

    this.state = {
      users: new Map(),
      activeFile: null,
      isConnected: false
    };
  }
}

export const collaborationService = new CollaborationService();