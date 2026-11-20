import { axiosInstance } from "@/lib/axios";
import type { WebResponse } from "@/interface/common.interface";
import type { WallNote } from "@/interface/wall.interface";
export const wallPath = "/wall/notes";
export async function getWallNotes(signal: AbortSignal) {
  return (await axiosInstance.get<WebResponse<WallNote[]>>(wallPath, { signal })).data.data;
}
