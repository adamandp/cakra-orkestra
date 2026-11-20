export const workflowSteps = [
  { title: "Project", description: "Admin creates a project and manages its members." },
  { title: "Create task", description: "Describe the work and add checklists. INITIAL assessment estimates the points." },
  { title: "Execute", description: "Start the task, complete checklists and report blockers when needed." },
  { title: "Submit evidence", description: "Attach valid files or links and submit the task for approval." },
  { title: "Review and assess", description: "Admin verifies the evidence, approves or requests revision. Approval triggers FINAL assessment." },
  { title: "Complete", description: "After successful FINAL assessment, the task becomes DONE and final points count toward the score." },
];

export const statusTransitions = [
  { from: "OPEN", action: "Start", to: "PROGRESS" },
  { from: "PROGRESS", action: "Block", to: "BLOCKED" },
  { from: "BLOCKED", action: "Resume", to: "PROGRESS" },
  { from: "PROGRESS", action: "Submit with evidence", to: "PENDING" },
  { from: "PENDING", action: "Request revision", to: "PROGRESS" },
  { from: "PENDING", action: "Approve + successful FINAL assessment", to: "DONE" },
];

export const permissionRows = [
  { action: "View and manage own tasks", admin: "Yes", member: "Yes" },
  { action: "View and edit other members' tasks", admin: "Yes", member: "No" },
  { action: "Approve or reject tasks", admin: "Yes", member: "No" },
  { action: "Manage projects and users", admin: "Yes", member: "No" },
  { action: "Access Team Pulse", admin: "Yes", member: "No" },
  { action: "View own scores", admin: "Yes", member: "Yes" },
  { action: "View other members' scores", admin: "Yes", member: "No" },
];
