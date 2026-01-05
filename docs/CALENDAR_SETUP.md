# Calendar System Setup Guide

## System Status
✅ **Calendar system is already implemented and functional!**

The following components are already in place:
- API routes for calendar events (GET, POST, PUT, DELETE)
- Calendar context with CRUD operations
- Recurring event expansion (client-side)
- Soft delete support
- Practice-based filtering

## Database Setup

Run `scripts/calendar-schema.sql` in your Supabase SQL Editor to:
1. Create `user_profiles` table (for practice selection)
2. Ensure `calendar_events` table exists with all required columns
3. Set up RLS policies for secure access
4. Create performance indexes
5. Seed test user data

## Test User

- **User ID**: `36883b61-34e4-4b9e-8a11-eb1a9656d2a0`
- **Email**: `mauch.daniel@googlemail.com`
- **Practice ID**: `"1"`

## API Endpoints

- `GET /api/current-practice` - Get current user and practice ID
- `GET /api/practices/[practiceId]/calendar-events` - List all events
- `POST /api/practices/[practiceId]/calendar-events` - Create event
- `PUT /api/practices/[practiceId]/calendar-events/[id]` - Update event
- `DELETE /api/practices/[practiceId]/calendar-events/[id]` - Soft delete event

## Features

- ✅ Full CRUD for calendar events
- ✅ Recurring events (daily, weekly, monthly, yearly)
- ✅ Soft delete (events marked deleted_at, not hard deleted)
- ✅ Practice-based scoping (RLS enforced)
- ✅ German UI labels
- ✅ Multiple views: Month grid, Upcoming events, All events
- ✅ Event types: meeting, training, maintenance, holiday, announcement, other
- ✅ Priority levels: low, medium, high
- ✅ All-day event support

## Usage

The calendar is already accessible at `/calendar` and uses the `CalendarProvider` context:

\`\`\`tsx
import { useCalendar } from "@/contexts/calendar-context"

const { events, addEvent, updateEvent, deleteEvent } = useCalendar()

// Create event
await addEvent({
  title: "Team Meeting",
  startDate: "2025-12-17",
  endDate: "2025-12-17",
  startTime: "10:00",
  endTime: "11:00",
  type: "meeting",
  priority: "high",
  isAllDay: false
})
\`\`\`

## Next Steps

1. Run the SQL schema in Supabase
2. Test with the provided user credentials
3. The calendar should work immediately!
