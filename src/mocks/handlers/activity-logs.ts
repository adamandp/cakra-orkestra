import { actionLabel, resourceLabel, activityDetails } from "@/features/activity-logs/activity-log.format";
import { http, HttpResponse } from "msw";
import { getMockUser } from "../data/auth-store";
import { getActivityLogs } from "../data/activity-logs";
import { z } from "zod";
const paramsSchema=z.object({q:z.string().max(255).optional(),resource:z.string().optional(),resource_id:z.string().optional(),limit:z.coerce.number().int().min(1).max(100).default(10),offset:z.coerce.number().int().min(0).default(0)});
export const activityLogHandlers=[http.get("*/api/activity-logs",({request})=>{
 const actor=getMockUser(request);if(!actor)return HttpResponse.json({message:"Unauthorized"},{status:401});
 const parsed=paramsSchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
 if(!parsed.success)return HttpResponse.json({message:"Invalid filters"},{status:400});
 const {q,resource,resource_id,limit,offset}=parsed.data;
 const items=getActivityLogs().filter(x=>x.actor_id===actor.id&&(!resource||x.resource===resource)&&(!resource_id||x.resource_id===resource_id)&&(!q||[x.actor_name,actionLabel(x),resourceLabel(x),activityDetails(x),x.target,x.resource_id].join(" ").toLowerCase().includes(q.toLowerCase())));
 return HttpResponse.json({data:{items:items.slice(offset,offset+limit),total:items.length,limit,offset}});
})];
