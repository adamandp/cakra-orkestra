import Link from "next/link";
import { TaskNotificationCard } from "@/features/notifications/components/notification-detail";
export default async function Page({params}:{params:Promise<{id:string}>}){const {id}=await params;return <div className="space-y-4 p-4 sm:p-6"><Link href="/notifications" className="text-sm font-bold hover:underline">← All notifications</Link><h1 className="text-2xl font-bold">Task details</h1><TaskNotificationCard id={id}/></div>;}
