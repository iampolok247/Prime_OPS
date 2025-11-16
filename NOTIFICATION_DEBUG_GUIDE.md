# Leave Application Notification Debugging Guide

## Changes Made

I've added extensive console logging to help debug the notification issue for leave applications. Here's what was changed:

### 1. Backend - Leave Route (`api/routes/leave.js`)

**Enhanced `createNotification()` helper function:**
- Now verifies recipient user exists before creating notification
- Logs full notification data being saved
- Logs the saved notification ID and details
- Better error handling with detailed error messages

**Enhanced POST `/api/leave` endpoint:**
- Added try-catch blocks around handover notification creation
- Added try-catch blocks around admin notification creation
- Logs admin user IDs and names being notified
- Logs successful notification creation with IDs

**Enhanced PATCH `/api/leave/:id/approve` endpoint:**
- Added try-catch around approval notification
- Logs employee details and notification status

**Enhanced PATCH `/api/leave/:id/reject` endpoint:**
- Added try-catch around rejection notification
- Logs employee details and notification status

### 2. Backend - Notifications Route (`api/routes/notifications.js`)

**Enhanced GET `/api/notifications` endpoint:**
- Logs incoming user details (name, ID)
- Logs query parameters (isRead, limit)
- Logs MongoDB query being executed
- Logs found notifications count
- Logs details of each notification (type, title, isRead, ID)
- Logs final unread count

### 3. Frontend - Topbar Component (`web/src/components/Topbar.jsx`)

**Enhanced `loadSystemNotifications()` function:**
- Logs user details before fetching
- Logs full API response
- Logs notifications array length
- Logs full notifications array as JSON
- Logs unread count
- Better error logging with error message

## How to Debug

### Step 1: Start Backend Server
```bash
cd api
npm run dev
```

Watch the console for startup logs. You should see database connection confirmation.

### Step 2: Start Frontend Server
```bash
cd web
npm run dev
```

### Step 3: Open Browser Console
1. Open your browser's Developer Tools (F12)
2. Go to Console tab
3. Filter by "Topbar" or "notification" to see frontend logs

### Step 4: Test Leave Application Flow

#### A. Submit a Leave Application
1. Login as a regular user (not SuperAdmin)
2. Go to "My Applications" page
3. Submit a new leave application with handover if desired
4. **Check backend console logs for:**
   ```
   🔔 Creating notification: { recipient: ..., type: ..., title: ... }
   ✅ Recipient verified: [Name] [Email]
   ✅ Notification saved to DB with ID: [ObjectId]
   📢 Found X admins to notify: [List of admins]
   ✅ Admin notification created for: [Admin Name] with ID: [ObjectId]
   ```

#### B. Check Notification Appears in Topbar
1. Look at the bell icon in top right
2. Should show a red badge with count
3. Click the bell to open dropdown
4. **Check browser console logs for:**
   ```
   🔔 [Topbar] Loading system notifications for user: [Name] [ID]
   🔔 [Topbar] System notifications response: { notifications: [...], unreadCount: X }
   🔔 [Topbar] Notifications array length: X
   🔔 [Topbar] Notifications: [Full JSON array]
   ```

#### C. Approve/Reject as Admin
1. Login as Admin user
2. Go to "Admin Approvals" page
3. Approve or reject the leave application
4. **Check backend console logs for:**
   ```
   📢 Creating approval/rejection notification for employee: [Name] [ID]
   ✅ Approval/Rejection notification sent successfully
   ```

### Step 5: Check Database Directly (if needed)

If you have MongoDB access, you can query notifications directly:

```javascript
// In MongoDB shell or Compass
db.notifications.find().sort({createdAt: -1}).limit(10)

// Check for specific user's notifications
db.notifications.find({ recipient: ObjectId("USER_ID_HERE") })

// Check unread notifications
db.notifications.find({ isRead: false })
```

## Common Issues and Solutions

