-- Enable Realtime CDC for chat + playback (fallback when broadcast fails)
-- Run in Supabase SQL editor if live updates still require reload

begin;

-- Add tables to the realtime publication (ignore if already added)
do $$
begin
  begin
    alter publication supabase_realtime add table "ChatMessage";
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table "RoomPlaybackState";
  exception when duplicate_object then null;
  end;
end $$;

alter table "ChatMessage" replica identity full;
alter table "RoomPlaybackState" replica identity full;

commit;
