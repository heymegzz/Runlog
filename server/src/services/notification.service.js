import nodemailer from 'nodemailer';

let transporter = null;

const getTransporter = () => {
  if (transporter) return transporter;

  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
    console.warn('[Notifications] SMTP not configured — email alerts disabled.');
    return null;
  }

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  return transporter;
};

/**
 * Send an email + optional Slack webhook when a job fails.
 * @param {object} job - Mongoose Job document
 * @param {object} execution - Mongoose Execution document
 */
export const sendFailureAlert = async (job, execution) => {
  const subject = `[RunLog] Job Failed: ${job.name}`;
  const body = `
Your RunLog job has failed.

Job Name    : ${job.name}
Endpoint    : ${job.callbackMethod} ${job.callbackUrl}
Status Code : ${execution.statusCode}
Duration    : ${execution.durationMs}ms
Error       : ${execution.errorDetails || 'Unknown error'}
Time        : ${execution.executedAt.toISOString()}

Log in to RunLog to view the full execution log.
  `.trim();

  const htmlBody = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #ef4444; color: white; padding: 1rem 1.5rem; border-radius: 8px 8px 0 0;">
        <h2 style="margin:0;">⚠️ Job Failed: ${job.name}</h2>
      </div>
      <div style="border: 1px solid #e5e7eb; padding: 1.5rem; border-top: none; border-radius: 0 0 8px 8px;">
        <table style="width:100%; border-collapse: collapse;">
          <tr><td style="padding:6px 0; color:#6b7280; width:130px;">Job Name</td><td><strong>${job.name}</strong></td></tr>
          <tr><td style="padding:6px 0; color:#6b7280;">Endpoint</td><td>${job.callbackMethod} ${job.callbackUrl}</td></tr>
          <tr><td style="padding:6px 0; color:#6b7280;">Status Code</td><td>${execution.statusCode}</td></tr>
          <tr><td style="padding:6px 0; color:#6b7280;">Duration</td><td>${execution.durationMs}ms</td></tr>
          <tr><td style="padding:6px 0; color:#6b7280;">Error</td><td style="color:#ef4444;">${execution.errorDetails || 'Unknown error'}</td></tr>
          <tr><td style="padding:6px 0; color:#6b7280;">Time</td><td>${execution.executedAt.toISOString()}</td></tr>
        </table>
      </div>
    </div>
  `;

  const promises = [];

  // Email alert
  if (job.alertEmail) {
    const mail = getTransporter();
    if (mail) {
      promises.push(
        mail.sendMail({
          from: process.env.SMTP_FROM || process.env.SMTP_USER,
          to: job.alertEmail,
          subject,
          text: body,
          html: htmlBody,
        })
      );
    }
  }

  // Slack webhook alert
  if (job.alertSlack) {
    const { default: axios } = await import('axios');
    const slackPayload = {
      text: `*${subject}*`,
      attachments: [
        {
          color: '#ef4444',
          fields: [
            { title: 'Endpoint', value: `${job.callbackMethod} ${job.callbackUrl}`, short: false },
            { title: 'Status Code', value: String(execution.statusCode), short: true },
            { title: 'Duration', value: `${execution.durationMs}ms`, short: true },
            { title: 'Error', value: execution.errorDetails || 'Unknown', short: false },
          ],
          ts: Math.floor(execution.executedAt.getTime() / 1000),
        },
      ],
    };
    promises.push(axios.post(job.alertSlack, slackPayload));
  }

  await Promise.allSettled(promises);
};
