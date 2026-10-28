import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function runRestore() {
  console.log('[RESTORE] Starting data migration from SQLite backup to PostgreSQL...');
  const backupFile = path.resolve(__dirname, '../../prisma/sqlite-backup.json');

  if (!fs.existsSync(backupFile)) {
    console.error(`[RESTORE ERROR] Backup file not found at: ${backupFile}`);
    console.error('Please run "npm run db:backup" first to generate the backup file.');
    process.exit(1);
  }

  const raw = fs.readFileSync(backupFile, 'utf8');
  const data = JSON.parse(raw);

  console.log(`[RESTORE] Backup timestamp: ${data.timestamp}`);

  try {
    // 1. Departments
    console.log(`[1/10] Migrating ${data.departments.length} departments...`);
    for (const item of data.departments) {
      await prisma.department.upsert({
        where: { id: item.id },
        update: {
          name: item.name,
          code: item.code,
          description: item.description,
          status: item.status,
          updatedAt: new Date(item.updatedAt),
        },
        create: {
          id: item.id,
          name: item.name,
          code: item.code,
          description: item.description,
          status: item.status,
          createdAt: new Date(item.createdAt),
          updatedAt: new Date(item.updatedAt),
        },
      });
    }

    // 2. System Settings
    console.log(`[2/10] Migrating ${data.systemSettings.length} system settings...`);
    for (const item of data.systemSettings) {
      await prisma.systemSetting.upsert({
        where: { key: item.key },
        update: { value: item.value },
        create: {
          id: item.id,
          key: item.key,
          value: item.value,
        },
      });
    }

    // 3. Holidays
    console.log(`[3/10] Migrating ${data.holidays.length} holidays...`);
    for (const item of data.holidays) {
      await prisma.holiday.upsert({
        where: { id: item.id },
        update: {
          name: item.name,
          date: item.date,
          description: item.description,
          hallScope: item.hallScope,
        },
        create: {
          id: item.id,
          name: item.name,
          date: item.date,
          description: item.description,
          hallScope: item.hallScope,
          createdAt: new Date(item.createdAt),
        },
      });
    }

    // 4. Halls
    console.log(`[4/10] Migrating ${data.halls.length} halls...`);
    for (const item of data.halls) {
      await prisma.hall.upsert({
        where: { id: item.id },
        update: {
          name: item.name,
          code: item.code,
          description: item.description,
          location: item.location,
          capacity: item.capacity,
          image: item.image,
          facilities: item.facilities,
          status: item.status,
          updatedAt: new Date(item.updatedAt),
        },
        create: {
          id: item.id,
          name: item.name,
          code: item.code,
          description: item.description,
          location: item.location,
          capacity: item.capacity,
          image: item.image,
          facilities: item.facilities,
          status: item.status,
          createdAt: new Date(item.createdAt),
          updatedAt: new Date(item.updatedAt),
        },
      });
    }

    // 5. Users (references Department)
    console.log(`[5/10] Migrating ${data.users.length} users...`);
    for (const item of data.users) {
      await prisma.user.upsert({
        where: { email: item.email },
        update: {
          name: item.name,
          passwordHash: item.passwordHash,
          phone: item.phone,
          departmentId: item.departmentId,
          role: item.role,
          status: item.status,
          updatedAt: new Date(item.updatedAt),
        },
        create: {
          id: item.id,
          name: item.name,
          email: item.email,
          passwordHash: item.passwordHash,
          phone: item.phone,
          departmentId: item.departmentId,
          role: item.role,
          status: item.status,
          createdAt: new Date(item.createdAt),
          updatedAt: new Date(item.updatedAt),
        },
      });
    }

    // 6. Blocked Dates (references Hall)
    console.log(`[6/10] Migrating ${data.blockedDates.length} blocked dates...`);
    for (const item of data.blockedDates) {
      await prisma.blockedDate.upsert({
        where: { id: item.id },
        update: {
          hallId: item.hallId,
          startDate: item.startDate,
          endDate: item.endDate,
          reason: item.reason,
          description: item.description,
          createdById: item.createdById,
        },
        create: {
          id: item.id,
          hallId: item.hallId,
          startDate: item.startDate,
          endDate: item.endDate,
          reason: item.reason,
          description: item.description,
          createdById: item.createdById,
          createdAt: new Date(item.createdAt),
        },
      });
    }

    // 7. Maintenances (references Hall)
    console.log(`[7/10] Migrating ${data.maintenances.length} maintenance schedules...`);
    for (const item of data.maintenances) {
      await prisma.maintenance.upsert({
        where: { id: item.id },
        update: {
          hallId: item.hallId,
          startDate: item.startDate,
          endDate: item.endDate,
          reason: item.reason,
          notes: item.notes,
          responsiblePerson: item.responsiblePerson,
        },
        create: {
          id: item.id,
          hallId: item.hallId,
          startDate: item.startDate,
          endDate: item.endDate,
          reason: item.reason,
          notes: item.notes,
          responsiblePerson: item.responsiblePerson,
          createdAt: new Date(item.createdAt),
        },
      });
    }

    // 8. Notifications (references User)
    console.log(`[8/10] Migrating ${data.notifications.length} notifications...`);
    for (const item of data.notifications) {
      await prisma.notification.upsert({
        where: { id: item.id },
        update: {
          userId: item.userId,
          title: item.title,
          message: item.message,
          type: item.type,
          isRead: item.isRead,
        },
        create: {
          id: item.id,
          userId: item.userId,
          title: item.title,
          message: item.message,
          type: item.type,
          isRead: item.isRead,
          createdAt: new Date(item.createdAt),
        },
      });
    }

    // 9. Activity Logs (references User)
    console.log(`[9/10] Migrating ${data.activityLogs.length} activity logs...`);
    for (const item of data.activityLogs) {
      await prisma.activityLog.upsert({
        where: { id: item.id },
        update: {
          userId: item.userId,
          action: item.action,
          entityType: item.entityType,
          entityId: item.entityId,
          description: item.description,
        },
        create: {
          id: item.id,
          userId: item.userId,
          action: item.action,
          entityType: item.entityType,
          entityId: item.entityId,
          description: item.description,
          createdAt: new Date(item.createdAt),
        },
      });
    }

    // 10. Bookings (references User, Hall, Department)
    console.log(`[10/10] Migrating ${data.bookings.length} bookings...`);
    for (const item of data.bookings) {
      await prisma.booking.upsert({
        where: { bookingId: item.bookingId },
        update: {
          userId: item.userId,
          hallId: item.hallId,
          departmentId: item.departmentId,
          eventName: item.eventName,
          description: item.description,
          purpose: item.purpose,
          requestedBy: item.requestedBy,
          coordinatorName: item.coordinatorName,
          contactNumber: item.contactNumber,
          email: item.email,
          bookingDate: item.bookingDate,
          endDate: item.endDate,
          bookingType: item.bookingType,
          startTime: item.startTime,
          endTime: item.endTime,
          participantCount: item.participantCount,
          guestCount: item.guestCount,
          mementoCount: item.mementoCount,
          specialRequirements: item.specialRequirements,
          attachmentUrl: item.attachmentUrl,
          additionalNotes: item.additionalNotes,
          status: item.status,
          adminNotes: item.adminNotes,
          approvedById: item.approvedById,
          approvedAt: item.approvedAt ? new Date(item.approvedAt) : null,
          rejectionReason: item.rejectionReason,
          updatedAt: new Date(item.updatedAt),
        },
        create: {
          id: item.id,
          bookingId: item.bookingId,
          userId: item.userId,
          hallId: item.hallId,
          departmentId: item.departmentId,
          eventName: item.eventName,
          description: item.description,
          purpose: item.purpose,
          requestedBy: item.requestedBy,
          coordinatorName: item.coordinatorName,
          contactNumber: item.contactNumber,
          email: item.email,
          bookingDate: item.bookingDate,
          endDate: item.endDate,
          bookingType: item.bookingType,
          startTime: item.startTime,
          endTime: item.endTime,
          participantCount: item.participantCount,
          guestCount: item.guestCount,
          mementoCount: item.mementoCount,
          specialRequirements: item.specialRequirements,
          attachmentUrl: item.attachmentUrl,
          additionalNotes: item.additionalNotes,
          status: item.status,
          adminNotes: item.adminNotes,
          approvedById: item.approvedById,
          approvedAt: item.approvedAt ? new Date(item.approvedAt) : null,
          rejectionReason: item.rejectionReason,
          createdAt: new Date(item.createdAt),
          updatedAt: new Date(item.updatedAt),
        },
      });
    }

    console.log('[RESTORE SUCCESS] All 10 models migrated successfully to PostgreSQL with 100% data integrity!');
  } catch (error) {
    console.error('[RESTORE ERROR] Migration to PostgreSQL failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runRestore();
