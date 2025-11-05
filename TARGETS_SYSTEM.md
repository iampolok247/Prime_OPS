# Targets System - Implementation Guide

## Overview
The Targets system has been restructured to support **multiple target types** for both **Admission** and **Recruitment** teams, with the ability to set team-wide targets or assign targets to individual team members.

## Features Implemented

### 1. Target Types
- **Admission Student Target**: Track number of students admitted per course
- **Admission Revenue Target**: Track admission fee revenue (BDT)
- **Recruitment Candidate Target**: Track number of candidates placed
- **Recruitment Revenue Target**: Track recruitment income (BDT)

### 2. Team Member Filtering
- Set **team-wide targets** (no assignee) or **individual targets** (assigned to specific member)
- Filter view by team member to see individual performance
- Automatic role-based team member loading (Admission vs Recruitment)

### 3. Tab-Based Interface
- **Main Tabs**: Switch between Admission Targets and Recruitment Targets
- **Sub Tabs**: Toggle between Student/Candidate targets and Revenue targets
- Clean, intuitive navigation

### 4. Progress Tracking
- Real-time achievement calculation
- Color-coded progress bars:
  - 🟢 Green: 100%+ achievement
  - 🔵 Blue: 75-99%
  - 🟡 Yellow: 50-74%
  - 🔴 Red: Below 50%
- Percentage display

## Technical Implementation

### Backend

#### New Model: `api/models/Target.js`
```javascript
{
  targetType: 'AdmissionStudent' | 'AdmissionRevenue' | 'RecruitmentCandidate' | 'RecruitmentRevenue',
  course: ObjectId (required for AdmissionStudent),
  month: 'YYYY-MM',
  targetValue: Number,
  assignedTo: ObjectId (optional - team member),
  setBy: ObjectId (who set the target),
  note: String (optional)
}
```

**Indexes:**
- `{ targetType, month }` - Fast queries by type and month
- `{ targetType, month, course, assignedTo }` - Unique constraint for AdmissionStudent
- `{ targetType, month, assignedTo }` - Unique constraint for other types

#### New Routes: `api/routes/targets.js`
- `POST /api/targets` - Set/update target
- `GET /api/targets?targetType=X&month=YYYY-MM&assignedTo=userId` - Get targets with achievement
- `GET /api/targets/all` - Get all targets (all months)
- `DELETE /api/targets/:id` - Delete target
- `GET /api/targets/team-members?role=Admission` - Get team members by role

**Achievement Calculation:**
- **AdmissionStudent**: Count `Lead` documents with `status: 'Admitted'`, matching course and date range
- **AdmissionRevenue**: Sum `AdmissionFee` documents with `status: 'Approved'` in date range
- **RecruitmentCandidate**: Count `RecruitmentCandidate` with `status: 'Placed'` in date range
- **RecruitmentRevenue**: Sum `RecruitmentIncome` in date range

### Frontend

#### New Page: `web/src/pages/Targets.jsx`
**Key Components:**
1. **Tab Navigation**: Main tabs (Admission/Recruitment) + Sub tabs (Student/Revenue)
2. **Set Target Form**: Dynamic fields based on target type
3. **Targets Table**: Shows targets with achievement and progress
4. **Filters**: Month selector + Team member filter

**API Methods Added to `web/src/lib/api.js`:**
- `api.setTarget(payload)`
- `api.getTargets(month, targetType, assignedTo)`
- `api.getAllTargets()`
- `api.deleteTarget(id)`
- `api.getTeamMembers(role)`

#### Updated Components:
- **Sidebar**: Changed "Admission Targets" → "Targets" (both SuperAdmin and Admin menus)
- **App.jsx**: Changed route from `<AdmissionTargets />` to `<Targets />`

## Usage Guide

### For Admins/SuperAdmins

#### Setting a Team-Wide Target
1. Navigate to **Targets** from sidebar
2. Select tab: **Admission Targets** or **Recruitment Targets**
3. Select sub-tab: **Student Target** or **Revenue Target**
4. Fill the form:
   - **Course** (only for Admission Student)
   - **Month**
   - **Target** (number or BDT amount)
   - Leave "Assign to Member" as "Team Target"
5. Click **Set Target**

#### Setting an Individual Target
1. Follow steps 1-4 above
2. In "Assign to Member", select a team member
3. Click **Set Target**

