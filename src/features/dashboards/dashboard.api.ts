import { axiosInstance } from "@/lib/axios";
import type { WebResponse } from "@/interface/common.interface";
import type {
  MyFocusSummary,
  TeamPulseSummary,
  MemberWorkload,
} from "@/interface/dashboard.interface";

export async function getMyFocus(signal?: AbortSignal) {
  const { data } = await axiosInstance.get<WebResponse<MyFocusSummary>>("/dashboards/my-focus", {
    signal,
  });
  return data.data;
}

export async function getTeamSummary(signal?: AbortSignal) {
  const { data } = await axiosInstance.get<WebResponse<TeamPulseSummary>>(
    "/dashboards/team-pulse/summary",
    { signal },
  );
  return data.data;
}

export async function getMemberWorkloads(signal?: AbortSignal) {
  const { data } = await axiosInstance.get<WebResponse<MemberWorkload[]>>(
    "/dashboards/team-pulse/workloads",
    { signal },
  );
  return data.data;
}
