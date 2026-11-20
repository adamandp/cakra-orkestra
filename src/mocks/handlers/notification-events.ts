import { notify } from "../data/notifications";
import { findMockTask } from "../data/tasks";
import { findMockProject } from "../data/projects";
import { getMockUsers } from "../data/users";
import { findMockChangelog } from "../data/changelogs";
export function snapshot(resource:string,id:string) {
  return {task:resource==="tasks"?findMockTask(id):undefined,project:resource==="projects"?findMockProject(id):undefined};
}
export function emitNotification(parts:string[],method:string,actor:string,before:ReturnType<typeof snapshot>,data:Record<string,unknown>|undefined) {
  const [,resource,id,action]=parts;
  const entityId=id??(typeof data?.id==="string"?data.id:"");
  if(resource==="tasks"){
    const task=findMockTask(entityId)??before.task;if(!task)return;
    const project=findMockProject(task.project_id);
    const admins=getMockUsers().filter(u=>u.role==="ADMIN"&&u.is_active).map(u=>u.id);
    const send=(ids:string[],type:string,title:string)=>notify(ids,actor,type,title,task.title,"task",task.id);
    if(!id&&method==="post")send([task.assignee_id],"TASK_ASSIGNED","New task assigned");
    else if(action==="assignee"&&before.task?.assignee_id!==task.assignee_id){send([task.assignee_id],"TASK_REASSIGNED","Task reassigned to you");if(before.task)send([before.task.assignee_id],"TASK_UNASSIGNED","Task reassigned from you");}
    else if(action==="submit")send(admins,"TASK_SUBMITTED","Task awaiting approval");
    else if(action==="approve")send([task.assignee_id],"TASK_APPROVED","Task approved");
    else if(action==="reject")send([task.assignee_id],"TASK_REJECTED","Revision requested");
    else if(action==="block")send(project?[project.owner_id,...admins]:admins,"TASK_BLOCKED","Task blocked");
    else if(action==="resume")send([task.assignee_id,...(project?[project.owner_id]:[])],"TASK_RESUMED","Task resumed");
    else if(!action&&method==="delete")send([task.assignee_id],"TASK_DELETED","Task deleted");
    else if(!action&&method==="patch"&&before.task?.due_date!==task.due_date)send([task.assignee_id],"DEADLINE_CHANGED","Task deadline changed");
  } else if(resource==="projects"){
    const project=findMockProject(entityId);if(!project)return;
    const old=before.project;
    if(!old||old.owner_id!==project.owner_id)notify([project.owner_id],actor,"PROJECT_OWNER_ASSIGNED","Project ownership assigned",project.name,"project",project.id);
    notify(project.member_ids.filter(x=>x!==project.owner_id&&!old?.member_ids.includes(x)&&x!==old?.owner_id),actor,"PROJECT_ASSIGNED","Added to project",project.name,"project",project.id);
    if(old)notify([...new Set([old.owner_id,...old.member_ids])].filter(x=>x!==project.owner_id&&!project.member_ids.includes(x)),actor,"PROJECT_REMOVED","Removed from project",project.name,"project",project.id);
  } else if(resource==="changelogs"&&method==="post"&&!id){
    const entry=findMockChangelog(entityId);if(!entry)return;
    const project=findMockProject(entry.project_id);if(project)notify([project.owner_id,...project.member_ids],actor,"RELEASE_PUBLISHED","New release published",project.name+" · "+entry.version,"changelog",entry.id);
  }
}
