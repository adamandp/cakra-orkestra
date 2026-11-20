export const workflowSteps = [
  { title: "Project", admin: "Create projects, set owners and status, and manage the Team tab. Remove members only after unfinished tasks are resolved.", member: "Open projects you own or belong to. Review project details and team membership." },
  { title: "Create task", admin: "Create tasks in active projects and assign eligible team members or yourself. Add scope and checklists; INITIAL assessment estimates points.", member: "Create your own tasks in accessible active projects. Define title, description, classification, due date and checklists before saving." },
  { title: "Execute", admin: "Use My Focus for your own assigned tasks. In Task Management, monitor all tasks, edit eligible descriptions and checklists, or block in-progress work.", member: "Use My Focus to start, block or resume your assigned tasks. Update descriptions and checklists; mark checklist items complete while in progress." },
  { title: "Submit evidence", admin: "For your own tasks, attach evidence in My Focus and submit after all checklist items are complete.", member: "Attach at least one evidence item in My Focus, complete all checklist items, then submit for approval." },
  { title: "Review and assess", admin: "Review other assignees' pending tasks in Approval Queue. Approve or request revision with a reason; approval queues FINAL assessment.", member: "Wait for admin review. If returned for revision, resume work in PROGRESS and resubmit after addressing feedback." },
  { title: "Complete", admin: "Retry failed eligible assessments. Successful FINAL assessment marks the task DONE; review official scores in Scores.", member: "Once FINAL assessment succeeds, the task is DONE. View completed tasks and their details in Task History (read-only)." },
];

export const statusTransitions = [
  { from: "OPEN", action: "Start (assignee)", to: "PROGRESS" },
  { from: "PROGRESS", action: "Block with reason (assignee or admin)", to: "BLOCKED" },
  { from: "BLOCKED", action: "Resume (assignee)", to: "PROGRESS" },
  { from: "PROGRESS", action: "Submit with completed checklists and evidence (assignee)", to: "PENDING" },
  { from: "PENDING", action: "Request revision with reason (reviewing admin)", to: "PROGRESS" },
  { from: "PENDING", action: "Admin approval + successful FINAL assessment", to: "DONE" },
];

export const permissionRows = [
  { action: "View attendance / report absence", admin: "All active users / own status", member: "All active users / own status" },
  { action: "View Activity Log", admin: "Own activity", member: "Own activity" },
  { action: "My Focus and completed Task History", admin: "Own tasks", member: "Own tasks" },
  { action: "View projects and team", admin: "All", member: "Owned / assigned" },
  { action: "Create tasks in active projects", admin: "Eligible assignee", member: "Self only" },
  { action: "Edit description; add, edit, reorder checklists", admin: "All editable tasks", member: "Own editable tasks" },
  { action: "Remove checklist items (UI)", admin: "Yes", member: "Own editable tasks*" },
  { action: "Complete checklist items", admin: "Own, in progress", member: "Own, in progress" },
  { action: "Start, resume, submit", admin: "Own only", member: "Own only" },
  { action: "Block in-progress tasks", admin: "All", member: "Own only" },
  { action: "Manage evidence in My Focus", admin: "Own only", member: "Own only" },
  { action: "Edit task scope, reassign or delete after creation", admin: "Not exposed in current inspector", member: "No" },
  { action: "Approve or request revision", admin: "Others' pending tasks", member: "No" },
  { action: "Retry failed INITIAL assessment", admin: "Eligible tasks", member: "Own eligible tasks" },
  { action: "Retry failed FINAL assessment", admin: "Approved pending tasks", member: "No" },
  { action: "Create/edit projects, owner, status and team", admin: "Yes", member: "No" },
  { action: "View changelogs", admin: "All accessible", member: "Accessible projects" },
  { action: "Create, edit or delete releases", admin: "Yes", member: "No" },
  { action: "Task Management / Approval Queue / Blocker Radar", admin: "Yes", member: "No" },
  { action: "Scores: leaderboard and user score history", admin: "Yes", member: "No" },
  { action: "Create/edit users, change roles and activation", admin: "Yes (self role/status protected)", member: "No" },
];

export const roleGuides = {
  ADMIN: [
    { title: "Attendance", description: "Everyone defaults to Present. Report your own absence or WFH for a selected date or range." },
    { title: "Activity Log", description: "Review your own authentication events and workspace changes with search and resource filters." },
    { title: "Task Management", description: "Monitor active tasks, open task details, inspect blockers, and use Approval Queue actions to jump to review or assessment. Task History is read-only." },
    { title: "Projects Management", description: "Create projects, edit overview fields, change status, and manage owner and members in Team. Resolve unfinished tasks before removing members." },
    { title: "Changelog", description: "Create independent project releases, edit release cards or delete a release with confirmation." },
    { title: "Scores", description: "View monthly rankings and switch users in Score History to review verified contributions. Only successful FINAL points count." },
    { title: "User Management", description: "Create accounts with username, password, confirmation and role. Name defaults to username. Open User Details to edit profile, role or activation; role/status changes require confirmation. You cannot change your own role or activation." },
  ],
  MEMBER: [
    { title: "Attendance", description: "Everyone defaults to Present. Report your own absence or WFH for a selected date or range." },
    { title: "Activity Log", description: "Review your own sign-ins and workspace changes. Other accounts’ logs are not accessible." },
    { title: "My Focus", description: "Manage your assigned active tasks, checklists, evidence and workflow. Report blockers and submit completed work for review." },
    { title: "Task History", description: "Filter your completed tasks by month and open their read-only details." },
    { title: "Changelog", description: "View releases for accessible projects. Release creation, editing and deletion are admin-only." },
  ],
};