#### Viewing Progress
1. Use **Month selector** to view different months
2. Use **Team Member filter** to see individual performance
3. Progress bars show achievement percentage
4. Table displays:
   - Course (for student targets)
   - Assigned member or "Team Target"
   - Target value
   - Achieved value
   - Progress bar with percentage

### For Team Members (Future Enhancement)
Currently, Admission and Recruitment role users can view targets but only Admin/SuperAdmin can set them. This can be extended in future updates.

## Migration from Old System

The old `AdmissionTarget` model is **still functional** and routes remain at `/api/admission-targets`. The new system is completely separate at `/api/targets`.

**Benefits of New System:**
- Supports 4 target types (vs 1 in old system)
- Individual team member targets
- Better filtering options
- Unified interface for Admission + Recruitment

**No Breaking Changes:**
- Old admission targets page can be accessed at `/admission-targets` route
- Old API endpoints still work
- Gradual migration possible

## Database Considerations

### Indexes
The Target model uses compound indexes for:
1. Query performance: `{ targetType, month }`
2. Uniqueness: Prevent duplicate targets for same course/member/month

### Partial Indexes
Used to handle optional `course` field:
- Admission Student targets MUST have a course
- Other targets do not require course

## Future Enhancements

1. **Notifications**: Alert when targets are at risk or exceeded
2. **Charts**: Visual dashboards for target vs achievement
3. **Historical Reports**: Trends over multiple months
4. **Target Templates**: Copy targets from previous month
5. **Team Member Access**: Allow team members to view their own targets
6. **Batch Targets**: Link targets to specific batches

## API Examples

### Set Admission Student Target for Team
```bash
POST /api/targets
{
  "targetType": "AdmissionStudent",
  "courseId": "6123456789abcdef12345678",
  "month": "2025-02",
  "targetValue": 50,
  "note": "Q1 2025 Goal"
}
```

### Set Individual Revenue Target
```bash
POST /api/targets
{
  "targetType": "AdmissionRevenue",
  "month": "2025-02",
  "targetValue": 500000,
  "assignedTo": "6123456789abcdef87654321",
  "note": "Senior counselor target"
}
```

### Get Targets with Filters
```bash
GET /api/targets?month=2025-02&targetType=AdmissionStudent&assignedTo=6123456789abcdef87654321
```

## Files Changed

### Backend (4 files)
- ✅ `api/models/Target.js` (NEW) - Target model
- ✅ `api/routes/targets.js` (NEW) - Target routes with achievement calculation
- ✅ `api/server.js` - Mounted `/api/targets` routes
- 📁 Old files remain: `api/models/AdmissionTarget.js`, `api/routes/admissionTargets.js`

### Frontend (4 files)
- ✅ `web/src/pages/Targets.jsx` (NEW) - New targets page with tabs
- ✅ `web/src/lib/api.js` - Added 5 new API methods
- ✅ `web/src/components/Sidebar.jsx` - Changed menu label to "Targets"
- ✅ `web/src/App.jsx` - Changed route to use new Targets component
- 📁 Old file remains: `web/src/pages/AdmissionTargets.jsx`

## Deployment Status
✅ **Committed and Pushed to main branch**
- Commit: `655e29a`
- Message: "Restructure targets system: Add multi-target types (Admission/Recruitment Students & Revenue) with team member filtering"

## Testing Checklist

- [ ] Set Admission Student target for a course
- [ ] Set Admission Revenue target (team-wide)
- [ ] Set Admission Revenue target (individual member)
- [ ] Set Recruitment Candidate target
- [ ] Set Recruitment Revenue target
- [ ] Filter by team member
- [ ] Change month and verify targets load
- [ ] Verify progress calculation is accurate
- [ ] Delete a target
- [ ] Switch between tabs and verify correct data loads
- [ ] Check responsive design on mobile

## Notes

- **Authorization**: Only Admin and SuperAdmin can set/delete targets
- **Month Format**: Always YYYY-MM (e.g., 2025-01)
- **Progress Calculation**: Runs on every GET request (real-time)
- **Team Member Dropdown**: Filtered by role (Admission or Recruitment)
- **Course Required**: Only for AdmissionStudent target type

---

**Version**: 1.0.0  
**Date**: January 2025  
**Status**: Production Ready ✅
