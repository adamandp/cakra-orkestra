"use client";

import { Pagination } from "@/components/shared/pagination";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { axiosInstance } from "@/lib/axios";
import { attendanceToday, type AttendanceList } from "@/interface/attendance.interface";
import type { WebResponse } from "@/interface/common.interface";
import { CheckIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Project } from "@/interface/project.interface";
import { useProjects } from "@/features/projects/project.query";
import { getProjectError } from "@/features/projects/project.api";

const PAGE_SIZE = 5;
export function TaskProjectPicker({
  selected,
  onChange,
  activeOnly = false,
  disabled = false,
}: {
  selected: Project | null;
  onChange: (project: Project | null) => void;
  activeOnly?: boolean;
  disabled?: boolean;
}) {
  const [q, setQ] = useState("");
  const [offset, setOffset] = useState(0);
  const query = useProjects({
    q: q.trim() || undefined,
    status: activeOnly ? "ACTIVE" : undefined,
    limit: PAGE_SIZE,
    offset,
  });
  const items = query.data?.items ?? [];
  const total = query.data?.total ?? 0;
  return (
    <div
      role="group"
      aria-label="Select project"
      className="space-y-2 rounded-lg border-2 border-border p-3"
    >
      <div className="flex items-center justify-between gap-2 text-sm">
        <span className="min-w-0 break-words">
          {selected
            ? `${selected.code} — ${selected.name}`
            : activeOnly
              ? "No project selected"
              : "All projects"}
        </span>
        {selected && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={disabled}
            onClick={() => onChange(null)}
          >
            Clear
          </Button>
        )}
      </div>
      <Input
        aria-label="Search projects"
        placeholder="Search projects..."
        maxLength={255}
        value={q}
        disabled={disabled}
        onChange={(event) => {
          setQ(event.target.value);
          setOffset(0);
        }}
      />
      {query.isError ? (
        <div role="alert" className="space-y-2 text-sm text-destructive">
          <p>{getProjectError(query.error)}</p>
          <Button type="button" variant="outline" onClick={() => void query.refetch()}>
            Retry
          </Button>
        </div>
      ) : query.isPending ? (
        <p className="text-sm text-muted-foreground"><span className="system-copy">Loading projects...</span></p>
      ) : (
        <div className="space-y-1">
          {!items.length && <p className="text-sm text-muted-foreground"><span className="system-copy">No projects found.</span></p>}
          {items.map((project) => (
            <Button
              key={project.id}
              type="button"
              variant={selected?.id === project.id ? "secondary" : "ghost"}
              aria-pressed={selected?.id === project.id}
              disabled={disabled}
              className="h-auto w-full justify-start whitespace-normal text-left"
              onClick={() => onChange(project)}
            >
              <span className="min-w-0 flex-1 break-words">
                {project.code} — {project.name}
              </span>
              {selected?.id === project.id && <CheckIcon />}
            </Button>
          ))}
        </div>
      )}
      <Pagination compact total={total} limit={PAGE_SIZE} offset={offset} count={items.length} disabled={disabled || query.isFetching} onOffsetChange={setOffset} />
    </div>
  );
}

export function useTaskAssigneeOptions(project: Project | null, actorId: string) {
  const date=attendanceToday();
  const attendance=useQuery({queryKey:["attendance",actorId,"assignment",date],enabled:!!actorId&&!!project,queryFn:async({signal})=>{
    const result:AttendanceList["items"]=[];
    for(let offset=0;;offset+=100){
      const {data}=await axiosInstance.get<WebResponse<AttendanceList>>("/attendance",{params:{date,limit:100,offset},signal});
      result.push(...data.data.items);
      if(result.length>=data.data.total||!data.data.items.length)break;
    }
    return result;
  }});
  const suffix=(id:string)=>{const status=attendance.data?.find(u=>u.id===id)?.status;return status&&status!=="PRESENT"&&status!=="WFH"?" — "+status+" today":"";};
  if (!project || !actorId) return [];
  const people = new Map(
    [project.owner, ...project.members]
      .filter((user) => user.is_active)
      .map((user) => [user.id, user]),
  );
  const options = Array.from(people.values()).map((user) => ({
    value: user.id,
    label: `${user.name} (@${user.username})`+suffix(user.id),
  }));
  if (!people.has(actorId)) options.unshift({ value: actorId, label: "Myself (admin)"+suffix(actorId) });
  return options;
}
