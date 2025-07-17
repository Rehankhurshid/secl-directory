import { log } from "../vite";

export class StartupService {
  private startupMetrics: Map<string, number> = new Map();
  private startupStartTime: number;

  constructor() {
    this.startupStartTime = Date.now();
  }

  markStartupEvent(event: string): void {
    const elapsed = Date.now() - this.startupStartTime;
    this.startupMetrics.set(event, elapsed);
    log(`Startup event "${event}" completed in ${elapsed}ms`, "startup");
  }

  getStartupMetrics(): Record<string, number> {
    return Object.fromEntries(this.startupMetrics);
  }

  getStartupDuration(): number {
    return Date.now() - this.startupStartTime;
  }

  async measureAsync<T>(event: string, fn: () => Promise<T>): Promise<T> {
    const start = Date.now();
    try {
      const result = await fn();
      const duration = Date.now() - start;
      log(`Async operation "${event}" completed in ${duration}ms`, "startup");
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      log(`Async operation "${event}" failed after ${duration}ms: ${error}`, "startup");
      throw error;
    }
  }

  measureSync<T>(event: string, fn: () => T): T {
    const start = Date.now();
    try {
      const result = fn();
      const duration = Date.now() - start;
      log(`Sync operation "${event}" completed in ${duration}ms`, "startup");
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      log(`Sync operation "${event}" failed after ${duration}ms: ${error}`, "startup");
      throw error;
    }
  }

  logStartupComplete(): void {
    const totalDuration = this.getStartupDuration();
    const metrics = this.getStartupMetrics();
    
    log(`=== STARTUP COMPLETE ===`, "startup");
    log(`Total startup time: ${totalDuration}ms`, "startup");
    log(`Startup metrics:`, "startup");
    
    for (const [event, time] of Object.entries(metrics)) {
      log(`  ${event}: ${time}ms`, "startup");
    }
    
    log(`========================`, "startup");
  }
}

export const startupService = new StartupService();