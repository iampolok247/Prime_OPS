# Leave & TA/DA Application System

## Overview
Complete employee leave and travel allowance (TA/DA) application system with multi-stage approval workflow.

## Features Implemented

### 1. Leave Application System
- **Employee Actions:**
  - Apply for leave with type, dates, and reason
  - View all submitted applications and their status
  - Track approval/rejection with admin review notes

- **Admin Actions:**
  - View all leave applications with status filtering
  - Approve or reject applications with optional review notes
  - See employee details and leave duration

- **Leave Types:**
  - Sick Leave
  - Casual Leave
  - Annual Leave
  - Emergency Leave
  - Unpaid Leave
  - Other

### 2. TA/DA Application System
- **Employee Actions:**
  - Apply for travel/dearness allowance
  - Choose application type (TA, DA, or TA+DA)
  - Specify travel date, destination, amount, and purpose
  - Track both admin approval and payment status

- **Admin Actions:**
  - Review TA/DA applications
  - Approve (sends to accountant) or reject with reason
  - View employee details and application information

- **Accountant Actions:**
  - View admin-approved TA/DA applications
  - Process payments with optional payment notes
  - Track pending vs paid amounts
  - View payment history

### 3. Workflow States

#### Leave Workflow:
```
Employee Submits → Pending → Admin Reviews → Approved/Rejected
```

#### TA/DA Workflow:
```
Employee Submits → Admin Review (Pending) → Admin Approves/Rejects
                                          ↓
                                   Payment Pending → Accountant Pays → Paid
```

## Authorization Rules

### Who Can Apply?
- ✅ Admin
- ✅ Accountant
- ✅ Admission
- ✅ Recruitment
- ✅ Digital Marketing
- ✅ Motion Graphics
- ✅ Coordinator
- ❌ SuperAdmin (cannot apply - observer role)

### Who Can Approve?
- Admin
- SuperAdmin (view and approve only)

### Who Can Process Payments?
- Accountant
- Admin (can view)
- SuperAdmin (can view)

## Routes Added

### Frontend Routes:
- `/my-applications` - Employee interface (all roles except SuperAdmin)
- `/admin/approvals` - Admin review interface (Admin, SuperAdmin)
- `/accounting/tada-payments` - Accountant payment processing (Accountant, Admin, SuperAdmin)

### Backend Routes:

#### Leave API (`/api/leave`)
- `POST /` - Submit leave application
- `GET /my-applications` - Employee's own applications
- `GET /` - All applications (Admin, with status filter)
- `PATCH /:id/approve` - Admin approves
- `PATCH /:id/reject` - Admin rejects (requires reviewNote)

#### TA/DA API (`/api/tada`)
- `POST /` - Submit TA/DA application
- `GET /my-applications` - Employee's own applications
- `GET /admin` - Applications for admin review (with adminStatus filter)
- `GET /accountant` - Approved applications for payment (with paymentStatus filter)
- `PATCH /:id/approve` - Admin approves (sends to accountant)
- `PATCH /:id/reject` - Admin rejects (requires adminReviewNote)
- `PATCH /:id/pay` - Accountant marks as paid (optional paymentNote)

## Database Models

### LeaveApplication Schema
```javascript
{
  employee: ObjectId (ref: User),
  leaveType: String (enum),
  startDate: Date,
  endDate: Date,
  totalDays: Number (auto-calculated),
  reason: String,
  status: String (Pending/Approved/Rejected),
  reviewedBy: ObjectId (ref: User),
  reviewedAt: Date,
  reviewNote: String,
  timestamps: true
}
```

### TADAApplication Schema
```javascript
{
  employee: ObjectId (ref: User),
  applicationType: String (TA/DA/TA+DA),
  purpose: String,
  travelDate: Date,
  destination: String,
  amount: Number,
  description: String,
  
  // Admin Review Stage
  adminStatus: String (Pending/Approved/Rejected),
  adminReviewedBy: ObjectId (ref: User),
  adminReviewedAt: Date,
  adminReviewNote: String,
  
  // Payment Stage
  paymentStatus: String (Pending/Paid),
  paidBy: ObjectId (ref: User),
  paidAt: Date,
  paymentNote: String,
  
  timestamps: true
}
```

