# Leave Application Handover & Notification System

## Overview
Extended the leave application system with responsibility handover workflow and comprehensive notification system.

## New Features Implemented

### 1. Responsibility Handover
- **Employee Dropdown**: When applying for leave, employees can select a colleague to handle their responsibilities
- **Handover Request**: Selected employee receives a notification and can accept or deny the handover
- **Status Tracking**: Handover status (Pending/Accepted/Denied) displayed on leave applications
- **Admin Visibility**: Admins see handover person and status when reviewing leave requests

### 2. Notification System
- **Real-time Notifications**: All stakeholders receive notifications at key workflow stages
- **Notification Types**:
  - Leave submitted (→ Admin)
  - Leave approved/rejected (→ Employee)
  - Handover requested (→ Handover employee)
  - Handover accepted/denied (→ Requesting employee)
  - TA/DA submitted/approved/rejected/paid
  - Task assigned/completed
  - Message received

### 3. Workflow Updates

#### Leave Application Flow (with Handover):
```
1. Employee applies for leave + selects handover person (optional)
   ↓
2. Handover employee receives notification
   ↓
3. Handover employee accepts or denies (with note)
   ↓
4. Requesting employee receives handover response notification
   ↓
5. Admin receives leave submission notification
   ↓
6. Admin reviews with full handover status visibility
   ↓
7. Admin approves/rejects
   ↓
8. Employee receives approval/rejection notification
```

## Database Changes

### LeaveApplication Model (Updated)
```javascript
{
  // ... existing fields ...
  
  // NEW: Handover fields
  handoverTo: ObjectId (ref: User),
  handoverStatus: String (Pending/Accepted/Denied),
  handoverRespondedAt: Date,
  handoverNote: String
}
```

### Notification Model (NEW)
```javascript
{
  recipient: ObjectId (ref: User, indexed),
  sender: ObjectId (ref: User),
  type: String (enum: LEAVE_*, TADA_*, TASK_*, MESSAGE_*),
  title: String,
  message: String,
  link: String (deep link to relevant page),
  relatedModel: String (LeaveApplication/TADAApplication/Task/Message),
  relatedId: ObjectId,
  isRead: Boolean (default: false, indexed),
  readAt: Date,
  timestamps: true
}
```

## Backend API Changes

### Leave Routes (Updated)
- **POST /api/leave** - Added `handoverTo` field validation and notifications
- **GET /api/leave/handover-requests** - NEW: Get handover requests for logged-in user
- **PATCH /api/leave/:id/handover/accept** - NEW: Accept handover responsibility
- **PATCH /api/leave/:id/handover/deny** - NEW: Deny handover (requires note)
- **PATCH /api/leave/:id/approve** - Added notification to employee
- **PATCH /api/leave/:id/reject** - Added notification to employee

### Notification Routes (NEW)
- **GET /api/notifications** - Get user's notifications (with isRead filter, limit param)
- **GET /api/notifications/unread-count** - Get count of unread notifications
- **PATCH /api/notifications/:id/read** - Mark single notification as read
- **PATCH /api/notifications/mark-all-read** - Mark all user's notifications as read
- **DELETE /api/notifications/:id** - Delete a notification

## Frontend Changes

### MyApplications.jsx (Updated)
**New Features:**
- **Handover Dropdown**: Employee list dropdown in leave form (excludes SuperAdmin and self)
- **Handover Requests Tab**: New third tab showing pending handover requests
- **Accept/Deny Handover**: Modal for responding to handover requests
- **Handover Status Display**: Shows handover person and status on leave cards
- **Visual Indicators**:
  - ✓ Accepted (green badge with UserCheck icon)
  - ✗ Denied (red badge with UserX icon)
  - ⏳ Pending (yellow badge with Clock icon)

**New State:**
```javascript
const [handoverRequests, setHandoverRequests] = useState([]);
const [employees, setEmployees] = useState([]);
const [showHandoverModal, setShowHandoverModal] = useState(null);
const [handoverAction, setHandoverAction] = useState('');
const [handoverNote, setHandoverNote] = useState('');
```

**New API Methods:**
- `api.getHandoverRequests()` - Load handover requests
- `api.acceptHandover(id, note)` - Accept handover
- `api.denyHandover(id, note)` - Deny handover (note required)

### AdminApprovals.jsx (Updated)
**New Features:**
- **Handover Visibility**: Shows handover employee name, role, and status
- **Status Badges**: Color-coded handover status with checkmark/cross icons
- **Handover Notes**: Displays acceptance/denial notes from handover employee

**UI Enhancements:**
- Indigo-themed handover info card
- Clear visual separation from other application details
- Emoji indicators (✓ ✗ ⏳) for quick status recognition

### API Library (Updated)
**New Methods:**
```javascript
// Handover
api.getHandoverRequests()
api.acceptHandover(id, handoverNote)
api.denyHandover(id, handoverNote)

// Notifications
api.getNotifications(isRead, limit)
api.getUnreadCount()
api.markNotificationRead(id)
api.markAllNotificationsRead()
api.deleteNotification(id)
```

