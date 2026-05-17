import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

export interface AuditEvent {
  action: string;
  userId?: string;
  userEmail?: string;
  userRole?: string;
  method?: string;
  path?: string;
  statusCode?: number;
  durationMs?: number;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class AuditService {
  private readonly filePath =
    process.env.AUDIT_LOG_PATH ||
    path.join(process.cwd(), 'audit-logs', 'audit.jsonl');

  async record(event: AuditEvent): Promise<void> {
    const entry = {
      timestamp: new Date().toISOString(),
      ...event,
    };

    await fs.promises.mkdir(path.dirname(this.filePath), { recursive: true });
    await fs.promises.appendFile(
      this.filePath,
      `${JSON.stringify(entry)}\n`,
      'utf-8',
    );
  }
}
