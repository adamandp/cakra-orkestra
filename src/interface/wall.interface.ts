export const noteColors = ["yellow", "pink", "green", "blue", "purple", "orange"] as const;
export const noteEmojis = ["😀", "😂", "❤️", "🎉", "💡", "🔥", "🙌", "🚀", "👀", "😮", "😢", "💯"] as const;
export type NoteColor = (typeof noteColors)[number];
export interface WallComment {
  id: string;
  author_id: string;
  author_name: string;
  content: string;
  created_at: string;
}
export interface WallNote {
  id: string;
  author_id: string;
  author_name: string;
  title: string;
  content: string;
  color: NoteColor;
  pinned: boolean;
  created_at: string;
  updated_at: string;
  likes?: string[];
  reactions: { user_id: string; emoji: string }[];
  comments: WallComment[];
}
