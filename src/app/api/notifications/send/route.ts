import { NextResponse } from 'next/server';
import {
  sendEmail,
  leaseExpirationEmail,
  maintenanceAlertEmail,
  paymentReminderEmail
} from '@/lib/email';
import { getTenantsByProperty, getProperties } from '@/lib/database';

// This endpoint can be called by a cron job to send scheduled notifications
export async function POST(request: Request) {
  try {
    const { type, data, recipientEmail } = await request.json();

    if (!recipientEmail) {
      return NextResponse.json({ error: 'Recipient email required' }, { status: 400 });
    }

    let emailContent;

    switch (type) {
      case 'lease_expiration':
        emailContent = leaseExpirationEmail({
          tenantName: data.tenantName,
          propertyAddress: data.propertyAddress,
          leaseEndDate: data.leaseEndDate,
          daysRemaining: data.daysRemaining,
        });
        break;

      case 'maintenance_alert':
        emailContent = maintenanceAlertEmail({
          propertyAddress: data.propertyAddress,
          issueDescription: data.issueDescription,
          priority: data.priority,
          reportedDate: data.reportedDate,
        });
        break;

      case 'payment_reminder':
        emailContent = paymentReminderEmail({
          tenantName: data.tenantName,
          propertyAddress: data.propertyAddress,
          rentAmount: data.rentAmount,
          dueDate: data.dueDate,
        });
        break;

      default:
        return NextResponse.json({ error: 'Invalid notification type' }, { status: 400 });
    }

    const result = await sendEmail({
      to: recipientEmail,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ success: true, messageId: result.messageId });
  } catch (error) {
    console.error('Notification send error:', error);
    return NextResponse.json({ error: 'Failed to send notification' }, { status: 500 });
  }
}

// GET endpoint to check upcoming lease expirations (for cron job)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const check = searchParams.get('check');

    if (check === 'lease_expirations') {
      const properties = await getProperties();
      const expiringLeases: {
        tenantName: string;
        propertyAddress: string;
        leaseEndDate: string;
        daysRemaining: number;
      }[] = [];

      for (const property of properties) {
        const tenants = await getTenantsByProperty(property.id);

        for (const tenant of tenants) {
          if (tenant.lease_end && tenant.status === 'active') {
            const leaseEnd = new Date(tenant.lease_end);
            const today = new Date();
            const daysRemaining = Math.ceil((leaseEnd.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

            // Check for 30, 60, or 90 day reminders
            if ([30, 60, 90].includes(daysRemaining)) {
              expiringLeases.push({
                tenantName: tenant.name,
                propertyAddress: property.address,
                leaseEndDate: leaseEnd.toLocaleDateString(),
                daysRemaining,
              });
            }
          }
        }
      }

      return NextResponse.json({
        success: true,
        expiringLeases,
        count: expiringLeases.length
      });
    }

    return NextResponse.json({ error: 'Invalid check type' }, { status: 400 });
  } catch (error) {
    console.error('Notification check error:', error);
    return NextResponse.json({ error: 'Failed to check notifications' }, { status: 500 });
  }
}
