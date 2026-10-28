import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function runBackup() {
  console.log('[BACKUP] Starting SQLite database backup...');
  const backupDir = path.resolve(__dirname, '../../prisma');
  const backupFile = path.join(backupDir, 'sqlite-backup.json');

  try {
    const data = {
      timestamp: new Date().toISOString(),
      departments: await prisma.department.findMany(),
      systemSettings: await prisma.systemSetting.findMany(),
      holidays: await prisma.holiday.findMany(),
      halls: await prisma.hall.findMany(),
      users: await prisma.user.findMany(),
      blockedDates: await prisma.blockedDate.findMany(),
      maintenances: await prisma.maintenance.findMany(),
      notifications: await prisma.notification.findMany(),
      activityLogs: await prisma.activityLog.findMany(),
      bookings: await prisma.booking.findMany(),
    };

    fs.writeFileSync(backupFile, JSON.stringify(data, null, 2), 'utf8');

    console.log(`[BACKUP SUCCESS] Successfully saved SQLite backup to: ${backupFile}`);
    console.table({
      Departments: data.departments.length,
      SystemSettings: data.systemSettings.length,
      Holidays: data.holidays.length,
      Halls: data.halls.length,
      Users: data.users.length,
      BlockedDates: data.blockedDates.length,
      Maintenances: data.maintenances.length,
      Notifications: data.notifications.length,
      ActivityLogs: data.activityLogs.length,
      Bookings: data.bookings.length,
    });
  } catch (error) {
    console.error('[BACKUP ERROR] Failed to create SQLite backup:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runBackup();
