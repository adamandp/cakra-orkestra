"use client";
import { useState } from "react";
import { Popover } from "@base-ui/react/popover";
import { CalendarDaysIcon, ChevronLeftIcon, ChevronRightIcon, ChevronDownIcon } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { pickerTrigger, pickerPopup, pickerNav } from "./picker-styles";
import { cn } from "cn";
import { Button } from "@/components/ui/button";

const pad = (n: number) => String(n).padStart(2,"0");
const dayKey = (d: Date) => d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate());
export function DateTimePicker({id,value,onChange,disabled,invalid,mode="datetime",className,ariaLabel,yearNavigation=false}: {id?:string;value:string;onChange:(value:string)=>void;disabled?:boolean;invalid?:boolean;mode?:"date"|"datetime";className?:string;ariaLabel?:string;yearNavigation?:boolean}) {
  const dateOnly = mode === "date";
  const selected = new Date(dateOnly && value ? value+"T00:00" : value);
  const valid = !Number.isNaN(selected.getTime());
  const [open,setOpen] = useState(false);
  const [view,setView] = useState(()=> valid ? selected : new Date());
  const [draft,setDraft] = useState(value);
  const first = new Date(view.getFullYear(),view.getMonth(),1);
  const days = new Date(view.getFullYear(),view.getMonth()+1,0).getDate();
  const offset = (first.getDay()+6)%7;
  const label = valid ? new Intl.DateTimeFormat("en-GB",{day:"numeric",month:"short",year:"numeric",...(dateOnly ? {} : {hour:"2-digit",minute:"2-digit",hourCycle:"h23" as const})}).format(selected) : dateOnly ? "Select date" : "Select date and time";
  return <Popover.Root open={open} onOpenChange={next=>{if(next){setDraft(valid?value:dayKey(new Date())+(dateOnly?"":"T12:00"));setView(valid?selected:new Date());}setOpen(next);}}>
    <Popover.Trigger id={id} disabled={disabled} aria-invalid={invalid} aria-label={ariaLabel} className={cn(pickerTrigger,className)}><CalendarDaysIcon className="size-4 shrink-0"/><span className="flex-1 truncate text-left">{label}</span><ChevronDownIcon className="size-4 shrink-0"/></Popover.Trigger>
    <Popover.Portal><Popover.Positioner sideOffset={8} align="end" className="z-[60]"><Popover.Popup data-slot="popover-content" className={cn(pickerPopup,"w-72")}>
      <div className="mb-3 flex items-center justify-between gap-2 border-b-2 pb-2"><button type="button" aria-label="Previous month" className={pickerNav} onClick={()=>setView(new Date(view.getFullYear(),view.getMonth()-1,1))}><ChevronLeftIcon className="size-4"/></button>{yearNavigation ? <div className="flex min-w-0 flex-1 gap-1">
        <Select value={String(view.getMonth())} onValueChange={v=>{if(v!==null)setView(new Date(view.getFullYear(),Number(v),1));}}><SelectTrigger aria-label="Month" size="sm" className="min-w-0 flex-1"><SelectValue>{view.toLocaleDateString("en-GB",{month:"short"})}</SelectValue></SelectTrigger><SelectContent className="z-[70] max-h-60">{Array.from({length:12},(_,i)=><SelectItem key={i} value={String(i)}>{new Date(2000,i,1).toLocaleDateString("en-GB",{month:"long"})}</SelectItem>)}</SelectContent></Select>
        <Select value={String(view.getFullYear())} onValueChange={v=>{if(v!==null)setView(new Date(Number(v),view.getMonth(),1));}}><SelectTrigger aria-label="Year" size="sm" className="min-w-0 flex-1"><SelectValue/></SelectTrigger><SelectContent className="z-[70] max-h-60">{Array.from({length:131},(_,i)=>Math.max(new Date().getFullYear(),view.getFullYear())-i).map(y=><SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent></Select>
      </div> : <span className="text-sm font-black">{view.toLocaleDateString("en-GB",{month:"long",year:"numeric"})}</span>}<button type="button" aria-label="Next month" className={pickerNav} onClick={()=>setView(new Date(view.getFullYear(),view.getMonth()+1,1))}><ChevronRightIcon className="size-4"/></button></div>
      <div className="grid grid-cols-7 gap-1 text-center">{["Mo","Tu","We","Th","Fr","Sa","Su"].map(d=><span key={d} className="py-1 text-[10px] font-semibold text-muted-foreground">{d}</span>)}{Array.from({length:offset},(_,i)=><span key={"empty"+i}/>)}{Array.from({length:days},(_,i)=>{const key=dayKey(new Date(view.getFullYear(),view.getMonth(),i+1));return <button key={key} type="button" aria-label={key} aria-pressed={draft.slice(0,10)===key} onClick={()=>setDraft(dateOnly?key:key+"T"+(draft.slice(11,16)||"12:00"))} className={`h-8 rounded-[3px] border text-xs font-semibold ${draft.slice(0,10)===key?"border-border bg-[var(--yellow)] text-black shadow-neo-sm":"border-transparent hover:border-border hover:bg-muted"}`}>{i+1}</button>;})}</div>
      {!dateOnly && <div className="mt-3 flex items-center justify-between gap-2 border-t-2 pt-3"><span className="text-xs font-bold">Time</span><div className="flex min-w-0 items-center gap-1">{[24,60].map((count,index)=><Select key={count} value={draft.slice(index===0?11:14,index===0?13:16)||"00"} onValueChange={next=>{if(typeof next==="string")setDraft(draft.slice(0,10)+"T"+(index===0?next:draft.slice(11,13))+":"+(index===1?next:draft.slice(14,16)));}}><SelectTrigger aria-label={index===0?"Hour":"Minute"} className="w-19"><SelectValue/></SelectTrigger><SelectContent className="z-[70] min-w-19 max-h-60">{Array.from({length:count},(_,i)=><SelectItem key={i} value={pad(i)}>{pad(i)}</SelectItem>)}</SelectContent></Select>)}</div></div>}
      <div className="mt-3 flex justify-between gap-2"><Button type="button" variant="outline" size="sm" onClick={()=>{const now=new Date();setView(now);setDraft(dayKey(now)+(dateOnly?"":"T"+pad(now.getHours())+":"+pad(now.getMinutes())));}}>{dateOnly?"Today":"Now"}</Button>{dateOnly && <Button type="button" variant="outline" size="sm" onClick={()=>{onChange("");setOpen(false);}}>Clear</Button>}<Button type="button" size="sm" disabled={!(dateOnly?/^\d{4}-\d{2}-\d{2}$/:/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/).test(draft)} onClick={()=>{onChange(draft);setOpen(false);}}>Apply</Button></div>
      <p className="mt-2 text-center text-[10px] text-muted-foreground">Your local time zone</p>
    </Popover.Popup></Popover.Positioner></Popover.Portal>
  </Popover.Root>;
}
