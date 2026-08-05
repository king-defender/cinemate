-- Run in Supabase SQL editor after Prisma migrate
-- Enables Realtime + basic RLS for room-scoped tables

-- Map app User.id to auth.users.id (already the case by design)

alter table "ChatMessage" replica identity full;
alter table "RoomPlaybackState" replica identity full;

-- Helper: is current auth user a member of room?
create or replace function public.is_room_member(p_room_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from "RoomMember"
    where "roomId" = p_room_id
      and "userId" = auth.uid()::text
  );
$$;

alter table "ChatMessage" enable row level security;
alter table "RoomPlaybackState" enable row level security;
alter table "RoomMember" enable row level security;
alter table "User" enable row level security;
alter table "BuddyRequest" enable row level security;

drop policy if exists chat_select on "ChatMessage";
create policy chat_select on "ChatMessage"
  for select using (public.is_room_member("roomId"));

drop policy if exists chat_insert on "ChatMessage";
create policy chat_insert on "ChatMessage"
  for insert with check (
    public.is_room_member("roomId")
    and "userId" = auth.uid()::text
  );

drop policy if exists playback_select on "RoomPlaybackState";
create policy playback_select on "RoomPlaybackState"
  for select using (public.is_room_member("roomId"));

drop policy if exists playback_update on "RoomPlaybackState";
create policy playback_update on "RoomPlaybackState"
  for update using (public.is_room_member("roomId"));

drop policy if exists playback_insert on "RoomPlaybackState";
create policy playback_insert on "RoomPlaybackState"
  for insert with check (public.is_room_member("roomId"));

drop policy if exists member_select on "RoomMember";
create policy member_select on "RoomMember"
  for select using (public.is_room_member("roomId") or "userId" = auth.uid()::text);

drop policy if exists user_select on "User";
create policy user_select on "User"
  for select using (true);

drop policy if exists user_update on "User";
create policy user_update on "User"
  for update using (id = auth.uid()::text);

drop policy if exists buddy_select on "BuddyRequest";
create policy buddy_select on "BuddyRequest"
  for select using (true);

drop policy if exists buddy_delete on "BuddyRequest";
create policy buddy_delete on "BuddyRequest"
  for delete using ("requesterId" = auth.uid()::text);

-- Enable Realtime for broadcast channels is automatic;
-- for postgres_changes (optional), add tables in Dashboard → Realtime.
