export type Seat = 'left' | 'right';

export interface Profile {
  id: string;
  display_name: string;
  seat: Seat;
  avatar_url: string | null;
}

export interface PresenceRow {
  user_id: string;
  status: 'online' | 'offline' | 'typing';
  last_seen: string;
}

export interface Message {
  id: string;
  sender_id: string;
  body: string | null;
  attachment_url: string | null;
  attachment_type: 'image' | 'file' | null;
  reply_to: string | null;
  pinned: boolean;
  edited_at: string | null;
  deleted: boolean;
  created_at: string;
}

export interface Reaction {
  id: string;
  message_id: string;
  user_id: string;
  emoji: string;
}

export type SceneryTheme =
  | 'rainy_city'
  | 'countryside'
  | 'bridge'
  | 'forest'
  | 'sunset_highway'
  | 'snow';

export type OverlayKind = 'journal' | 'gallery' | 'routemap' | 'tickets' | 'photobooth' | null;

export interface LoveNote {
  id: string;
  author_id: string;
  message: string;
  read: boolean;
  created_at: string;
}

export interface Polaroid {
  id: string;
  author_id: string;
  url: string;
  caption: string | null;
  created_at: string;
}

export interface MoodState {
  id: number;
  warmth: number;
  updated_at: string;
}

export interface BusStop {
  id: string;
  name: string;
  set_by: string | null;
  reached: boolean;
  created_at: string;
}
