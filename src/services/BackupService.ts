import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';
import { createWriteStream } from 'fs';
import { performanceMonitor } from '../utils/performance';

const execAsync = promisify(exec);

interface BackupConfig {
  mongoUri: string;
  backupDir: string;
  retentionDays: number;
  compressionEnabled: boolean;
}

interface BackupResult {
  success: boolean;
  backupPath?: string;
  size?: number;
  duration: number;
  error?: string;
}

class DatabaseBackupService {
  private config: BackupConfig;

  constructor(config: BackupConfig) {
    this.config = config;
  }

  /**
   * Create a full database backup
   */
  async createBackup(): Promise<BackupResult> {
    const startTime = Date.now();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupName = `gamekey-backup-${timestamp}`;
    const backupPath = path.join(this.config.backupDir, backupName);

    try {
      // Ensure backup directory exists
      await fs.mkdir(this.config.backupDir, { recursive: true });

      // Create mongodump command
      const dumpCommand = this.buildMongoDumpCommand(backupPath);
      
      console.log(`🔄 Starting database backup: ${backupName}`);
      
      // Execute backup with performance monitoring
      await performanceMonitor.monitor('backup.database', async () => {
        const { stdout, stderr } = await execAsync(dumpCommand);
        
        if (stderr && !stderr.includes('writing')) {
          console.warn('Backup warning:', stderr);
        }
        
        console.log('Backup output:', stdout);
      });

      // Compress backup if enabled
      let finalBackupPath = backupPath;
      if (this.config.compressionEnabled) {
        finalBackupPath = await this.compressBackup(backupPath);
      }

      // Get backup size
      const stats = await fs.stat(finalBackupPath);
      const duration = Date.now() - startTime;

      console.log(`✅ Backup completed: ${finalBackupPath} (${this.formatBytes(stats.size)}) in ${duration}ms`);

      // Clean old backups
      await this.cleanOldBackups();

      return {
        success: true,
        backupPath: finalBackupPath,
        size: stats.size,
        duration
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      console.error('❌ Backup failed:', errorMessage);
      
      return {
        success: false,
        duration,
        error: errorMessage
      };
    }
  }

  /**
   * Restore database from backup
   */
  async restoreBackup(backupPath: string): Promise<BackupResult> {
    const startTime = Date.now();

    try {
      console.log(`🔄 Starting database restore from: ${backupPath}`);

      // Check if backup file exists
      await fs.access(backupPath);

      // Decompress if needed
      let restorePath = backupPath;
      if (backupPath.endsWith('.tar.gz')) {
        restorePath = await this.decompressBackup(backupPath);
      }

      // Create mongorestore command
      const restoreCommand = this.buildMongoRestoreCommand(restorePath);
      
      // Execute restore
      await performanceMonitor.monitor('restore.database', async () => {
        const { stdout, stderr } = await execAsync(restoreCommand);
        
        if (stderr && !stderr.includes('restoring')) {
          console.warn('Restore warning:', stderr);
        }
        
        console.log('Restore output:', stdout);
      });

      const duration = Date.now() - startTime;
      console.log(`✅ Restore completed in ${duration}ms`);

      return {
        success: true,
        duration
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      console.error('❌ Restore failed:', errorMessage);
      
      return {
        success: false,
        duration,
        error: errorMessage
      };
    }
  }

  /**
   * List all available backups
   */
  async listBackups(): Promise<Array<{
    name: string;
    path: string;
    size: number;
    created: Date;
  }>> {
    try {
      const files = await fs.readdir(this.config.backupDir);
      const backups = [];

      for (const file of files) {
        if (file.startsWith('gamekey-backup-')) {
          const filePath = path.join(this.config.backupDir, file);
          const stats = await fs.stat(filePath);
          
          backups.push({
            name: file,
            path: filePath,
            size: stats.size,
            created: stats.birthtime
          });
        }
      }

      return backups.sort((a, b) => b.created.getTime() - a.created.getTime());
    } catch (error) {
      console.error('Error listing backups:', error);
      return [];
    }
  }

  /**
   * Delete a specific backup
   */
  async deleteBackup(backupPath: string): Promise<boolean> {
    try {
      await fs.unlink(backupPath);
      console.log(`🗑️ Deleted backup: ${backupPath}`);
      return true;
    } catch (error) {
      console.error('Error deleting backup:', error);
      return false;
    }
  }

  /**
   * Schedule automatic backups
   */
  scheduleBackups(intervalHours = 24): NodeJS.Timeout {
    const intervalMs = intervalHours * 60 * 60 * 1000;
    
    console.log(`📅 Scheduling automatic backups every ${intervalHours} hours`);
    
    return setInterval(async () => {
      console.log('🕐 Starting scheduled backup...');
      const result = await this.createBackup();
      
      if (result.success) {
        console.log('✅ Scheduled backup completed successfully');
      } else {
        console.error('❌ Scheduled backup failed:', result.error);
      }
    }, intervalMs);
  }

  /**
   * Build mongodump command
   */
  private buildMongoDumpCommand(outputPath: string): string {
    const uri = this.config.mongoUri;
    return `mongodump --uri="${uri}" --out="${outputPath}"`;
  }

  /**
   * Build mongorestore command
   */
  private buildMongoRestoreCommand(inputPath: string): string {
    const uri = this.config.mongoUri;
    return `mongorestore --uri="${uri}" --drop "${inputPath}"`;
  }

  /**
   * Compress backup directory
   */
  private async compressBackup(backupPath: string): Promise<string> {
    const compressedPath = `${backupPath}.tar.gz`;
    const command = `tar -czf "${compressedPath}" -C "${path.dirname(backupPath)}" "${path.basename(backupPath)}"`;
    
    await execAsync(command);
    
    // Remove uncompressed directory
    await execAsync(`rm -rf "${backupPath}"`);
    
    return compressedPath;
  }

  /**
   * Decompress backup archive
   */
  private async decompressBackup(compressedPath: string): Promise<string> {
    const extractPath = compressedPath.replace('.tar.gz', '');
    const command = `tar -xzf "${compressedPath}" -C "${path.dirname(compressedPath)}"`;
    
    await execAsync(command);
    
    return extractPath;
  }

  /**
   * Clean old backups based on retention policy
   */
  private async cleanOldBackups(): Promise<void> {
    try {
      const backups = await this.listBackups();
      const cutoffDate = new Date(Date.now() - (this.config.retentionDays * 24 * 60 * 60 * 1000));

      for (const backup of backups) {
        if (backup.created < cutoffDate) {
          await this.deleteBackup(backup.path);
        }
      }
    } catch (error) {
      console.error('Error cleaning old backups:', error);
    }
  }

  /**
   * Format bytes to human readable format
   */
  private formatBytes(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Byte';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Verify backup integrity
   */
  async verifyBackup(backupPath: string): Promise<boolean> {
    try {
      // Check if file exists and is readable
      await fs.access(backupPath, fs.constants.R_OK);
      
      // Get file stats
      const stats = await fs.stat(backupPath);
      
      // Basic checks
      if (stats.size === 0) {
        console.error('Backup file is empty');
        return false;
      }

      // For compressed backups, test decompression
      if (backupPath.endsWith('.tar.gz')) {
        const testCommand = `tar -tzf "${backupPath}" > /dev/null`;
        await execAsync(testCommand);
      }

      console.log(`✅ Backup verification passed: ${backupPath}`);
      return true;
    } catch (error) {
      console.error('❌ Backup verification failed:', error);
      return false;
    }
  }
}

// Default configuration
const defaultConfig: BackupConfig = {
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/gamekey',
  backupDir: process.env.BACKUP_DIR || './backups',
  retentionDays: parseInt(process.env.BACKUP_RETENTION_DAYS || '7'),
  compressionEnabled: process.env.BACKUP_COMPRESSION !== 'false'
};

// Export singleton instance
export const backupService = new DatabaseBackupService(defaultConfig);

// Export class for custom configurations
export { DatabaseBackupService, BackupConfig, BackupResult };