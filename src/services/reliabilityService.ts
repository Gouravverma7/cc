interface BackupData {
  id: string;
  content: string;
  timestamp: number;
  version: number;
  checksum: string;
}

interface RecoveryState {
  lastSaved: number;
  unsavedChanges: boolean;
  backupCount: number;
  crashDetected: boolean;
}

class ReliabilityService {
  private backupInterval: number = 30000; // 30 seconds
  private maxBackups: number = 10;
  private backupTimer: NodeJS.Timeout | null = null;
  private recoveryState: RecoveryState = {
    lastSaved: 0,
    unsavedChanges: false,
    backupCount: 0,
    crashDetected: false
  };

  constructor() {
    this.initializeRecovery();
    this.setupBeforeUnloadHandler();
    this.setupVisibilityChangeHandler();
  }

  // Initialize crash recovery system
  private initializeRecovery(): void {
    // Check for previous crash
    const crashFlag = localStorage.getItem('codebuddy_crash_flag');
    if (crashFlag) {
      this.recoveryState.crashDetected = true;
      console.warn('Previous session crash detected, initiating recovery...');
      this.recoverFromCrash();
    }

    // Set crash detection flag
    localStorage.setItem('codebuddy_crash_flag', 'true');
    
    // Clear flag on normal shutdown
    window.addEventListener('beforeunload', () => {
      localStorage.removeItem('codebuddy_crash_flag');
    });
  }

  // Auto-backup system
  startAutoBackup(getDataCallback: () => any): void {
    this.stopAutoBackup(); // Clear existing timer
    
    this.backupTimer = setInterval(async () => {
      try {
        const data = getDataCallback();
        await this.createBackup(data);
        this.recoveryState.lastSaved = Date.now();
        this.recoveryState.unsavedChanges = false;
      } catch (error) {
        console.error('Auto-backup failed:', error);
      }
    }, this.backupInterval);
  }

  stopAutoBackup(): void {
    if (this.backupTimer) {
      clearInterval(this.backupTimer);
      this.backupTimer = null;
    }
  }

  // Create backup with versioning
  async createBackup(data: any): Promise<void> {
    try {
      const backup: BackupData = {
        id: `backup_${Date.now()}`,
        content: JSON.stringify(data),
        timestamp: Date.now(),
        version: this.recoveryState.backupCount + 1,
        checksum: await this.generateChecksum(JSON.stringify(data))
      };

      // Store in IndexedDB
      await this.storeBackup(backup);
      
      // Update recovery state
      this.recoveryState.backupCount++;
      this.updateRecoveryState();
      
      // Clean old backups
      await this.cleanOldBackups();
      
      console.log(`Backup created: ${backup.id} (v${backup.version})`);
    } catch (error) {
      console.error('Backup creation failed:', error);
      throw error;
    }
  }

  // Store backup in IndexedDB
  private async storeBackup(backup: BackupData): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('CodeBuddyBackups', 1);
      