## Validation Rules

### Handover Selection:
- ✅ Any active employee (except SuperAdmin)
- ❌ Cannot select self
- ❌ Cannot select SuperAdmin
- ✅ Optional field (can submit without handover)

### Handover Response:
- ✅ Only handover recipient can respond
- ✅ Can only respond to "Pending" status
- ❌ Denial requires a note explaining reason
- ✅ Acceptance can have optional note

### Notifications:
- ✅ Automatically sent on all workflow actions
- ✅ Include deep links to relevant pages
- ✅ Store sender for accountability
- ✅ Track read status for UI indicators

## Notification Trigger Points

| Action | Recipient(s) | Type | Link |
|--------|-------------|------|------|
| Employee submits leave | All Admins | LEAVE_SUBMITTED | /admin/approvals |
| Employee requests handover | Handover employee | LEAVE_HANDOVER_REQUEST | /my-applications |
| Handover employee accepts | Requesting employee | LEAVE_HANDOVER_ACCEPTED | /my-applications |
| Handover employee denies | Requesting employee | LEAVE_HANDOVER_DENIED | /my-applications |
| Admin approves leave | Employee | LEAVE_APPROVED | /my-applications |
| Admin rejects leave | Employee | LEAVE_REJECTED | /my-applications |

## UI/UX Improvements

### MyApplications Page:
1. **Three Tabs**: Leave / TA/DA / Handover Requests
2. **Handover Requests Tab**:
   - Employee card with avatar and role
   - Leave dates and duration in grid
   - Reason in highlighted box
   - Accept (green) / Deny (red) buttons
3. **Handover Modal**:
   - Color-coded header (green for accept, red for deny)
   - Summary of leave request
   - Note textarea (required for denial)
   - Action button matches header color

### AdminApprovals Page:
1. **Handover Info Card**:
   - Indigo background for visual distinction
   - Employee name and role
   - Status badge with emoji indicator
   - Handover notes displayed
2. **Status Badges**:
   - Green: ✓ Accepted
   - Red: ✗ Denied
   - Yellow: ⏳ Pending

### Leave Application Cards:
- Handover section shown only when handover exists
- Clear status indicator with icon
- Handover notes displayed inline
- Matches overall card design pattern

## Testing Checklist

### Handover Workflow:
- [ ] Employee can select handover person from dropdown
- [ ] Handover employee receives notification
- [ ] Handover employee sees request in Handover Requests tab
- [ ] Accept handover updates status and notifies requester
- [ ] Deny handover requires note and notifies requester
- [ ] Admin sees handover person and status in review
- [ ] Cannot select SuperAdmin as handover
- [ ] Cannot select self as handover
- [ ] Optional field works (can submit without handover)

### Notification System:
- [ ] Notifications created on all trigger points
- [ ] Unread count accurate
- [ ] Mark as read works
- [ ] Mark all as read works
- [ ] Delete notification works
- [ ] Deep links navigate correctly
- [ ] Sender information stored

### Admin Review:
- [ ] Handover status visible on pending applications
- [ ] Handover employee name and role displayed
- [ ] Status badge shows correct color and icon
- [ ] Handover notes visible to admin
- [ ] Can approve/reject regardless of handover status

### Edge Cases:
- [ ] Handover employee can respond only once
- [ ] Cannot respond to non-pending handover
- [ ] Requester notified on both accept and deny
- [ ] Admin notification sent even without handover
- [ ] System handles deleted handover employee gracefully

## Performance Considerations

### Database Indexes:
- **LeaveApplication**: Existing indexes sufficient, handoverTo queries rare
- **Notification**: 
  - `{ recipient: 1, isRead: 1, createdAt: -1 }` - Main query pattern
  - `{ recipient: 1, type: 1, createdAt: -1 }` - Type filtering
  - Single field indexes on recipient and isRead

### Query Optimization:
- Handover requests use dedicated endpoint (not full application scan)
- Notifications limited by default (50 per request)
- Unread count uses efficient countDocuments
- Populates only necessary fields (name, email, role)

## Future Enhancements

- [ ] Real-time notifications via WebSocket
- [ ] Email notifications for critical actions
- [ ] Notification preferences (opt-out per type)
- [ ] Bulk handover management for team leads
- [ ] Handover checklist/tasks system
- [ ] Notification center UI component
- [ ] Push notifications for mobile app
- [ ] Notification aggregation (group similar notifications)
- [ ] Notification scheduling (remind before deadline)
- [ ] Handover history tracking per employee

## Security Notes

1. **Authorization**: All handover endpoints verify user is the handover recipient
2. **Validation**: Handover employee must exist and not be SuperAdmin
3. **Immutability**: Once responded, handover status cannot change
4. **Audit Trail**: All handover actions timestamped with responder
5. **Notifications**: Only recipient can read/delete their notifications
6. **Privacy**: Notifications don't expose sensitive data to other users
