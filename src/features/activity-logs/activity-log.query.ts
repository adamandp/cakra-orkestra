import { useAuth } from "@/providers/auth-provider";
import { useQuery } from "@tanstack/react-query";
import { axiosInstance } from "@/lib/axios";
import type { WebResponse } from "@/interface/common.interface";
import type { ActivityLogList,ActivityLogParams } from "@/interface/activity-log.interface";
export function useActivityLogs(params:ActivityLogParams){
 const {user}=useAuth();
 return useQuery({queryKey:["activity-logs",user?.id,params],enabled:Boolean(user?.id),queryFn:async({signal})=>(await axiosInstance.get<WebResponse<ActivityLogList>>("/activity-logs",{params,signal})).data.data,refetchInterval:5000});
}
