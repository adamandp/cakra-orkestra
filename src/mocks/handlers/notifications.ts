import { seedNotifications } from "../data/notification-seed";
import { refreshNotificationReminders } from "../data/notification-reminders";
import { http, HttpResponse } from "msw";
import { z } from "zod";
import { getMockUser } from "../data/auth-store";
import { getNotifications, saveNotifications } from "../data/notifications";
const filters = z.object({limit:z.coerce.number().int().min(1).max(100).default(10),offset:z.coerce.number().int().min(0).default(0),is_read:z.enum(["true","false"]).optional()});
const fail = (status:number) => HttpResponse.json({message:status===401?"Unauthorized":"Notification not found"},{status});
export const notificationHandlers = [
  http.get("*/api/notifications", ({request}) => {
    const user=getMockUser(request); if(!user)return fail(401);
    seedNotifications(user);
    refreshNotificationReminders();
    const parsed=filters.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if(!parsed.success)return HttpResponse.json({message:"Invalid filters"},{status:400});
    const {limit,offset,is_read}=parsed.data;
    const items=getNotifications().filter(n=>n.user_id===user.id && (is_read===undefined || Boolean(n.read_at)===(is_read==="true")));
    return HttpResponse.json({data:{items:items.slice(offset,offset+limit),total:items.length,limit,offset}});
  }),
  http.get("*/api/notifications/unread-count",({request})=>{
    const user=getMockUser(request);if(!user)return fail(401);
    seedNotifications(user);
    refreshNotificationReminders();
    return HttpResponse.json({data:{count:getNotifications().filter(n=>n.user_id===user.id&&!n.read_at).length}});
  }),
  http.get("*/api/notifications/:id",({request,params})=>{
    const user=getMockUser(request);if(!user)return fail(401);
    const item=getNotifications().find(n=>n.id===params.id&&n.user_id===user.id);
    return item?HttpResponse.json({data:item}):fail(404);
  }),
  http.patch("*/api/notifications/read-all",({request})=>{
    const user=getMockUser(request);if(!user)return fail(401);
    saveNotifications(getNotifications().map(n=>n.user_id===user.id&&!n.read_at?{...n,read_at:new Date().toISOString()}:n));
    return HttpResponse.json({data:null,message:"Notifications read"});
  }),
  ...(["read","unread"] as const).map(action=>http.patch("*/api/notifications/:id/"+action,({request,params})=>{
    const user=getMockUser(request);if(!user)return fail(401);
    const items=getNotifications();const item=items.find(n=>n.id===params.id&&n.user_id===user.id);if(!item)return fail(404);
    const updated={...item,read_at:action==="read"?item.read_at??new Date().toISOString():null};
    saveNotifications(items.map(n=>n.id===item.id?updated:n));
    return HttpResponse.json({data:updated});
  })),
  http.delete("*/api/notifications/:id",({request,params})=>{
    const user=getMockUser(request);if(!user)return fail(401);
    const items=getNotifications();if(!items.some(n=>n.id===params.id&&n.user_id===user.id))return fail(404);
    saveNotifications(items.filter(n=>n.id!==params.id));return HttpResponse.json({data:null});
  })
];