## UI Features

### MyApplications Page
- Quick action buttons for applying leave or TA/DA
- Tabbed interface showing leave and TA/DA applications separately
- Status badges with color coding:
  - 🟡 Pending - Yellow
  - 🟢 Approved - Green
  - 🔴 Rejected - Red
  - 🔵 Paid - Blue
- Modal forms for submitting applications
- View review notes and payment notes
- Shows reviewer/accountant names and timestamps

### AdminApprovals Page
- Tabbed interface for leave and TA/DA applications
- Status filter (All/Pending/Approved/Rejected)
- Employee avatars with initials
- Action buttons (Approve/Reject) for pending applications
- Review modal with required notes for rejection
- Shows application details, dates, amounts
- "Sent to Accountant" indicator for approved TA/DA

### TADAPayments Page
- Summary cards showing:
  - Total pending payment amount
  - Total paid amount
- Payment status filter (All/Pending/Paid)
- Large amount display with BDT formatting
- Employee details with avatar
- "Process Payment" button for pending items
- Payment modal with confirmation
- Payment history with accountant name and timestamp

## Sidebar Menu Updates

### Added Menu Items:
- **All Employees (except SuperAdmin):** "My Applications" with ClipboardList icon
- **Admin/SuperAdmin:** "Application Approvals" with CheckSquare icon
- **Accountant/Admin/SuperAdmin:** "TA/DA Payments" with DollarSign icon

## Testing Checklist

### Leave Application Flow
- [ ] Employee can submit leave application
- [ ] Admin can view all pending applications
- [ ] Admin can approve leave with optional note
- [ ] Admin can reject leave with required note
- [ ] Employee can see updated status and review notes
- [ ] Status filter works (All/Pending/Approved/Rejected)

### TA/DA Application Flow
- [ ] Employee can submit TA/DA application
- [ ] Admin can view pending TA/DA applications
- [ ] Admin can approve TA/DA (sends to accountant)
- [ ] Admin can reject TA/DA with required note
- [ ] Accountant can see approved TA/DA applications
- [ ] Accountant can process payment
- [ ] Employee can see both admin and payment status
- [ ] Payment summary cards show correct totals

### Authorization Tests
- [ ] SuperAdmin cannot access /my-applications
- [ ] SuperAdmin can approve applications
- [ ] Non-admin users cannot access /admin/approvals
- [ ] Non-accountant users cannot access /accounting/tada-payments
- [ ] Users can only see their own applications in My Applications

### UI/UX Tests
- [ ] Modal forms validate required fields
- [ ] Date inputs work correctly
- [ ] Amount input accepts numbers only
- [ ] Status badges display correct colors
- [ ] Tabs switch between leave and TA/DA
- [ ] Filters update application lists
- [ ] Mobile responsive design works

## Notes

1. **SuperAdmin Exclusion:** SuperAdmin role is intentionally excluded from applying for leave/TA/DA as they are observers, not task executors.

2. **Two-Stage TA/DA Workflow:** TA/DA applications have separate admin and payment stages to ensure proper approval before disbursement.

3. **Auto-Calculation:** Leave duration (totalDays) is calculated on the backend to avoid client-server discrepancies.

4. **Required Review Notes:** Rejections require a review note to ensure employees understand why their application was denied.

5. **Payment Tracking:** TA/DA payments track both the accountant who processed it and the timestamp for audit purposes.

6. **Status Synchronization:** Applications use separate status fields for different stages (adminStatus, paymentStatus) to maintain workflow clarity.

## Future Enhancements

- [ ] Email notifications on status changes
- [ ] Leave balance tracking per employee
- [ ] Annual leave quota system
- [ ] Bulk approval functionality
- [ ] Export applications to PDF/Excel
- [ ] Leave calendar view
- [ ] TA/DA approval limits based on amount
- [ ] Multi-level approval for high-value TA/DA
- [ ] Mobile app integration
- [ ] Dashboard widgets for pending approvals
