"use client";
import {
  CakeIcon,
  XIcon,
  CheckIcon,
  LaptopIcon,
  PalmtreeIcon,
  HeartPulseIcon,
  ClockIcon,
} from "lucide-react";
import { DatePicker } from "@/components/shared/date-picker";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { useState, useEffect, useRef } from "react";
import { fire, balloon } from "react-rewards";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/shared/pagination";
import { PageHeader } from "@/components/shared/page-header";
import { useAuth } from "@/providers/auth-provider";
import { axiosInstance } from "@/lib/axios";
import { Dialog } from "@base-ui/react/dialog";
import { toast } from "sonner";
import {
  attendanceToday,
  type AttendanceStatus,
  type AttendanceList,
  type AttendanceRecord,
} from "@/interface/attendance.interface";
import type { WebResponse } from "@/interface/common.interface";
const labels: Record<AttendanceStatus, string> = {
  PRESENT: "Present",
  ABSENT: "Absent",
  SICK: "Sick",
  LEAVE: "On leave",
  PERMISSION: "Permission",
  WFH: "WFH",
};
const colors: Record<AttendanceStatus, string> = {
  PRESENT: "bg-green-600 text-white dark:bg-[#27975b] dark:text-white",
  ABSENT: "bg-red-600 text-white dark:bg-[#c63d50] dark:text-white",
  SICK: "bg-rose-600 text-white dark:bg-[#bd407d] dark:text-white",
  LEAVE: "bg-amber-400 text-black dark:bg-[#e4af24]",
  PERMISSION: "bg-orange-600 text-white dark:bg-[#c65b23] dark:text-white",
  WFH: "bg-blue-600 text-white dark:bg-[#287ecb] dark:text-white",
};
const styles = {
  PRESENT: { bg: "bg-emerald-100 dark:bg-[#a4edc5]", icon: CheckIcon, caption: "Ready to roll!" },
  ABSENT: { bg: "bg-red-100 dark:bg-[#ffacb4]", icon: XIcon, caption: "Out today!" },
  SICK: { bg: "bg-rose-100 dark:bg-[#f9b1d3]", icon: HeartPulseIcon, caption: "Get well soon!" },
  LEAVE: {
    bg: "bg-yellow-100 dark:bg-[#ffe58a]",
    icon: PalmtreeIcon,
    caption: "Enjoy the break!",
  },
  PERMISSION: {
    bg: "bg-orange-100 dark:bg-[#ffc18c]",
    icon: ClockIcon,
    caption: "Away for a bit!",
  },
  WFH: { bg: "bg-sky-100 dark:bg-[#a2d3ff]", icon: LaptopIcon, caption: "Working remotely!" },
};
export function Attendance() {
  const { user } = useAuth();
  const client = useQueryClient();
  const [date, setDate] = useState(attendanceToday);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [offset, setOffset] = useState(0);
  const [limit, setLimit] = useState(12);
  const [open, setOpen] = useState(false);
  const [history, setHistory] = useState(false);
  const [historyOffset, setHistoryOffset] = useState(0);
  const [start, setStart] = useState(attendanceToday);
  const [end, setEnd] = useState(attendanceToday);
  const [status, setStatus] = useState<AttendanceStatus>("ABSENT");
  const [reason, setReason] = useState("");
  const query = useQuery({
    queryKey: ["attendance", user?.id, date, q, filter, limit, offset],
    enabled: !!user,
    placeholderData: keepPreviousData,
    queryFn: async ({ signal }) =>
      (
        await axiosInstance.get<WebResponse<AttendanceList>>("/attendance", {
          params: { date, q, status: filter, limit, offset },
          signal,
        })
      ).data.data,
    refetchInterval: 15000,
  });
  const mine = useQuery({
    queryKey: ["attendance-me", user?.id],
    enabled: !!user,
    queryFn: async ({ signal }) =>
      (await axiosInstance.get<WebResponse<AttendanceRecord[]>>("/attendance/me", { signal })).data
        .data,
  });
  const mutation = useMutation({
    mutationFn: () =>
      axiosInstance.put("/attendance/me", {
        start_date: start,
        end_date: end,
        status,
        reason: reason.trim() || null,
      }),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ["attendance"] });
      void client.invalidateQueries({ queryKey: ["attendance-me"] });
      void client.invalidateQueries({ queryKey: ["notifications"] });
      void client.invalidateQueries({ queryKey: ["activity-logs"] });
      setOpen(false);
      toast.success("Attendance updated");
    },
    onError: () => toast.error("Unable to update attendance. Check the selected dates."),
  });
  const celebrated = useRef<string | null>(null);
  const birthdayKey =
    !query.isPlaceholderData && date === attendanceToday() && query.data?.birthdays_today?.length
      ? date
      : null;
  useEffect(() => {
    if (
      !birthdayKey ||
      celebrated.current === birthdayKey ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;
    celebrated.current = birthdayKey;
    const config = {
      count: 2,
      size: 26,
      angle: 90,
      spread: 18,
      velocity: 130,
      gravity: -65,
      drag: 0.65,
      lifetime: 14000,
      colors: ["#ff4757", "#ffd93d", "#00bfff", "#a855f7", "#4ade80", "#ff8ad8"],
    };
    const lanes = window.innerWidth < 640 ? 9 : 18;
    for (let i = 0; i < lanes; i++) {
      const x = (window.innerWidth * (i + 0.5)) / lanes;
      fire(balloon, { origin: { x, y: window.innerHeight }, config, respectReducedMotion: true });
    }
  }, [birthdayKey]);
  const summary = query.data?.summary;
  const editDay = date < attendanceToday() ? attendanceToday() : date;
  const hasReport = mine.data?.some((r) => r.date === editDay);
  const edit = (day: string) => {
    const existing = mine.data?.find((r) => r.date === day);
    setStart(day);
    setEnd(day);
    setStatus(existing?.status ?? "ABSENT");
    setReason(existing?.reason ?? "");
    setOpen(true);
  };
  return (
    <div className="space-y-5">
      <PageHeader
        title="Attendance"
        description="Everyone is present by default. Report your absence or remote work here."
        actions={
          <Button onClick={() => edit(editDay)}>
            {hasReport ? "Update my attendance" : "Set my attendance"}
          </Button>
        }
      />
      {!!query.data?.birthdays_today?.length && (
        <section aria-label="Birthdays" className="space-y-3">
          <div className="flex items-center gap-2">
            <CakeIcon className="size-5" />
            <h2 className="font-black"><span className="system-copy">Birthday spotlight</span></h2>
          </div>
          <div className="grid gap-4 lg:grid-cols-2 [&>*:only-child]:lg:col-span-2">
            {query.data.birthdays_today.map((member) => (
              <Card
                key={member.id}
                data-attendance-tone="birthday"
                className="relative isolate overflow-hidden border-2 border-border bg-[#fbcfe8] py-0 text-[#241324] dark:bg-[#ff91bd] dark:text-[#291321]"
              >
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
                >
                  {["✦", "●", "✧", "✦", "●", "✧", "✦", "●"].map((shape, i) => (
                    <span
                      key={i}
                      className="absolute text-lg font-black opacity-60"
                      style={{
                        left: [5, 21, 43, 60, 73, 88, 94, 80][i] + "%",
                        top: [12, 83, 8, 78, 15, 82, 24, 46][i] + "%",
                        color: ["#ec4899", "#eab308", "#a855f7"][i % 3],
                        transform: "rotate(" + i * 19 + "deg)",
                      }}
                    >
                      {shape}
                    </span>
                  ))}
                </div>
                <CardContent className="relative flex flex-col items-center gap-5 p-5 sm:flex-row sm:p-6">
                  <div className="relative shrink-0">
                    <Avatar className="size-24 overflow-hidden rounded-full border-2 border-black bg-white shadow-[4px_4px_0_#171717] after:rounded-full after:border-0">
                      <AvatarImage
                        className="rounded-full"
                        src={member.avatar_url ?? undefined}
                        alt={member.name}
                      />
                      <AvatarFallback className="rounded-full bg-yellow-100 text-3xl font-black text-black">
                        {member.name
                          .split(" ")
                          .slice(0, 2)
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <span aria-hidden className="absolute -right-2 -top-4 rotate-12 text-4xl">
                      🥳
                    </span>
                    <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 -rotate-6 whitespace-nowrap border-2 border-black bg-yellow-200 px-2 py-0.5 text-[10px] font-black text-black"><span className="system-copy">
                      BIRTHDAY STAR
                    </span></span>
                  </div>
                  <div className="min-w-0 flex-1 text-center sm:text-left">
                    <span className="inline-block -rotate-2 border-2 border-black bg-white px-2 py-0.5 text-xs font-black uppercase text-black shadow-[2px_2px_0_#171717]"><span className="system-copy">
                      It&apos;s cake day!
                    </span></span>
                    <h3 className="mt-2 break-words text-2xl font-black leading-tight sm:text-3xl">
                      Happy birthday, {member.name.split(" ")[0]}!
                    </h3>
                    <p className="mt-1 text-sm font-semibold">
                      {member.name} · {labels[member.status]}
                    </p>
                    <p className="mt-2 text-sm"><span className="system-copy">
                      May your day be full of cake, good vibes, and zero bugs!
                    </span></p>
                  </div>
                  <div
                    aria-hidden
                    className="hidden shrink-0 rotate-6 items-center justify-center text-7xl sm:flex"
                  >
                    🎂
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ["Team", summary?.total, "blue"],
          ["Present", summary?.present, "mint"],
          ["Absent", summary?.absent, "pink"],
          ["WFH", summary?.wfh, "purple"],
        ].map(([label, value, tone]) => (
          <Card key={label} data-stat-tone={tone}>
            <CardContent className="space-y-1 p-4">
              <p className="text-sm font-bold text-muted-foreground">{label}</p>
              <p className="text-3xl font-black">{value ?? "—"}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="attendance-toolbar grid grid-cols-2 items-center gap-3 lg:grid-cols-[minmax(0,1fr)_12rem_10rem_auto]">
        <Input
          className="col-span-2 h-10 min-w-0 rounded-[3px] lg:col-span-1"
          placeholder="Search members..."
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOffset(0);
          }}
        />
        <DatePicker
          ariaLabel="Attendance date"
          value={date}
          onChange={(v) => {
            setDate(v || attendanceToday());
            setOffset(0);
          }}
          className="h-10 w-full min-w-0 shadow-none"
        />
        <Select
          value={filter}
          onValueChange={(v) => {
            if (v) {
              setFilter(v);
              setOffset(0);
            }
          }}
        >
          <SelectTrigger aria-label="Attendance status" className="h-10 w-full">
            <SelectValue>
              {filter === "ALL" ? "All statuses" : labels[filter as AttendanceStatus]}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="border-2 border-border shadow-neo-button">
            <SelectItem value="ALL">All statuses</SelectItem>
            {Object.entries(labels).map(([k, v]) => (
              <SelectItem key={k} value={k}>
                {v}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          className="col-span-2 h-10 w-full rounded-[3px] shadow-none lg:col-span-1 lg:w-auto"
          variant="outline"
          onClick={() => setHistory(true)}
        >
          My history
        </Button>
      </div>
      {query.isError ? (
        <p role="alert">
          Unable to load attendance. <Button onClick={() => void query.refetch()}>Retry</Button>
        </p>
      ) : query.isPending ? (
        <p><span className="system-copy">Loading attendance...</span></p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6">
            {query.data?.items.map((member) => {
              const style = styles[member.status];
              const away = !["PRESENT", "WFH"].includes(member.status);
              return (
                <Card
                  key={member.id}
                  data-attendance-tone={member.status}
                  className="min-w-0 overflow-hidden gap-0 py-0"
                >
                  <div
                    className={
                      "relative flex h-28 items-center justify-center border-b border-border " +
                      style.bg
                    }
                  >
                    <span
                      className={
                        "absolute left-[-31px] top-[15px] z-10 w-[116px] -rotate-45 border-y border-black py-0.5 text-center text-[9px] font-black uppercase tracking-wide " +
                        colors[member.status]
                      }
                    >
                      {labels[member.status]}
                    </span>
                    <div className="relative">
                      <Avatar
                        className={
                          "size-24 rounded-full border-2 border-black bg-card dark:bg-[#fff7e8] dark:text-[#141820] shadow-[3px_3px_0_#000] after:rounded-full " +
                          (away ? "opacity-70" : "")
                        }
                      >
                        <AvatarImage
                          className="rounded-full"
                          src={member.avatar_url ?? undefined}
                          alt={member.name}
                        />
                        <AvatarFallback className="rounded-full text-2xl font-black">
                          {member.name
                            .split(" ")
                            .slice(0, 2)
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {away && (
                        <XIcon
                          aria-hidden
                          className="absolute inset-0 size-full text-red-500/80 stroke-2"
                        />
                      )}
                    </div>
                  </div>
                  <CardContent className="flex flex-1 flex-col items-center gap-0.5 px-3 py-2 text-center">
                    <p className="w-full break-words text-sm font-black">
                      {member.name}
                      {member.id === user?.id ? " (You)" : ""}
                    </p>
                    <p
                      className={
                        "inline-flex items-center gap-1 text-[11px] font-medium " +
                        (member.birthday_days === 0
                          ? "text-pink-700 dark:text-pink-300"
                          : "text-muted-foreground")
                      }
                    >
                      {member.birthday_days === 0 ? (
                        "🎂 Cake day!"
                      ) : member.birthday_days !== null &&
                        member.birthday_days > 0 &&
                        member.birthday_days <= 7 ? (
                        <>
                          {" "}
                          <CakeIcon className="size-3" /> Birthday in {member.birthday_days}d{" "}
                        </>
                      ) : (
                        style.caption
                      )}
                    </p>
                    {member.reason && (
                      <p className="break-words text-xs text-muted-foreground">{member.reason}</p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
          {!query.data?.items.length && (
            <p className="py-8 text-center text-muted-foreground"><span className="system-copy">No members found.</span></p>
          )}
          <Pagination
            total={query.data?.total ?? 0}
            limit={limit}
            offset={offset}
            count={query.data?.items.length ?? 0}
            onOffsetChange={setOffset}
            onLimitChange={(n) => {
              setLimit(n);
              setOffset(0);
            }}
            disabled={query.isPlaceholderData}
          />
        </>
      )}
      <Dialog.Root
        open={open}
        onOpenChange={(v) => {
          if (!mutation.isPending) setOpen(v);
        }}
      >
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 z-[50] bg-black/50" />
          <Dialog.Popup className="fixed left-1/2 top-1/2 z-[51] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 space-y-4 border-2 border-border bg-card p-5 shadow-neo-button">
            <Dialog.Title className="text-xl font-bold">Set my attendance</Dialog.Title>
            <Dialog.Description className="text-sm text-muted-foreground">
              Return to Present to cancel an absence.
            </Dialog.Description>
            <form
              className="space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                mutation.mutate();
              }}
            >
              <label className="block text-sm font-bold">
                Status
                <select
                  className="mt-1 block h-10 w-full border-2 border-border bg-background px-2"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as AttendanceStatus)}
                >
                  {Object.entries(labels).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <label className="text-sm font-bold">
                  From
                  <DatePicker
                    ariaLabel="From"
                    value={start}
                    onChange={(v) => {
                      if (v >= attendanceToday()) {
                        setStart(v);
                        if (v > end) setEnd(v);
                      }
                    }}
                    className="mt-1 w-full"
                  />
                </label>
                <label className="text-sm font-bold">
                  To
                  <DatePicker
                    ariaLabel="To"
                    value={end}
                    onChange={(v) => {
                      if (v >= start) setEnd(v);
                    }}
                    className="mt-1 w-full"
                  />
                </label>
              </div>
              {status !== "PRESENT" && (
                <label className="block text-sm font-bold">
                  Reason (optional, visible to admins)
                  <textarea
                    className="mt-1 block w-full border-2 border-border bg-background p-2"
                    value={reason}
                    maxLength={500}
                    onChange={(e) => setReason(e.target.value)}
                  />
                </label>
              )}
              <div className="flex justify-end gap-2">
                <Dialog.Close
                  render={<Button type="button" variant="outline" disabled={mutation.isPending} />}
                >
                  Cancel
                </Dialog.Close>
                <Button disabled={mutation.isPending}><span className="system-copy">Save</span></Button>
              </div>
            </form>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
      <Dialog.Root open={history} onOpenChange={setHistory}>
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 z-[50] bg-black/50" />
          <Dialog.Popup className="fixed left-1/2 top-1/2 z-[51] max-h-[85dvh] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto space-y-3 border-2 border-border bg-card p-5 shadow-neo-button">
            <Dialog.Title className="text-xl font-bold">My attendance history</Dialog.Title>
            <Dialog.Description className="text-sm text-muted-foreground">
              Only recorded exceptions are listed. Other days default to Present.
            </Dialog.Description>
            {mine.data?.slice(historyOffset, historyOffset + 5).map((r) => (
              <div key={r.id} className="border-2 border-border p-3">
                <div className="flex justify-between">
                  <strong>{r.date}</strong>
                  <span>{labels[r.status]}</span>
                </div>
                {r.reason && <p className="text-sm">{r.reason}</p>}
              </div>
            ))}
            {!mine.data?.length && <p><span className="system-copy">No reported absences.</span></p>}
            <Pagination
              compact
              total={mine.data?.length ?? 0}
              count={mine.data?.slice(historyOffset, historyOffset + 5).length ?? 0}
              limit={5}
              offset={historyOffset}
              onOffsetChange={setHistoryOffset}
            />
            <Dialog.Close render={<Button variant="outline" />}>Close</Dialog.Close>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
