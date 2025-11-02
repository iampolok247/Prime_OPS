# Task Management Module - Quick Start Guide

## 🚀 Getting Started

### Access the Task Board
1. **Login** to PrimeOPS with your credentials
2. **Click** "Task Board" in the left sidebar
3. **Explore** the Kanban board with 5 columns

## 📋 Creating a New Task

### Method 1: From Header Button
1. Click the blue **"New Task"** button in the top right
2. Fill in the form:
   - **Title** (required) - Short, descriptive name
   - **Description** - Detailed information about the task
   - **Assign To** (required) - Hold Ctrl/Cmd to select multiple users
   - **Priority** - Low, Medium, High, or Critical
   - **Due Date** - Optional deadline
   - **Tags** - Click to toggle (Marketing, Design, etc.)
   - **Checklist** - Add subtasks with + button
3. Click **"Create Task"**

### Method 2: From Column Header
1. Click the **+ icon** in any column header
2. Same form as above

## 🎯 Working with Tasks

### View Task Details
- **Click any task card** to open the detail modal
- View:
  - Full description
  - All assigned users
  - Complete checklist
  - Comments thread
  - Attachments
  - Task history

### Edit a Task
1. Open task detail modal
2. Click **"Edit Task"** button (bottom right)
3. Make changes
4. Click **"Save Changes"**

### Move Tasks (Drag & Drop)
1. **Click and hold** on a task card
2. **Drag** to the target column
3. **Release** to drop
4. Status updates automatically!

### Add a Comment
1. Open task detail modal
2. Scroll to comments section
3. Type your comment
4. Click **Send** icon
5. Use `@username` to mention someone (future feature)

### Complete Checklist Items
1. Open task detail modal
2. Find the checklist section
3. **Click checkbox** next to any item
4. Progress updates automatically

### Add to Checklist
1. Open task detail modal
2. Scroll to checklist section
3. Type new item in text box
4. Press **Enter** or click **+ button**

## 🎨 Visual Indicators

### Priority Badges (Top Right of Card)
- 🔵 **Blue** = Low Priority
- 🟡 **Yellow** = Medium Priority
- 🟠 **Orange** = High Priority
- 🔴 **Red** = Critical Priority

### Status Indicators (Column Colors)
- ⚫ **Grey** = Backlog
- ⚪ **Light Grey** = To Do
- 🔵 **Blue** = In Progress
- 🟣 **Purple** = In Review
- 🟢 **Green** = Completed

### Special Indicators
- 🚨 **Red "Overdue"** badge = Past due date
- ☑️ **Checklist progress** = "3/5" means 3 of 5 items done
- 💬 **Number** = Comment count
- 📎 **Number** = Attachment count
- 👥 **Avatars** = Assigned users (shows first 3)

## 🔍 Filtering & Search

### Search Bar
- Type keywords to filter by task **title**
- Real-time filtering as you type

### Priority Filter
- Dropdown to show only tasks of specific priority
- Select "All Priorities" to clear filter

### Tag Filter
- Dropdown to show only tasks with specific tag
- Select "All Tags" to clear filter

### Combine Filters
- Use search + priority + tag together
- All active filters apply simultaneously

## 👥 Permissions

### SuperAdmin / Admin
- ✅ View **all tasks** (everyone's)
- ✅ Create new tasks
- ✅ Edit any task
- ✅ Delete any task
- ✅ Assign tasks to anyone

### Other Roles (DM, Admission, Accountant, etc.)
- ✅ View **assigned tasks** only
- ✅ Create new tasks
- ✅ Edit tasks assigned to you
- ✅ Edit tasks you created
- ❌ Cannot delete tasks
- ✅ Assign tasks to anyone

## ⚡ Keyboard Shortcuts

*Coming in future update*
- `N` - New Task
- `Esc` - Close modal
- `/` - Focus search

## 📱 Mobile Support

The Task Board is **fully responsive**:
- ✅ Works on tablets
- ✅ Works on smartphones
- ✅ Swipe to scroll columns
- ✅ Tap to open task details

## 🔔 Notifications

### Current (Manual)
- Task creators see completed tasks when they refresh
- Users see new assignments when they open Task Board

### Coming Soon (Automated)
- 📧 Email when task assigned to you
- 🔔 In-app notification when task completed
- ⏰ Alert 24h before due date
- 🚨 Daily alerts for overdue tasks

## 🐛 Troubleshooting

### Task won't drag?
- Try clicking elsewhere first
- Refresh the page
- Make sure you clicked directly on the card (not buttons)

### Can't see some tasks?
- Check your role (non-admins only see assigned tasks)
- Clear all filters
- Check if task is in different column

### Changes not saving?
- Check internet connection
- Look for red error messages
- Refresh and try again

### Build failed?
- Run `npm install` in web folder
- Check all dependencies are installed
- Run `npm run build` to see specific errors

## 💡 Best Practices

### 1. **Clear Titles**
   - ❌ "Do the thing"
   - ✅ "Design login page mockup"

### 2. **Use Priorities Wisely**
   - **Critical**: Business-stopping issues only
   - **High**: Important but not urgent
   - **Medium**: Regular tasks (default)
   - **Low**: Nice-to-have improvements

### 3. **Set Realistic Due Dates**
   - Add buffer time
   - Consider dependencies
   - Update if timeline changes

### 4. **Break Down Large Tasks**
   - Use checklist for subtasks
   - Create separate tasks if needed
   - Keep titles specific

### 5. **Comment for Context**
   - Add updates as you work
   - Explain blockers
   - Ask questions
   - Share links/resources

### 6. **Use Tags Consistently**
   - **Marketing**: Campaigns, ads, social media
   - **Design**: UI/UX, graphics, branding
   - **Content**: Writing, video, documentation
   - **HR**: Recruitment, onboarding, training
   - **Finance**: Budget, invoices, payroll
   - **IT**: Technical, servers, bugs
   - **Admin**: Operations, compliance
   - **Management**: Planning, strategy, meetings

## 🎓 Example Workflow

### Scenario: New blog post needed

1. **Create Task**
   - Title: "Write blog post: 5 Tips for Digital Marketing"
   - Assign: Content Writer + Marketing Manager
   - Priority: Medium
   - Due: 1 week from now
   - Tags: Content, Marketing
   - Checklist:
     - [ ] Research topic
     - [ ] Write first draft
     - [ ] Add images
     - [ ] Internal review
     - [ ] Final edits

2. **Writer Starts Work**
   - Drag to "In Progress"
   - Add comment: "Starting research today"

3. **Writer Updates Progress**
   - Check off: ✅ Research topic
   - Add comment: "Draft ready for review"

4. **Manager Reviews**
   - Add comment: "Great start! Please add more examples in section 2"

5. **Writer Finalizes**
   - Check off remaining items
   - Drag to "In Review"

6. **Manager Approves**
   - Add comment: "Approved! Ready to publish"
   - Drag to "Completed"

## 📞 Support

Having issues? Contact:
- **Technical Support**: IT team
- **Feature Requests**: SuperAdmin
- **Bug Reports**: Create a task with "IT" tag!

---

**Version**: 1.0.0  
**Last Updated**: January 2025  
**Branch**: test
