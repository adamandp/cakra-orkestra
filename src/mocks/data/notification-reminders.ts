import { getMockTasks } from "./tasks";
import { getMockUsers } from "./users";
import { notify } from "./notifications";
const KEY="cakra-orkestra:notification-reminders:v1";
export function refreshNotificationReminders(){
  const sent=new Set<string>(JSON.parse(localStorage.getItem(KEY)??"[]"));
  const admins=getMockUsers().filter(u=>u.is_active&&u.role==="ADMIN").map(u=>u.id);
  const now=Date.now();
  const today=new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Jakarta",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date(now));
  const tomorrow=new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Jakarta",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date(now+86400000));
  for(const task of getMockTasks().filter(t=>!t.deleted_at)){
    const once=(key:string,ids:string[],type:string,title:string)=>{
      const token=task.id+":"+key;if(sent.has(token))return;
      notify(ids,null,type,title,task.title,"task",task.id);sent.add(token);
    };
    if(task.task_status!=="DONE"&&task.due_date){
      if(task.due_date<today)once("overdue:"+task.due_date,[task.assignee_id,...admins],"TASK_OVERDUE","Task overdue");
      else if(task.due_date<=tomorrow)once("due:"+task.due_date,[task.assignee_id],"TASK_DUE_SOON","Task due soon");
    }
    if(task.task_status==="PENDING"&&!task.approved_at&&now-Date.parse(task.status_changed_at)>=86400000)once("approval:"+task.status_changed_at,admins,"APPROVAL_REMINDER","Task awaiting approval for 24 hours");
  }
  localStorage.setItem(KEY,JSON.stringify([...sent]));
}
