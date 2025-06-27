import debounce from 'lodash.debounce';
import throttle from 'lodash.throttle';

interface PerformanceMetrics {
  renderTime: number;
  syncLatency: number;
  memoryUsage: number;
  cacheHitRate: number;
}

class PerformanceService {
  private metrics: PerformanceMetrics = {
    renderTime: 0,
    syncLatency: 0,
    memoryUsage: 0,
    cacheHitRate: 0
  };

  private cache = new Map<string, any>();
  private cacheHits = 0;
  private cacheMisses = 0;

  // Debounced auto-save (300ms delay)
  debouncedAutoSave = debounce((content: string, fileId: string) => {
    this.autoSave(content, fileId);
  }, 300);

  // Throttled sync updates (100ms max frequency)
  throttledSync = throttle((data: any) => {
    this.syncToServer(data);
  }, 100);

  // Performance monitoring
  measureRenderTime<T>(fn: () => T): T {
    const start = performance.now();
    const result = fn();
    const end = performance.now();
    this.metrics.renderTime = end - start;
    
    // Log slow renders (>16ms for 60fps)
    if (this.metrics.renderTime > 16) {
      console.warn(`Slow render detected: ${this.metrics.renderTime.toFixed(2)}ms`);
    }
    
    return result;
  }

  // Memory usage monitoring
  getMemoryUsage(): number {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return memory.usedJSHeapSize / 1024 / 1024; // MB
    }
    return 0;
  }

  // Cache management
  setCache(key: string, value: any, ttl: number = 300000): void { // 5min default TTL
    this.cache.set(key, {
      value,
      expires: Date.now() + ttl
    });
  }

  getCache(key: string): any {
    const item = this.cache.get(key);
    if (!item) {
      this.cacheMisses++;
      return null;
    }

    if (Date.now() > item.expires) {
      this.cache.delete(key);
      this.cacheMisses++;
      return null;
    }

    this.cacheHits++;
    return item.value;
  }

  getCacheHitRate(): number {
    const total = this.cacheHits + this.cacheMisses;
    return total > 0 ? (this.cacheHits / total) * 100 : 0;
  }

  // Auto-save implementation
  private async autoSave(content: string, fileId: string): Promise<void> {
    try {
      const timestamp = Date.now();
      
      // Save to IndexedDB for offline support
      await this.saveToIndexedDB(fileId, content, timestamp);
      
      // Sync to server if online
      if (navigator.onLine) {
        await this.syncToServer({ fileId, content, timestamp });
      }
      
      console.log(`Auto-saved file ${fileId} at ${new Date(timestamp).toISOString()}`);
    } catch (error) {
      console.error('Auto-save failed:', error);
      this.handleAutoSaveError(fileId, content);
    }
  }

  // IndexedDB storage for offline support
  private async saveToIndexedDB(fileId: string, content: string, timestamp: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('CodeBuddyDB', 1);
      
      request.onerror = () => reject(request.error);
      
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['files'], 'readwrite');
        const store = transaction.objectStore('files');
        
        store.put({
          id: fileId,
          content,
          timestamp,
          synced: false
        });
        
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      };
      
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('files')) {
          const store = db.createObjectStore('files', { keyPath: 'id' });
          store.createIndex('timestamp', 'timestamp');
          store.createIndex('synced', 'synced');
        }
      };
    });
  }

  // Server sync with retry logic
  private async syncToServer(data: any): Promise<void> {
    const maxRetries = 3;
    let retries = 0;
    
    while (retries < maxRetries) {
      try {
        const start = performance.now();
        
        const response = await fetch('/api/sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data)
        });
        
        if (!response.ok) {
          throw new Error(`Sync failed: ${response.status}`);
        }
        
        const end = performance.now();
        this.metrics.syncLatency = end - start;
        
        // Log high latency
        if (this.metrics.syncLatency > 1000) {
          console.warn(`High sync latency: ${this.metrics.syncLatency.toFixed(2)}ms`);
        }
        
        return;
      } catch (error) {
        retries++;
        if (retries >= maxRetries) {
          throw error;
        }
        
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, retries) * 1000));
      }
    }
  }

  // Error handling
  private handleAutoSaveError(fileId: string, content: string): void {
    // Store in localStorage as fallback
    try {
      localStorage.setItem(`backup_${fileId}`, JSON.stringify({
        content,
        timestamp: Date.now()
      }));
      console.log(`Fallback save to localStorage for file ${fileId}`);
    } catch (error) {
      console.error('Fallback save failed:', error);
      // Could implement additional fallback strategies here
    }
  }

  // Performance metrics getter
  getMetrics(): PerformanceMetrics {
    return {
      ...this.metrics,
      memoryUsage: this.getMemoryUsage(),
      cacheHitRate: this.getCacheHitRate()
    };
  }

  // Cleanup
  cleanup(): void {
    this.cache.clear();
    this.cacheHits = 0;
    this.cacheMisses = 0;
  }
}

export const performanceService = new PerformanceService();