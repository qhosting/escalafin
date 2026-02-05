
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const readdir = promisify(fs.readdir);
const unlink = promisify(fs.unlink);
const stat = promisify(fs.stat);

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization');
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const report = {
            logsDeleted: 0,
            backupsDeleted: 0
        };

        // 1. Clean cleanup_logs (> 7 days)
        const logDir = path.join(process.cwd(), 'cleanup_logs');
        if (fs.existsSync(logDir)) {
            const files = await readdir(logDir);
            for (const file of files) {
                if (!file.endsWith('.log')) continue;
                const filePath = path.join(logDir, file);
                const stats = await stat(filePath);
                const ageDays = (Date.now() - stats.mtimeMs) / (1000 * 60 * 60 * 24);

                if (ageDays > 7) {
                    await unlink(filePath);
                    report.logsDeleted++;
                }
            }
        }

        // 2. Clean local backups (> 2 days)
        // Backups should be uploaded to Drive immediately, keep local only for short retry safety
        const backupDir = path.join(process.cwd(), 'backups');
        if (fs.existsSync(backupDir)) {
            const files = await readdir(backupDir);
            for (const file of files) {
                const filePath = path.join(backupDir, file);
                const stats = await stat(filePath);
                const ageDays = (Date.now() - stats.mtimeMs) / (1000 * 60 * 60 * 24);

                if (ageDays > 2) {
                    await unlink(filePath);
                    report.backupsDeleted++;
                }
            }
        }

        return NextResponse.json({
            success: true,
            message: 'Limpieza completada',
            report
        });

    } catch (error) {
        console.error('[Cron] Cleanup error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
