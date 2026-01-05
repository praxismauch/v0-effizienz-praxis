# Todo Email Reminders

This system automatically sends email notifications to users when their todos are due within the next 3 days.

## Setup

### 1. Vercel Cron Job

Add the following to your `vercel.json` file in the project root:

\`\`\`json
{
  "crons": [
    {
      "path": "/api/cron/todo-reminders",
      "schedule": "0 8 * * *"
    }
  ]
}
\`\`\`

This runs the job daily at 8:00 AM UTC.

### 2. Environment Variables

The following environment variables are already configured:
- `RESEND_API_KEY` - Your Resend API key
- `RESEND_FROM_EMAIL` - Sender email address
- `NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL` - Base URL for links in emails

Optional (for extra security):
- `CRON_SECRET` - A secret token to authenticate cron requests

### 3. How It Works

The cron job:
1. Runs daily at 8:00 AM
2. Queries all incomplete todos with a `due_date` between today and 3 days from now
3. Groups todos by assigned user
4. Sends a personalized email to each user with:
   - List of their upcoming todos
   - Due dates and priority badges
   - Urgency indicators (color-coded)
   - Direct link to the todos page

### 4. Manual Testing

You can manually trigger the cron job by visiting:
\`\`\`
https://your-domain.com/api/cron/todo-reminders
\`\`\`

Or using curl:
\`\`\`bash
curl https://your-domain.com/api/cron/todo-reminders
\`\`\`

If you set `CRON_SECRET`, you need to include it:
\`\`\`bash
curl -H "Authorization: Bearer your-cron-secret" https://your-domain.com/api/cron/todo-reminders
\`\`\`

### 5. Email Format

The email includes:
- Professional header with Effizienz Praxis branding
- Personalized greeting
- Todo cards with:
  - Title and description
  - Priority badge (High/Medium/Low)
  - Urgency indicator (days until due)
  - Due date
  - Color-coded left border for visual urgency
- Call-to-action button linking to the todos page
- Footer with automatic email disclaimer

### 6. Database Requirements

The system requires:
- `todos` table with columns: `id`, `title`, `description`, `completed`, `priority`, `due_date`, `assigned_to`, `practice_id`
- `users` table with columns: `id`, `name`, `email`
- `practices` table with columns: `id`, `name`

All required tables already exist in your database.

### 7. Monitoring

Check the Vercel logs to monitor cron job execution:
- Successful runs log the number of todos found and emails sent
- Failed runs log detailed error messages
- Each email send operation is logged individually

### 8. Customization

You can customize:
- **Schedule**: Change the `schedule` in `vercel.json` (uses cron syntax)
- **Day Range**: Modify `threeDaysFromNow` calculation in the code (currently 3 days)
- **Email Design**: Edit the HTML template in the `resend.emails.send()` call
- **Email Subject**: Modify the `subject` field
- **Sender Name**: Update `RESEND_FROM_EMAIL` environment variable
\`\`\`
