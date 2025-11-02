# PrimeOPS AI Agent Instructions

## Project Overview
PrimeOPS is a full-stack ERP system for Prime Academy, managing leads, admissions, recruitment, accounting, task management, digital marketing metrics, and motion graphics production. The stack is **Node.js + Express + MongoDB** (backend) and **React + Vite + Tailwind** (frontend).

## Architecture Patterns

### Monorepo Structure
- `/api` - Backend Express server (port 5001)
- `/web` - Frontend React SPA (port 5173)
- Root `package.json` only for deployment scripts (`vercel-build`)

### Authentication Flow
**Backend:** JWT tokens stored in httpOnly cookies + Bearer token support for cross-origin
- Middleware: `requireAuth` (auth.js) extracts token from cookie OR `Authorization` header
- All routes use `requireAuth`, plus `authorize([roles])` for role-specific access
- User model enum: `SuperAdmin | Admin | Accountant | Admission | Recruitment | DigitalMarketing | MotionGraphics`

**Frontend:** Token stored in `localStorage.getItem('auth_token')` for cross-origin deployments
- `AuthContext` manages `user` state, restores session on mount via `api.me()`
- `authFetch()` wrapper (api.js) auto-injects Bearer token into headers
- `ProtectedRoute` guards all authenticated pages, `RoleRoute` filters by role array

### Role-Based Access Pattern
**SuperAdmin cannot be assigned tasks** (enforced in POST `/api/tasks/assign`)
- All roles see "Task Board" in sidebar but data filtered by role
- Multi-role routes use `<RoleRoute roles={['A', 'B']} />` wrapper
- Example: Admission dashboard visible to `Admission`, `Admin`, `SuperAdmin`

### API Conventions
- **Base URL Logic:** `import.meta.env.PROD` → production API, else localhost (api.js L5-14)
- **Error format:** `{ code: 'ERROR_CODE', message: 'Human message' }`
- **Success format:** `{ data/task/user: {...} }` (singular keys, not arrays in top-level)
- **Dates:** Backend stores ISO 8601, frontend uses `DD/MM/YYYY` in UI, `_normalizeDate()` converts

### MongoDB Schema Patterns
**User Schema:**
- No `password` field in API responses (`select: false`)
- `isActive: true` required for assignments
- `avatar` defaults to ui-avatars.com

**Task Schema:**
- `assignedTo` is ARRAY (multi-user assignments)
- `boardColumn` syncs with `status` but used for Kanban positioning
- `notificationsSent` object tracks automation state (not yet implemented)
- `checklist`, `comments`, `attachments` are nested schemas

**Lead Schema:**
- Unique `leadId` auto-generated (LEAD-YYYY-NNNN)
- `assignedBy` = DM user, `assignedTo` = Admission member
- `status` flows: `Assigned → Counseling → In Follow Up → Admitted/Not Admitted`
- `followUps` array stores history with `by` user reference

## Critical Workflows

### Development Setup
```bash
# Backend
cd api && npm install
cp .env.sample .env  # Set MONGO_URI, JWT_SECRET, CLIENT_ORIGIN
npm run seed         # Creates 10 default users, password: password123
npm run dev          # Starts nodemon on port 5001

# Frontend
cd web && npm install
npm run dev          # Starts Vite on port 5173
```

### Deployment (Vercel + Render)
- **Frontend:** Vercel auto-deploys from `production` branch
  - Build: `cd web && npm install && npm run build`
  - Output: `web/dist`
  - Env var: `VITE_API_BASE=https://prime-ops-api.onrender.com`
- **Backend:** Render deploys `api/` directory
  - Start: `node server.js`
  - Env: `MONGODB_URI`, `JWT_SECRET`, `NODE_ENV=production`

### Git Branching
- `main` - development/unstable
- `test` - feature testing (Task Management Module lives here)
- `production` - Vercel deployment trigger

### Adding New Routes
1. Create model in `api/models/` (use Mongoose schemas, timestamps: true)
2. Create route file in `api/routes/` (use `requireAuth`, `authorize([roles])`)
3. Mount in `api/server.js` BEFORE 404 handler: `app.use('/api/path', routes)`
4. Add API methods in `web/src/lib/api.js` using `authFetch()` wrapper
5. Create page component in `web/src/pages/`
6. Add route in `web/src/App.jsx` within `<ProtectedRoute>`, use `<RoleRoute>` if role-specific
7. Add sidebar menu item in `web/src/components/Sidebar.jsx` per role in `MENU_BY_ROLE`

## Project-Specific Quirks

### No SuperAdmin Task Assignments
Block in backend: `if (isSuperAdmin(toUser)) { return 403 }`
- Rationale: SuperAdmins are observers, not task executors

### Drag-and-Drop Library
Uses `@dnd-kit` (not react-beautiful-dnd) for Kanban board
- Requires `DndContext`, `SortableContext`, `useSortable` hooks
- Pointer sensor with 8px activation distance prevents accidental drags

### Multi-Origin CORS
`ALLOWED_ORIGINS` array in server.js includes localhost variants + Vercel subdomains
- Also allows any `*.vercel.app` subdomain matching `prime-ops`

### Date Formatting Helpers
- `fmtBDT(n)` - Bengali locale currency (৳)
- `fmtBDTEn(n)` - English locale BDT with Latin digits
- `fmtDate(d)` - DD.MM.YYYY format

### Notification Tracking (Not Implemented)
Task model has `notificationsSent` booleans for:
- Assignment, due soon, overdue, completion alerts
- Requires background job scheduler (cron/BullMQ) - not yet built

## Common Gotchas

1. **401 Errors in Production:** Check `localStorage.getItem('auth_token')` exists, verify `VITE_API_BASE` points to correct backend
2. **Task Board Empty:** User role might not have access, or `assignedTo` filter active (SuperAdmins see all, others see assigned tasks)
3. **Mongoose Timestamps:** Always use `{ timestamps: true }` - provides `createdAt`, `updatedAt`
4. **Populate Fields:** Use `.populate('field', 'name email role')` to avoid sending full User objects with passwords
5. **Status vs BoardColumn:** Task has both - `status` for business logic, `boardColumn` for Kanban UI state

## File Reference Examples

**Authentication Pattern:**
- Backend: `api/middleware/auth.js`, `api/routes/auth.js`
- Frontend: `web/src/context/AuthContext.jsx`, `web/src/components/ProtectedRoute.jsx`

**Task Management (test branch):**
- Model: `api/models/Task.js` (multi-assignee, checklist, comments)
- Routes: `api/routes/tasks.js` (10 endpoints)
- UI: `web/src/pages/TasksKanban.jsx`, `web/src/components/TaskCreateModal.jsx`, `web/src/components/TaskDetailModal.jsx`

**Role-Based UI:**
- `web/src/components/Sidebar.jsx` - `MENU_BY_ROLE` object defines per-role navigation
- `web/src/components/RoleRoute.jsx` - Wrapper for route-level role checks
- `web/src/App.jsx` - All protected routes nested in `<ProtectedRoute>` with `<RoleRoute>` for specific roles

**Lead Flow:**
- Model: `api/models/Lead.js` (status enum, followUps array)
- DM Entry: `web/src/pages/LeadEntry.jsx` (creates leads, assigns to Admission)
- Admission Pipeline: `web/src/pages/AdmissionPipeline.jsx` (status-based views)

## Testing Credentials
See `api/seed.js` for 10 seeded users:
- **SuperAdmin:** `ikhtiar@primeacademy.org` / `password123`
- **Admin:** `shahidul@primecademy.org` / `password123`
- **DM:** `polok@primeacademy.org` / `password123`
- All default password: `password123`