      request.onerror = () => reject(request.error);
      
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['backups'], 'readwrite');
        const store = transaction.objectStore('backups');
        
        store.put(backup);
        
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      };
      
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('backups')) {
          const store = db.createObjectStore('backups', { keyPath: 'id' });
          store.createIndex('timestamp', 'timestamp');
          store.createIndex('version', 'version');
        }
      };
    });
  }

  // Recover from crash
  private async recoverFromCrash(): Promise<any> {
    try {
      const backups = await this.getBackups();
      
      if (backups.length === 0) {
        console.log('No backups found for recovery');
        return null;
      }

      // Get latest backup
      const latestBackup = backups.sort((a, b) => b.timestamp - a.timestamp)[0];
      
      // Verify backup integrity
      const isValid = await this.verifyBackup(latestBackup);
      if (!isValid) {
        console.error('Latest backup is corrupted, trying previous backup...');
        return this.recoverFromBackup(backups[1]);
      }

      console.log(`Recovering from backup: ${latestBackup.id}`);
      return this.recoverFromBackup(latestBackup);
      
    } catch (error) {
      console.error('Crash recovery failed:', error);
      return null;
    }
  }

  // Recover from specific backup
  private async recoverFromBackup(backup: BackupData): Promise<any> {
    try {
      const data = JSON.parse(backup.content);
      
      // Validate recovered data
      if (!this.validateRecoveredData(data)) {
        throw new Error('Recovered data validation failed');
      }

      console.log(`Successfully recovered from backup v${backup.version}`);
      return data;
      
    } catch (error) {
      console.error('Backup recovery failed:', error);
      throw error;
    }
  }

  // Get all backups
  private async getBackups(): Promise<BackupData[]> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('CodeBuddyBackups', 1);
      
      request.onerror = () => reject(request.error);
      
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['backups'], 'readonly');
        const store = transaction.objectStore('backups');
        const getAllRequest = store.getAll();
        
        getAllRequest.onsuccess = () => resolve(getAllRequest.result);
        getAllRequest.onerror = () => reject(getAllRequest.error);
      };
    });
  }

  // Clean old backups
  private async cleanOldBackups(): Promise<void> {
    try {
      const backups = await this.getBackups();
      
      if (backups.length <= this.maxBackups) return;

      // Sort by timestamp and keep only latest backups
      const sortedBackups = backups.sort((a, b) => b.timestamp - a.timestamp);
      const backupsToDelete = sortedBackups.slice(this.maxBackups);

      for (const backup of backupsToDelete) {
        await this.deleteBackup(backup.id);
      }

      console.log(`Cleaned ${backupsToDelete.length} old backups`);
    } catch (error) {
      console.error('Backup cleanup failed:', error);
    }
  }

  // Delete backup
  private async deleteBackup(backupId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('CodeBuddyBackups', 1);
      
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['backups'], 'readwrite');
        const store = transaction.objectStore('backups');
        
        const deleteRequest = store.delete(backupId);
        deleteRequest.onsuccess = () => resolve();
        deleteRequest.onerror = () => reject(deleteRequest.error);
      };
    });
  }

  // Generate checksum for data integrity
  private async generateChecksum(data: string): Promise<string> {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // Verify backup integrity
  private async verifyBackup(backup: BackupData): Promise<boolean> {
    try {
      const calculatedChecksum = await this.generateChecksum(backup.content);
      return calculatedChecksum === backup.checksum;
    } catch (error) {
      console.error('Backup verification failed:', error);
      return false;
    }
  }

  // Validate recovered data structure
  private validateRecoveredData(data: any): boolean {
    // Basic validation - extend based on your data structure
    return data && 
           typeof data === 'object' &&
           data.files &&
           Array.isArray(data.files);
  }

  // Setup beforeunload handler for graceful shutdown
  private setupBeforeUnloadHandler(): void {
    window.addEventListener('beforeunload', (event) => {
      if (this.recoveryState.unsavedChanges) {
        const message = 'You have unsaved changes. Are you sure you want to leave?';
        event.returnValue = message;
        return message;
      }
    });
  }

  // Setup visibility change handler for background saving
  private setupVisibilityChangeHandler(): void {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.recoveryState.unsavedChanges) {
        // Save when tab becomes hidden
        console.log('Tab hidden, triggering emergency save...');
        // Trigger immediate backup
      }
    });
  }

  // Update recovery state
  private updateRecoveryState(): void {
    localStorage.setItem('codebuddy_recovery_state', JSON.stringify(this.recoveryState));
  }

  // Mark changes as unsaved
  markUnsavedChanges(): void {
    this.recoveryState.unsavedChanges = true;
    this.updateRecoveryState();
  }

  // Get recovery state
  getRecoveryState(): RecoveryState {
    return { ...this.recoveryState };
  }

  // Check if crash recovery is available
  isCrashRecoveryAvailable(): boolean {
    return this.recoveryState.crashDetected;
  }

  // Manual recovery trigger
  async triggerRecovery(): Promise<any> {
    return this.recoverFromCrash();
  }

  // Cleanup
  cleanup(): void {
    this.stopAutoBackup();
    localStorage.removeItem('codebuddy_crash_flag');
    localStorage.removeItem('codebuddy_recovery_state');
  }
}

export const reliabilityService = new ReliabilityService();