import { prisma } from '../prisma';

export async function logActivity(
  userId: string | null,
  action: string,
  entityType: string,
  entityId: string | null,
  description: string
) {
  try {
    await prisma.activityLog.create({
      data: {
        userId,
        action,
        entityType,
        entityId,
        description,
      },
    });
  } catch (error) {
    console.error('Failed to write activity log:', error);
  }
}

export async function createNotification(
  userId: string,
  title: string,
  message: string,
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ALERT' = 'INFO'
) {
  try {
    await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type,
      },
    });
  } catch (error) {
    console.error('Failed to create notification:', error);
  }
}
