import { Resend } from 'resend';

const FROM_EMAIL = process.env.FROM_EMAIL || 'notifications@yourdomain.com';
const FROM_NAME = process.env.FROM_NAME || 'Murray Aspinwall LP';

// Lazy initialize Resend client to avoid build-time errors
let resendClient: Resend | null = null;

function getResend(): Resend {
  if (!resendClient) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error('RESEND_API_KEY environment variable is not set');
    }
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail({ to, subject, html, text }: EmailOptions) {
  try {
    const resend = getResend();
    const { data, error } = await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to,
      subject,
      html,
      text,
    });

    if (error) {
      console.error('Email send error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, messageId: data?.id };
  } catch (error) {
    console.error('Email exception:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to send email';
    return { success: false, error: errorMessage };
  }
}

// Email templates
export function leaseExpirationEmail(params: {
  tenantName: string;
  propertyAddress: string;
  leaseEndDate: string;
  daysRemaining: number;
}) {
  const { tenantName, propertyAddress, leaseEndDate, daysRemaining } = params;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #1a1a2e; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #f8f9fa; padding: 20px; border-radius: 0 0 8px 8px; }
        .highlight { background: #fff; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #ff9800; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin:0;">Lease Expiration Reminder</h1>
        </div>
        <div class="content">
          <p>Hello,</p>
          <div class="highlight">
            <p><strong>${tenantName}</strong>'s lease at <strong>${propertyAddress}</strong> will expire in <strong>${daysRemaining} days</strong>.</p>
            <p>Lease End Date: <strong>${leaseEndDate}</strong></p>
          </div>
          <p>Consider reaching out to discuss lease renewal options.</p>
        </div>
        <div class="footer">
          <p>Sent by Murray Aspinwall LP Property Management</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `Lease Expiration Reminder\n\n${tenantName}'s lease at ${propertyAddress} will expire in ${daysRemaining} days (${leaseEndDate}).\n\nConsider reaching out to discuss lease renewal options.`;

  return { html, text, subject: `Lease Expiration: ${propertyAddress} - ${daysRemaining} days remaining` };
}

export function maintenanceAlertEmail(params: {
  propertyAddress: string;
  issueDescription: string;
  priority: string;
  reportedDate: string;
}) {
  const { propertyAddress, issueDescription, priority, reportedDate } = params;

  const priorityColor = priority === 'high' ? '#dc3545' : priority === 'medium' ? '#ff9800' : '#28a745';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #1a1a2e; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #f8f9fa; padding: 20px; border-radius: 0 0 8px 8px; }
        .highlight { background: #fff; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid ${priorityColor}; }
        .priority { display: inline-block; padding: 4px 12px; border-radius: 4px; background: ${priorityColor}; color: white; font-size: 12px; text-transform: uppercase; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin:0;">Maintenance Alert</h1>
        </div>
        <div class="content">
          <p>Hello,</p>
          <div class="highlight">
            <p><strong>Property:</strong> ${propertyAddress}</p>
            <p><strong>Issue:</strong> ${issueDescription}</p>
            <p><strong>Priority:</strong> <span class="priority">${priority}</span></p>
            <p><strong>Reported:</strong> ${reportedDate}</p>
          </div>
          <p>Please address this maintenance request at your earliest convenience.</p>
        </div>
        <div class="footer">
          <p>Sent by Murray Aspinwall LP Property Management</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `Maintenance Alert\n\nProperty: ${propertyAddress}\nIssue: ${issueDescription}\nPriority: ${priority}\nReported: ${reportedDate}\n\nPlease address this maintenance request at your earliest convenience.`;

  return { html, text, subject: `Maintenance Alert: ${propertyAddress} - ${priority} priority` };
}

export function paymentReminderEmail(params: {
  tenantName: string;
  propertyAddress: string;
  rentAmount: number;
  dueDate: string;
}) {
  const { tenantName, propertyAddress, rentAmount, dueDate } = params;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #1a1a2e; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #f8f9fa; padding: 20px; border-radius: 0 0 8px 8px; }
        .highlight { background: #fff; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #28a745; }
        .amount { font-size: 24px; font-weight: bold; color: #1a1a2e; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin:0;">Rent Collection Reminder</h1>
        </div>
        <div class="content">
          <p>Hello,</p>
          <div class="highlight">
            <p>Rent payment is due from <strong>${tenantName}</strong> at <strong>${propertyAddress}</strong>.</p>
            <p>Amount: <span class="amount">$${rentAmount.toLocaleString()}</span></p>
            <p>Due Date: <strong>${dueDate}</strong></p>
          </div>
          <p>Please follow up on rent collection.</p>
        </div>
        <div class="footer">
          <p>Sent by Murray Aspinwall LP Property Management</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `Rent Collection Reminder\n\nRent payment is due from ${tenantName} at ${propertyAddress}.\nAmount: $${rentAmount.toLocaleString()}\nDue Date: ${dueDate}\n\nPlease follow up on rent collection.`;

  return { html, text, subject: `Rent Due: ${propertyAddress} - $${rentAmount.toLocaleString()}` };
}
