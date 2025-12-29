/**
 * Centralized Logger (clog)
 * 
 * Enhanced console logging with:
 * - Debug mode control
 * - Categorized logging methods
 * - Automatic emojis and formatting
 * - Configurable category filtering
 * - Performance optimization
 */

// Category Configuration
const LOG_CATEGORIES = {
  HTTP: { enabled: false, emoji: '🌐', color: '#3B82F6' },
  AUTH: { enabled: false, emoji: '🔐', color: '#10B981' },
  STORE: { enabled: true, emoji: '🗄️', color: '#8B5CF6' },
  ERROR: { enabled: true, emoji: '❌', color: '#EF4444' },
  INFO: { enabled: false, emoji: 'ℹ️', color: '#6366F1' },
  ADMIN: { enabled: true, emoji: '👑', color: '#F59E0B' },
} as const;

type LogCategory = keyof typeof LOG_CATEGORIES;

// Logger Class
class Logger {
  private isDebugMode: boolean;
  private enabledCategories: Set<LogCategory>;

  constructor() {
    this.isDebugMode = process.env.NEXT_PUBLIC_DEBUG_MODE === 'true';
    this.enabledCategories = new Set();
    
    // Enable categories based on environment
    Object.entries(LOG_CATEGORIES).forEach(([category, config]) => {
      if (config.enabled) {
        this.enabledCategories.add(category as LogCategory);
      }
    });

    // In production, only enable ERROR category
    if (process.env.NODE_ENV === 'production') {
      this.enabledCategories.clear();
      this.enabledCategories.add('ERROR');
    }
  }

  /**
   * Core logging method
   */
  private log(category: LogCategory, message: string, ...args: any[]): void {
    if (!this.isDebugMode || !this.enabledCategories.has(category)) {
      return;
    }

    const config = LOG_CATEGORIES[category];
    const timestamp = new Date().toLocaleTimeString();
    const prefix = `${config.emoji} [${category}] ${timestamp}`;
    
    // Apply color styling in browser console
    if (typeof window !== 'undefined' && window.console) {
      console.log(`%c${prefix}`, `color: ${config.color}; font-weight: bold;`, message, ...args);
    } else {
      // Fallback for server-side or when console styling isn't available
      console.log(`${prefix} ${message}`, ...args);
    }
  }

  /**
   * Generic logging method
   */
  public info(message: string, ...args: any[]): void {
    this.log('INFO', message, ...args);
  }

  /**
   * HTTP-related logging
   */
  public http(message: string, ...args: any[]): void {
    this.log('HTTP', message, ...args);
  }

  /**
   * Authentication-related logging
   */
  public auth(message: string, ...args: any[]): void {
    this.log('AUTH', message, ...args);
  }

  /**
   * Store/State management logging
   */
  public store(message: string, ...args: any[]): void {
    this.log('STORE', message, ...args);
  }

  /**
   * Error logging
   */
  public error(message: string, ...args: any[]): void {
    this.log('ERROR', message, ...args);
  }

  /**
   * Admin-related logging
   */
  public admin(message: string, ...args: any[]): void {
    this.log('ADMIN', message, ...args);
  }

  /**
   * Enable/disable specific categories
   */
  public enableCategory(category: LogCategory): void {
    this.enabledCategories.add(category);
  }

  public disableCategory(category: LogCategory): void {
    this.enabledCategories.delete(category);
  }

  /**
   * Check if a category is enabled
   */
  public isCategoryEnabled(category: LogCategory): boolean {
    return this.enabledCategories.has(category);
  }

  /**
   * Get all enabled categories
   */
  public getEnabledCategories(): LogCategory[] {
    return Array.from(this.enabledCategories);
  }

  /**
   * Set debug mode (useful for runtime debugging)
   */
  public setDebugMode(enabled: boolean): void {
    this.isDebugMode = enabled;
  }

  /**
   * Get current debug mode status
   */
  public isDebugEnabled(): boolean {
    return this.isDebugMode;
  }
}

// Create singleton instance
const logger = new Logger();

// Export the clog object with all methods
export const clog = {
  // Generic logging
  info: logger.info.bind(logger),
  
  // Categorized logging
  http: logger.http.bind(logger),
  auth: logger.auth.bind(logger),
  store: logger.store.bind(logger),
  error: logger.error.bind(logger),
  admin: logger.admin.bind(logger),
  
  // Utility methods
  enableCategory: logger.enableCategory.bind(logger),
  disableCategory: logger.disableCategory.bind(logger),
  isCategoryEnabled: logger.isCategoryEnabled.bind(logger),
  getEnabledCategories: logger.getEnabledCategories.bind(logger),
  setDebugMode: logger.setDebugMode.bind(logger),
  isDebugEnabled: logger.isDebugEnabled.bind(logger),
};

// Export types
export type { LogCategory };

// Export default for convenience
export default clog;

