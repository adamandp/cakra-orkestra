import type { ActivityLog } from "@/interface/activity-log.interface";
const uuid = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;
export const resourceLabels: Record<string,string> = {auth:"Authentication",users:"User",projects:"Project",tasks:"Task",changelogs:"Release",wall:"Team Wall",attendance:"Attendance",notifications:"Notification"};
export function actionLabel(x: ActivityLog) {
  const a=x.action.replace(uuid,"").replace(/^_+|_+$/g,"");
  if(x.resource==="wall"){
    const labels:Record<string,string>={POST:"Interacted with note",DELETE:"Deleted note",PATCH:"Updated note",ME_DELETE:"Removed reaction",CREATE:"Created note",UPDATE:"Updated note",NOTE_CREATE:"Created note",NOTE_UPDATE:"Updated note",NOTE_DELETE:"Deleted note",REACTIONS_POST:"Added reaction",REACTIONS_ME_DELETE:"Removed reaction",COMMENTS_POST:"Added comment",COMMENTS_DELETE:"Deleted comment",PIN_PATCH:"Changed pin",LIKE_PATCH:"Changed like"};
    return labels[a]??"Updated wall";
  }
  const labels:Record<string,string>={LOGIN:"Logged in",LOGOUT:"Logged out",PASSWORD:"Changed password",CREATE:"Created",UPDATE:"Updated",DELETE:"Deleted",SUBMIT_POST:"Submitted",APPROVE_POST:"Approved",REJECT_POST:"Rejected",START_POST:"Started",BLOCK_POST:"Blocked",RESUME_POST:"Resumed",ASSIGNEE_PATCH:"Reassigned",STATUS_PATCH:"Changed status",ROLE_PATCH:"Changed role"};
  return labels[a]??(a.toLowerCase().replaceAll("_"," ").replace(/^./,c=>c.toUpperCase())||"Updated");
}
export function resourceLabel(x: ActivityLog){return resourceLabels[x.resource]??x.resource;}
export function activityDetails(x: ActivityLog){
 const label=actionLabel(x);
 const target=x.target?.replace(uuid,"").trim();
 return x.outcome==="FAILED"?"Attempt failed: "+label: target?label+' · '+target:label+" · "+resourceLabel(x);
}
