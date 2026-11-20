import { getMockTasks } from "./tasks";
import { getMockProjects } from "./projects";
import { getMockChangelogs } from "./changelogs";
import type { AuthUser } from "@/interface/auth.interface";
import type { Notification } from "@/interface/notification.interface";
import { getNotifications, saveNotifications } from "./notifications";
export function seedNotifications(user:AuthUser){
  const key="cakra-orkestra:notification-demo:v1:"+user.id;
  if(localStorage.getItem(key))return;
  const tasks=getMockTasks().filter(t=>!t.deleted_at&&(user.role==="ADMIN"||t.assignee_id===user.id));
  const projects=getMockProjects().filter(p=>user.role==="ADMIN"||p.owner_id===user.id||p.member_ids.includes(user.id));
  const releases=getMockChangelogs().filter(x=>projects.some(p=>p.id===x.project_id));
  const rows:Notification[]=[];
  function add(type:string,title:string,entity_type:Notification["entity_type"],entity_id:string,message:string){
    const created_at=new Date(Date.now()-(rows.length+1)*3600000).toISOString();
    rows.push({id:crypto.randomUUID(),user_id:user.id,actor_id:null,type,title,entity_type,entity_id,message,created_at,read_at:rows.length%3===0?created_at:null});
  }
  const events=[["TASK_ASSIGNED","New task assigned","OPEN"],["TASK_REASSIGNED","Task reassigned to you","OPEN"],["TASK_UNASSIGNED","Task reassigned from you","OPEN"],["TASK_SUBMITTED","Task awaiting approval","PENDING"],["TASK_APPROVED","Task approved","DONE"],["TASK_REJECTED","Revision requested","PROGRESS"],["TASK_BLOCKED","Task blocked","BLOCKED"],["TASK_RESUMED","Task resumed","PROGRESS"],["TASK_DELETED","Task deleted","OPEN"],["DEADLINE_CHANGED","Task deadline changed","OPEN"],["TASK_DUE_SOON","Task due soon","PROGRESS"],["TASK_OVERDUE","Task overdue","PROGRESS"],["APPROVAL_REMINDER","Task awaiting approval for 24 hours","PENDING"],["ASSESSMENT_COMPLETED","AI assessment completed","DONE"]];
  for(const [type,title,status] of events){
    const task=tasks.find(t=>t.task_status===status)??tasks[0];
    add(type,title,"task",task?.id??"demo",task?.title??"Demo task");
  }
  for(const [i,[type,title]] of [["PROJECT_ASSIGNED","Added to project"],["PROJECT_OWNER_ASSIGNED","Project ownership assigned"],["PROJECT_REMOVED","Removed from project"]].entries()){
    const p=projects[i%Math.max(projects.length,1)];
    add(type,title,"project",p?.id??"demo",p?.name??"Demo project");
  }
  const r=releases[0];add("RELEASE_PUBLISHED","New release published","changelog",r?.id??"demo",r?.version??"Demo release");
  saveNotifications([...getNotifications(),...rows].sort((a,b)=>b.created_at.localeCompare(a.created_at)));
  localStorage.setItem(key,"1");
}
