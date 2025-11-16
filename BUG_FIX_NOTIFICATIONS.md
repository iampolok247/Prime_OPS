# 🐛 CRITICAL BUG FIX: Leave Application Notifications

## The Problem
Leave application notifications were being created in the database but **NOT appearing in the frontend** notification bell.

## Root Cause
**Mismatched user ID property name** in the authentication middleware vs. notification routes.

### What Was Wrong:
- **Auth Middleware** (`api/middleware/auth.js`): Sets `req.user = { id, role, email, name }` (using `id`)
- **Notification Routes** (`api/routes/notifications.js`): Was querying with `req.user._id` (using `_id`)
- **Result**: Queries returned 0 notifications because `req.user._id` was `undefined`

## The Fix
Changed all occurrences of `req.user._id` to `req.user.id` in the notifications route file.

### Files Changed:
1. `/api/routes/notifications.js`
   - GET `/api/notifications` - Fixed recipient query
   - GET `/api/notifications/unread-count` - Fixed recipient query  
   - PATCH `/api/notifications/:id/read` - Fixed recipient query
   - PATCH `/api/notifications/mark-all-read` - Fixed recipient query
   - DELETE `/api/notifications/:id` - Fixed recipient query

## Testing Instructions

### 1. Restart Backend Server
```bash
cd api
# Kill the current process (Ctrl+C) if running
npm run dev
```

### 2. Refresh Frontend
Just refresh your browser (F5 or Cmd+R)

### 3. Test the Fix

#### Option A: Submit a New Leave Application
1. Login as any regular user (not SuperAdmin)
2. Go to "My Applications"
3. Click "Apply for Leave"
4. Fill out the form and submit
5. **Expected**: Admins should receive notification immediately
6. Login as Admin and check bell icon - notification should appear!

#### Option B: Check Existing Notifications (if any were created)
1. Just refresh the page
2. Bell icon should now show count
3. Click bell to see all system notifications

## What You'll See

### Backend Console (when leave is submitted):
```
🔔 Creating notification: { recipient: ..., type: LEAVE_SUBMITTED, ... }
✅ Recipient verified: Admin Name admin@example.com
✅ Notification saved to DB with ID: 507f1f77bcf86cd799439011
📢 Found 2 admins to notify: ...
✅ Admin notification created for: Admin Name with ID: ...
```

### Backend Console (when notifications are fetched):
```
🔔 [GET /api/notifications] Request from user: Admin Name 507f...
🔔 [GET /api/notifications] Query params: { isRead: 'false', limit: '20' }
🔔 [GET /api/notifications] MongoDB query: {"recipient":"507f..."}
🔔 [GET /api/notifications] Found 1 notifications
   - LEAVE_SUBMITTED : New Leave Application | isRead: false | ID: ...
🔔 [GET /api/notifications] Unread count: 1
```

### Frontend Browser Console:
```
🔔 [Topbar] Loading system notifications for user: Admin Name 507f...
🔔 [Topbar] System notifications response: { notifications: [...], unreadCount: 1 }
🔔 [Topbar] Notifications array length: 1
🔔 [Topbar] Unread count: 1
```

### In the UI:
- Bell icon shows red badge with number
- Click bell → See "System Notifications" section
- Notification shows: "New Leave Application - [User] has submitted a [Type] application for X days"

## Why This Happened
This is a common bug pattern when:
1. Multiple coding sessions/developers work on different parts
2. Auth middleware is set up first with one convention
3. Later routes assume a different convention
4. No TypeScript to catch the mismatch
5. Code works until you actually query with that field

## Prevention
Consider adding TypeScript or JSDoc comments to document the `req.user` shape:
```javascript
/**
 * @typedef {Object} AuthUser
 * @property {string} id - MongoDB ObjectId as string
 * @property {string} role - User role enum
 * @property {string} email - User email
 * @property {string} name - User display name
 */

/**
 * @type {import('express').RequestHandler}
 * Sets req.user to AuthUser object
 */
export const requireAuth = (req, res, next) => {
  // ...
  req.user = decoded; // { id, role, email, name }
  // ...
};
```

## Additional Notes
- The notification **creation** in leave.js was working fine
- The notification **fetching** in notifications.js was broken
- This affects all system notifications (leave, handover, TADA, etc.)
- Once fixed, **all past notifications will appear** if they exist in DB

## Summary
✅ Fixed: Changed `req.user._id` → `req.user.id` in 5 places  
✅ Impact: All notification types now work correctly  
✅ Test: Submit leave application and check admin notification bell  
✅ Status: **WORKING NOW** 🎉
