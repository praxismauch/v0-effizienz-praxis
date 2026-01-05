# Super Admin Setup Instructions

Currently, there are **no authenticated super admin users** in your system. The mock users (Dr. Sarah Wilson, John Smith) are frontend-only and cannot be used to log in.

## Steps to Create a Super Admin:

### Option 1: Via Sign-Up Page (Recommended)

1. **Go to the sign-up page**: `/auth/sign-up`
2. **Create a new account** with:
   - Email: `admin@effizienz-praxis.com` (or your preferred email)
   - Password: Your chosen secure password
   - Name: Super Admin
3. **Check your email** for the confirmation link and click it
4. **Get your user ID**:
   - Go to Supabase Dashboard → Authentication → Users
   - Find the user you just created and copy their UUID
5. **Run the setup script**:
   - Open `scripts/create-super-admin-user.sql`
   - Replace `YOUR_AUTH_USER_ID_HERE` with the UUID you copied
   - Run the script in the v0 Scripts panel
6. **Log in** with your email and password

### Option 2: Via Supabase Dashboard

1. **Create user in Supabase**:
   - Go to Supabase Dashboard → Authentication → Users
   - Click "Add user" → "Create new user"
   - Email: `admin@effizienz-praxis.com`
   - Password: Your chosen secure password
   - Auto Confirm User: ✓ (checked)
2. **Copy the user ID** (UUID) that was created
3. **Run the setup script**:
   - Open `scripts/create-super-admin-user.sql`
   - Replace `YOUR_AUTH_USER_ID_HERE` with the UUID
   - Run the script in the v0 Scripts panel
4. **Log in** with your email and password

### Option 3: Convert Existing User to Super Admin

If you already have a user account:

1. **Find your user ID**:
   - Go to Profile page while logged in
   - Or check Supabase Dashboard → Authentication → Users
2. **Run this SQL**:
   \`\`\`sql
   UPDATE users 
   SET role = 'superadmin', practice_id = NULL, is_active = true 
   WHERE id = 'YOUR_USER_ID_HERE';
   \`\`\`
3. **Refresh the page** and you should now have super admin access

## Default Super Admin Credentials (After Setup)

After running the setup script, you can log in with:

- **Email**: `admin@effizienz-praxis.com` (or whatever email you used)
- **Password**: The password you set during creation

## Verifying Super Admin Access

Once logged in as a super admin, you should see:
- Access to all practices in the dashboard
- Super Admin dashboard menu item
- Ability to manage global parameters
- Access to system settings

## Troubleshooting

If you're still seeing "Demo User" after login:
1. Make sure the email in the `users` table matches exactly with Supabase Auth
2. Check that the `id` in the `users` table matches the Supabase Auth user UUID
3. Try logging out completely and logging back in
4. Clear browser cache/cookies