### Issue 1: Notifications Created but Not Appearing
**Symptoms:** Backend logs show notifications created successfully, but Topbar doesn't show them.

**Check:**
1. Browser console - Is the API call being made?
2. Browser console - What's the response from `/api/notifications`?
3. Backend console - Is the GET request logged?
4. Verify recipient ID matches user ID

**Solution:** Look for mismatched user IDs or authentication issues.

### Issue 2: No Backend Logs Appearing
**Symptoms:** Submit leave application but no console logs appear.

**Check:**
1. Is backend server running?
2. Is frontend pointing to correct API URL?
3. Check `web/src/lib/api.js` - verify `getApiBase()` returns correct URL
4. Check browser Network tab - is POST request reaching backend?

**Solution:** Verify backend is running and frontend API configuration is correct.

### Issue 3: "Recipient user not found" Error
**Symptoms:** Backend shows error "Recipient user not found: [ID]"

**Check:**
1. User ID being passed to notification
2. User exists in database
3. User `isActive` status

**Solution:** Verify user exists and has correct ID format (MongoDB ObjectId).

### Issue 4: Notifications Created but Count is Wrong
**Symptoms:** Notifications exist but unread count is 0 or incorrect.

**Check:**
1. Backend logs - what's the unread count query result?
2. Database - check `isRead` field values
3. Verify recipient ID in query matches user ID

**Solution:** Check MongoDB query in logs, verify recipient ID matching.

### Issue 5: Frontend Console Shows Empty Array
**Symptoms:** Frontend logs show `notifications: []` but backend created them.

**Check:**
1. Backend GET logs - is request reaching server?
2. Backend - what user ID is in the request?
3. Backend - what does MongoDB query return?
4. Are you logged in as the correct user?

**Solution:** Verify authentication token and user ID consistency.

## Testing Checklist

- [ ] Backend server running and connected to database
- [ ] Frontend server running
- [ ] Browser console open and monitoring
- [ ] Submit leave application as regular user
- [ ] Check backend logs for notification creation
- [ ] Check frontend logs for notification fetch
- [ ] Verify bell icon shows badge count
- [ ] Open notification dropdown and see notifications
- [ ] Click notification and verify navigation
- [ ] Login as Admin and approve/reject
- [ ] Check employee receives approval/rejection notification

## Expected Log Flow

### When Submitting Leave Application:

**Backend:**
```
🔔 Creating notification: { recipient: 507f1f77..., type: LEAVE_HANDOVER_REQUEST, title: Responsibility Handover Request }
✅ Recipient verified: John Doe john@example.com
✅ Notification saved to DB with ID: 507f1f77bcf86cd799439011
📢 Found 2 admins to notify: Admin User (507f...), Super Admin (507f...)
✅ Admin notification created for: Admin User with ID: 507f1f77bcf86cd799439012
✅ Admin notification created for: Super Admin with ID: 507f1f77bcf86cd799439013
```

**Frontend (after 0-30 seconds):**
```
🔔 [Topbar] Loading system notifications for user: Admin User 507f...
[API] Fetching: https://prime-ops-api.onrender.com/api/notifications?isRead=false&limit=20
[API] Response status: 200
🔔 [Topbar] System notifications response: { notifications: [...], unreadCount: 1 }
🔔 [Topbar] Notifications array length: 1
🔔 [Topbar] Unread count: 1
```

## Need More Help?

If notifications still aren't working after following this guide:

1. **Copy all relevant logs** (both backend and frontend console)
2. **Check database directly** to see if notifications exist
3. **Verify user IDs** match between frontend auth and backend recipient
4. **Test with simple case** - just 1 user submitting, 1 admin receiving
5. **Check browser Network tab** for failed API calls

The logs will tell you exactly where the flow breaks:
- No backend logs = frontend not sending request
- Backend logs stop after "Creating notification" = database error
- Backend success but no frontend logs = polling not working
- Frontend logs empty array = wrong user or query issue
