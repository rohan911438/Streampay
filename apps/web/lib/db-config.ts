/**
 * Database Configuration Utility
 * Tracks database availability to prevent repeated connection attempts
 * when the database is known to be offline.
 */

class DatabaseConfig {
  private static instance: DatabaseConfig;
  private postgresAvailable: boolean = true;
  private hasChecked: boolean = false;

  private constructor() {}

  public static getInstance(): DatabaseConfig {
    if (!DatabaseConfig.instance) {
      DatabaseConfig.instance = new DatabaseConfig();
    }
    return DatabaseConfig.instance;
  }

  /**
   * Returns true if Postgres should be attempted.
   */
  public shouldTryPostgres(): boolean {
    // During development, if it's already failed once, don't try again to keep logs clean
    return this.postgresAvailable;
  }

  /**
   * Call this when a Postgres connection fails.
   */
  public markPostgresAsUnavailable(): void {
    if (this.postgresAvailable) {
      console.log("\x1b[33m%s\x1b[0m", "[Database] Status: Postgres unreachable. Running in Local Mode (JSON DB).");
      this.postgresAvailable = false;
    }
    this.hasChecked = true;
  }

  /**
   * Reset the availability (e.g. if we want to retry)
   */
  public reset(): void {
    this.postgresAvailable = true;
    this.hasChecked = false;
  }
}

export const dbConfig = DatabaseConfig.getInstance();
