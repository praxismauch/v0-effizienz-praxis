# Hostinger SMTP Email Configuration

This project is configured to send all outgoing emails via Hostinger SMTP.

## Environment Variables

Add these environment variables to your `.env.local` (for local development) and to your Vercel project settings (for production):

\`\`\`bash
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_USER=noreply@yourdomain.com          # Replace with your Hostinger email address
SMTP_PASSWORD=your-smtp-password           # Replace with your Hostinger email password
SMTP_FROM="Your App Name <noreply@yourdomain.com>"
SMTP_USE_SSL=true
\`\`\`

## Hostinger SMTP Details

- **Protocol**: SMTP
- **Hostname**: smtp.hostinger.com
- **Port**: 465 (SSL/TLS enabled)
- **Security**: SSL/TLS must be enabled
- **Authentication**: Required (username and password)

Note: IMAP and POP are only for receiving emails. For sending, we only use SMTP.

## How It Works

### 1. Email Library (`lib/email/send-email.ts`)

The `sendEmail` function uses nodemailer with the Hostinger SMTP configuration from environment variables. It:
- Reads SMTP credentials from `process.env`
- Creates a nodemailer transporter with SSL/TLS enabled
- Never exposes credentials to the client
- Caches the transporter for performance
- Logs errors without exposing sensitive data

### 2. API Route (`app/api/send-email/route.ts`)

The `/api/send-email` API endpoint:
- Accepts POST requests with JSON body: `{ to, subject, text?, html? }`
- Validates required fields and email format
- Calls the `sendEmail` function
- Returns `{ success: true, messageId }` on success
- Returns appropriate error messages with HTTP status codes on failure

### 3. Usage Example

\`\`\`typescript
// From a server component or API route
import { sendEmail } from "@/lib/email/send-email"

const result = await sendEmail({
  to: "user@example.com",
  subject: "Welcome to Effizienz Praxis",
  html: "<h1>Welcome!</h1><p>Thank you for joining us.</p>",
})

if (result.success) {
  console.log("Email sent:", result.messageId)
} else {
  console.error("Email failed:", result.error)
}
\`\`\`

\`\`\`typescript
// From a client component via API route
const response = await fetch("/api/send-email", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    to: "user@example.com",
    subject: "Welcome",
    html: "<h1>Welcome!</h1>",
  }),
})

const result = await response.json()
\`\`\`

## Security Best Practices

1. **Never commit credentials**: Keep `SMTP_PASSWORD` in environment variables only
2. **Use environment variables**: All SMTP settings come from `process.env`
3. **Server-side only**: The API route is server-only and doesn't expose credentials
4. **SSL/TLS enabled**: Port 465 uses SSL for secure communication
5. **Error logging**: Errors are logged without exposing passwords

## Existing Email Sending Code

All existing email-sending code in the project already uses `sendEmail` from `lib/email/send-email.ts`:

- ✅ `app/api/cron/todo-reminders/route.ts` - Reminder emails
- ✅ `app/api/hiring/send-questionnaire/route.ts` - Hiring questionnaires
- ✅ `app/api/super-admin/send-email/route.tsx` - Admin emails
- ✅ `app/api/super-admin/test-email/route.ts` - Test emails
- ✅ `app/api/system/404-notification/route.ts` - Error notifications
- ✅ `app/api/waitlist/submit/route.ts` - Waitlist emails

All these routes will automatically use the Hostinger SMTP configuration once you set the environment variables.

## Testing

1. **Set environment variables** in `.env.local`
2. **Test the connection** via the Super Admin dashboard → Email Diagnostics
3. **Send a test email** using the test email feature
4. **Check logs** for any connection errors

## Troubleshooting

### Authentication Failed
- Verify your Hostinger email password is correct
- Check if two-factor authentication is enabled (may need app password)

### Connection Timeout
- Verify port 465 is not blocked by your firewall
- Check that SSL/TLS is enabled (`SMTP_USE_SSL=true`)

### Emails Not Sending
- Check environment variables are set correctly
- Review server logs for error messages
- Test connection in Email Diagnostics section

## Migration from Resend

If you were previously using Resend, the migration is automatic:
- Old code using `sendEmail` continues to work unchanged
- Just set the new SMTP environment variables
- Remove or keep `RESEND_API_KEY` (it will be ignored)
