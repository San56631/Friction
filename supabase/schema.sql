-- FRICTION schema v2. Paste into Supabase SQL Editor and run. Safe to re-run.
create extension if not exists pg_trgm;

-- ---------- profiles & roles ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text, full_name text,
  role text not null default 'student' check (role in ('student','admin')),
  restricted_until timestamptz,
  abuse_strikes int not null default 0,
  created_at timestamptz not null default now()
);
alter table public.profiles add column if not exists restricted_until timestamptz;
alter table public.profiles add column if not exists abuse_strikes int not null default 0;
alter table public.profiles enable row level security;

create or replace function public.is_admin() returns boolean
language sql security definer set search_path = public stable as
$$ select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin') $$;

create or replace function public.actor_name() returns text
language sql security definer set search_path = public stable as
$$ select coalesce(full_name, email, 'System') from public.profiles where id = auth.uid() $$;

drop policy if exists "read own profile" on public.profiles;
create policy "read own profile" on public.profiles for select using (auth.uid() = id or public.is_admin());

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name') on conflict do nothing;
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- ---------- configuration ----------
create table if not exists public.app_settings (key text primary key, int_value int not null);
alter table public.app_settings add column if not exists text_value text;
alter table public.app_settings alter column int_value drop not null;
insert into public.app_settings (key, int_value) values ('daily_report_limit', 3), ('auto_publish', 1), ('flag_threshold', 3) on conflict do nothing;
insert into public.app_settings (key, text_value) values ('blocked_words', 'fuck,shit,bitch,bastard,asshole,idiot,stupid') on conflict do nothing;
alter table public.app_settings enable row level security;
drop policy if exists "settings read" on public.app_settings;
drop policy if exists "settings admin write" on public.app_settings;
create policy "settings read" on public.app_settings for select to authenticated using (true);
create policy "settings admin write" on public.app_settings for update using (public.is_admin()) with check (public.is_admin());

create table if not exists public.buildings (
  id text primary key, name text not null, code text, zone text,
  latitude double precision, longitude double precision  -- fill these in for the Leaflet map
);
insert into public.buildings (id, name, code, zone, latitude, longitude) values
 ('cse-ece-block','CSE & ECE Block','BLD-CSE','IGDTUW Campus',28.6641876,77.2324179),
 ('it-block','IT Block','BLD-IT','IGDTUW Campus',28.6641949,77.232487),
 ('computer-centre','Computer Centre','BLD-CC','IGDTUW Campus',28.6641628,77.2330188),
 ('mechanical-block','Mechanical Block','BLD-MECH','IGDTUW Campus',28.664706,77.2330264),
 ('auditorium','Auditorium','BLD-AUD','IGDTUW Campus',28.6649407,77.2324634),
 ('admin-block','Administrative Building','BLD-ADM','IGDTUW Campus',null,null),
 ('kaveri-hostel','Kaveri Hostel','BLD-KAV','IGDTUW Campus',null,null),
 ('krishna-hostel','Krishna Hostel','BLD-KRI','IGDTUW Campus',null,null),
 ('canteen','Canteen','BLD-CNT','IGDTUW Campus',null,null),
 ('nescafe','Nescafe','BLD-NES','IGDTUW Campus',null,null),
 ('new-building','New Building','BLD-NEW','IGDTUW Campus',null,null),
 ('library','Library','BLD-LIB','IGDTUW Campus',null,null),
 ('sports-complex','Sports Complex','BLD-SPT','IGDTUW Campus',null,null)
on conflict (id) do update set name = excluded.name, code = excluded.code, zone = excluded.zone,
  latitude = coalesce(public.buildings.latitude, excluded.latitude),
  longitude = coalesce(public.buildings.longitude, excluded.longitude);
delete from public.buildings b where b.id in ('cs-block','academic-block','hostel')
  and not exists (select 1 from public.issues i where i.building_id = b.id);
alter table public.buildings enable row level security;
drop policy if exists "buildings read" on public.buildings;
create policy "buildings read" on public.buildings for select to authenticated using (true);
drop policy if exists "buildings admin update" on public.buildings;
create policy "buildings admin update" on public.buildings for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---------- issues ----------
create table if not exists public.issues (
  id uuid primary key default gen_random_uuid(),
  ref_number bigint generated always as identity,
  title text not null check (char_length(trim(title)) >= 8),
  description text not null check (char_length(trim(description)) >= 15),
  category text not null,
  building_id text not null references public.buildings(id),
  floor_room text not null default '',
  severity int not null default 2 check (severity between 1 and 3),
  status text not null default 'Pending Review' check (status in
    ('Pending Review','Published','Flagged','Needs Clarification','Rejected','In Progress','Resolved')),
  status_reason text,
  reporter_id uuid not null references public.profiles(id),
  reporter_name text,
  image_url text,
  parent_id uuid references public.issues(id) on delete set null,
  link_type text check (link_type in ('true_duplicate','independent')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.issues add column if not exists latitude double precision;
alter table public.issues add column if not exists longitude double precision;
alter table public.issues add column if not exists place_name text;
create index if not exists issues_reporter_idx on public.issues (reporter_id, created_at);
create index if not exists issues_search_idx on public.issues using gin ((title || ' ' || description) gin_trgm_ops);

create table if not exists public.confirmations (
  issue_id uuid not null references public.issues(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (issue_id, user_id)            -- one confirmation per user per issue
);
create table if not exists public.flags (
  id uuid primary key default gen_random_uuid(),
  issue_id uuid not null references public.issues(id) on delete cascade,
  flagged_by uuid not null references public.profiles(id) on delete cascade,
  reason text not null, details text default '',
  status text not null default 'open' check (status in ('open','dismissed','actioned')),
  created_at timestamptz not null default now(), resolved_at timestamptz,
  unique (issue_id, flagged_by)
);
create table if not exists public.admin_notes (
  id bigint generated always as identity primary key,
  issue_id uuid not null references public.issues(id) on delete cascade,
  author_id uuid not null references public.profiles(id),
  author_name text, text text not null, created_at timestamptz not null default now()
);
create table if not exists public.audit_log (
  id bigint generated always as identity primary key,
  issue_id uuid references public.issues(id) on delete cascade,
  actor_id uuid, actor_name text, action text not null, created_at timestamptz not null default now()
);
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  issue_id uuid references public.issues(id) on delete cascade,
  title text not null, message text not null, type text not null default 'update',
  read boolean not null default false, created_at timestamptz not null default now()
);

-- ---------- server-side integrity rules ----------
create or replace function public.issues_before_insert() returns trigger
language plpgsql security definer set search_path = public as $$
declare prof public.profiles; daily_limit int; recent_count int; auto_publish int;
        blocked_pattern text; combined_text text; hold_reasons text[] := '{}';
        matched_parent uuid; matched_sim real;
begin
  perform pg_advisory_xact_lock(hashtext(new.reporter_id::text));
  select * into prof from public.profiles where id = new.reporter_id;
  if prof.restricted_until is not null and prof.restricted_until > now() then
    raise exception 'RESTRICTED: Your reporting access is temporarily restricted until %.', to_char(prof.restricted_until, 'DD Mon YYYY HH24:MI');
  end if;
  select int_value into daily_limit from public.app_settings where key = 'daily_report_limit';
  select count(*) into recent_count from public.issues
    where reporter_id = new.reporter_id and created_at > now() - interval '24 hours';
  if recent_count >= coalesce(daily_limit, 3) then
    raise exception 'RATE_LIMIT: Daily allowance reached (% reports per rolling 24 hours). Please wait before submitting another report.', coalesce(daily_limit, 3);
  end if;
  new.reporter_name := coalesce(prof.full_name, prof.email);

  -- integrity checks: any hit holds the report for administrator review instead of publishing it
  combined_text := new.title || ' ' || new.description;
  if coalesce(prof.abuse_strikes, 0) > 0 then hold_reasons := hold_reasons || 'this account has a recorded strike'; end if;
  if combined_text ~* '(https?://|www\.)' then hold_reasons := hold_reasons || 'it contains a link'; end if;
  select string_agg(regexp_replace(trim(t.word), '[^[:alnum:]]', '', 'g'), '|') into blocked_pattern
    from unnest(string_to_array(coalesce((select text_value from public.app_settings where key = 'blocked_words'), ''), ',')) as t(word)
    where regexp_replace(trim(t.word), '[^[:alnum:]]', '', 'g') <> '';
  if blocked_pattern is not null and combined_text ~* ('\m(' || blocked_pattern || ')\M') then
    hold_reasons := hold_reasons || 'it contains blocked language';
  end if;
  if combined_text ~ '(.)\1{5,}'
     or char_length(regexp_replace(combined_text, '[^[:alpha:]]', '', 'g')) < 0.5 * char_length(combined_text) then
    hold_reasons := hold_reasons || 'the text looks like gibberish';
  end if;
  if exists (select 1 from public.issues where reporter_id = new.reporter_id and created_at > now() - interval '24 hours'
             and (lower(trim(title)) = lower(trim(new.title)) or lower(trim(description)) = lower(trim(new.description)))) then
    hold_reasons := hold_reasons || 'it repeats a recent report';
  end if;

  select int_value into auto_publish from public.app_settings where key = 'auto_publish';
  new.parent_id := null; new.link_type := null;
  if coalesce(auto_publish, 1) = 1 and cardinality(hold_reasons) = 0 then
    new.status := 'Published'; new.status_reason := null;
    -- automatic backend duplicate & independent grouping via trigram similarity
    select i.id, similarity(i.title || ' ' || i.description, combined_text)
      into matched_parent, matched_sim
      from public.issues i
      where i.building_id = new.building_id
        and i.category = new.category
        and i.parent_id is null
        and i.status in ('Published', 'In Progress')
        and similarity(i.title || ' ' || i.description, combined_text) >= 0.35
      order by 2 desc
      limit 1;
    if matched_parent is not null then
      new.parent_id := matched_parent;
      new.link_type := case when matched_sim >= 0.62 then 'true_duplicate' else 'independent' end;
    end if;
  else
    new.status := 'Pending Review';
    new.status_reason := 'Held for review: ' || case when cardinality(hold_reasons) = 0 then 'automatic publishing is switched off' else array_to_string(hold_reasons, '; ') end;
  end if;
  return new;
end $$;
drop trigger if exists trg_issues_before_insert on public.issues;
create trigger trg_issues_before_insert before insert on public.issues for each row execute function public.issues_before_insert();

create or replace function public.issues_after_insert() returns trigger
language plpgsql security definer set search_path = public as $$
declare ref text := 'FRC-' || extract(year from new.created_at)::int || '-' || new.ref_number;
        parent_ref text;
begin
  insert into public.audit_log (issue_id, actor_id, actor_name, action)
  values (new.id, new.reporter_id, new.reporter_name, 'Submitted by ' || new.reporter_name);
  if new.parent_id is not null then
    select 'FRC-' || extract(year from created_at)::int || '-' || ref_number into parent_ref from public.issues where id = new.parent_id;
    insert into public.audit_log (issue_id, actor_name, action)
    values (new.id, 'Auto-Grouping Engine', 'Automatically grouped as ' || replace(new.link_type, '_', ' ') || ' under ' || coalesce(parent_ref, 'canonical issue'));
    insert into public.audit_log (issue_id, actor_name, action)
    values (new.parent_id, 'Auto-Grouping Engine', 'Automatically linked ' || ref || ' as ' || replace(new.link_type, '_', ' '));
  end if;
  if new.status = 'Published' then
    insert into public.audit_log (issue_id, actor_name, action) values (new.id, 'System', 'Auto-published after passing integrity checks');
    insert into public.notifications (user_id, issue_id, title, message, type)
    values (new.reporter_id, new.id, 'Report published', 'Your report ' || ref || ' passed the checks and is live on the campus map.', 'approved');
  else
    insert into public.audit_log (issue_id, actor_name, action) values (new.id, 'System', new.status_reason);
    insert into public.notifications (user_id, issue_id, title, message, type)
    values (new.reporter_id, new.id, 'Report held for review', 'Your report ' || ref || ' is waiting for an administrator. ' || new.status_reason, 'progress');
  end if;
  return new;
end $$;
drop trigger if exists trg_issues_after_insert on public.issues;
create trigger trg_issues_after_insert after insert on public.issues for each row execute function public.issues_after_insert();

create or replace function public.issues_before_update() returns trigger
language plpgsql as $$
begin
  if new.status = 'Rejected' and old.status is distinct from 'Rejected' and coalesce(trim(new.status_reason), '') = '' then
    raise exception 'REASON_REQUIRED: A reason is required to reject a report.';
  end if;
  new.updated_at := now();
  return new;
end $$;
drop trigger if exists trg_issues_before_update on public.issues;
create trigger trg_issues_before_update before update on public.issues for each row execute function public.issues_before_update();

create or replace function public.issues_after_update() returns trigger
language plpgsql security definer set search_path = public as $$
declare actor text := coalesce(public.actor_name(), 'System');
        ref text := 'FRC-' || extract(year from new.created_at)::int || '-' || new.ref_number;
begin
  if new.status is distinct from old.status then
    insert into public.audit_log (issue_id, actor_id, actor_name, action) values
      (new.id, auth.uid(), actor, 'Status updated from ' || old.status || ' to ' || new.status || coalesce(' (' || new.status_reason || ')', ''));
    if auth.uid() is distinct from new.reporter_id then
      insert into public.notifications (user_id, issue_id, title, message, type) values
        (new.reporter_id, new.id, 'Status updated: ' || new.status,
         'Your report ' || ref || ' is now ' || new.status || coalesce('. ' || new.status_reason, '') ,
         case new.status when 'Resolved' then 'resolved' when 'Rejected' then 'rejected'
              when 'Needs Clarification' then 'clarification' when 'Published' then 'approved' else 'progress' end);
    end if;
  end if;
  if new.severity is distinct from old.severity then
    insert into public.audit_log (issue_id, actor_id, actor_name, action)
    values (new.id, auth.uid(), actor, 'Severity adjusted from S' || old.severity || ' to S' || new.severity);
  end if;
  if new.parent_id is distinct from old.parent_id then
    insert into public.audit_log (issue_id, actor_id, actor_name, action)
    values (new.id, auth.uid(), actor, case when new.parent_id is null then 'Unlinked into standalone issue' else 'Linked as ' || new.link_type end);
  end if;
  return new;
end $$;
drop trigger if exists trg_issues_after_update on public.issues;
create trigger trg_issues_after_update after update on public.issues for each row execute function public.issues_after_update();

create or replace function public.confirmations_before_insert() returns trigger
language plpgsql security definer set search_path = public as $$
declare target public.issues; prof public.profiles;
begin
  select * into target from public.issues where id = new.issue_id;
  select * into prof from public.profiles where id = new.user_id;
  if target.reporter_id = new.user_id then raise exception 'SELF_CONFIRM: You cannot confirm your own report.'; end if;
  if target.parent_id is not null then raise exception 'NOT_CANONICAL: Confirm the main issue instead.'; end if;
  if target.status not in ('Published','In Progress') then raise exception 'NOT_OPEN: Only published, open issues can be confirmed.'; end if;
  if prof.restricted_until is not null and prof.restricted_until > now() then raise exception 'RESTRICTED: Your account is temporarily restricted.'; end if;
  insert into public.audit_log (issue_id, actor_id, actor_name, action)
  values (new.issue_id, new.user_id, coalesce(prof.full_name, prof.email), 'Confirmed ("Experiencing this too") by ' || coalesce(prof.full_name, prof.email));
  return new;
end $$;
drop trigger if exists trg_confirmations_before_insert on public.confirmations;
create trigger trg_confirmations_before_insert before insert on public.confirmations for each row execute function public.confirmations_before_insert();

create or replace function public.flags_after_insert() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.audit_log (issue_id, actor_id, actor_name, action)
  values (new.issue_id, new.flagged_by, public.actor_name(), 'Flagged for moderation (' || new.reason || ')');
  -- one flag is an allegation; three open flags move a published report into review
  if (select count(*) from public.flags where issue_id = new.issue_id and status = 'open') >= coalesce((select int_value from public.app_settings where key = 'flag_threshold'), 3) then
    update public.issues set status = 'Flagged', status_reason = 'Multiple community flags'
    where id = new.issue_id and status = 'Published';
  end if;
  return new;
end $$;
drop trigger if exists trg_flags_after_insert on public.flags;
create trigger trg_flags_after_insert after insert on public.flags for each row execute function public.flags_after_insert();

-- ---------- RPCs ----------
create or replace function public.respond_to_clarification(p_issue uuid, p_text text) returns void
language plpgsql security definer set search_path = public as $$
begin
  update public.issues
  set description = description || E'\n\n[Student Clarification]: ' || trim(p_text), status = 'Pending Review', status_reason = null
  where id = p_issue and reporter_id = auth.uid() and status = 'Needs Clarification';
  if not found then raise exception 'NOT_ALLOWED: This report is not waiting for your clarification.'; end if;
end $$;

-- Progressive enforcement: strike 1 = warning, 2 = 24h restriction, 3+ = 7 days
create or replace function public.record_abuse(p_user uuid, p_note text) returns void
language plpgsql security definer set search_path = public as $$
declare strikes int;
begin
  if not public.is_admin() then raise exception 'NOT_ALLOWED: Admins only.'; end if;
  update public.profiles set abuse_strikes = abuse_strikes + 1,
    restricted_until = case when abuse_strikes + 1 >= 3 then now() + interval '7 days'
                            when abuse_strikes + 1 = 2 then now() + interval '24 hours' else restricted_until end
  where id = p_user returning abuse_strikes into strikes;
  insert into public.notifications (user_id, title, message, type) values (p_user,
    case when strikes = 1 then 'Warning from moderation' else 'Reporting temporarily restricted' end,
    coalesce(p_note, 'Confirmed misuse of the reporting system.'), 'rejected');
end $$;

create or replace function public.find_similar_issues(p_building text, p_category text, p_text text)
returns table (id uuid, ref_number bigint, title text, description text, status text, similarity real, confirmations bigint)
language sql stable security invoker set search_path = public, extensions as $$
  select i.id, i.ref_number, i.title, i.description, i.status,
         similarity(i.title || ' ' || i.description, p_text),
         (select count(*) from public.confirmations c where c.issue_id = i.id)
  from public.issues i
  where i.building_id = p_building and i.category = p_category and i.parent_id is null
    and i.status in ('Published','In Progress')
    and similarity(i.title || ' ' || i.description, p_text) > 0.1
  order by 6 desc limit 3 $$;

create or replace function public.lift_restriction(p_user uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'NOT_ALLOWED: Admins only.'; end if;
  update public.profiles set restricted_until = null where id = p_user;
end $$;

-- Creates the caller's profile row if it is missing (accounts created before the trigger existed)
create or replace function public.ensure_profile() returns void
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  select id, email, raw_user_meta_data->>'full_name' from auth.users where id = auth.uid()
  on conflict do nothing;
end $$;

-- One-time backfill for anyone who signed in before the trigger existed
insert into public.profiles (id, email, full_name)
select id, email, raw_user_meta_data->>'full_name' from auth.users
on conflict do nothing;

-- ---------- row-level security ----------
alter table public.issues enable row level security;
alter table public.confirmations enable row level security;
alter table public.flags enable row level security;
alter table public.admin_notes enable row level security;
alter table public.audit_log enable row level security;
alter table public.notifications enable row level security;

drop policy if exists "issues read" on public.issues;
drop policy if exists "issues student insert" on public.issues;
drop policy if exists "issues admin update" on public.issues;
create policy "issues read" on public.issues for select to authenticated
  using (status in ('Published','In Progress','Resolved') or reporter_id = auth.uid() or public.is_admin());
create policy "issues student insert" on public.issues for insert to authenticated
  with check (reporter_id = auth.uid() and not public.is_admin());
create policy "issues admin update" on public.issues for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "confirmations read" on public.confirmations;
drop policy if exists "confirmations insert" on public.confirmations;
create policy "confirmations read" on public.confirmations for select to authenticated using (true);
create policy "confirmations insert" on public.confirmations for insert to authenticated
  with check (user_id = auth.uid() and not public.is_admin());

drop policy if exists "flags insert" on public.flags;
drop policy if exists "flags read" on public.flags;
drop policy if exists "flags admin update" on public.flags;
create policy "flags insert" on public.flags for insert to authenticated with check (flagged_by = auth.uid());
create policy "flags read" on public.flags for select to authenticated using (flagged_by = auth.uid() or public.is_admin());
create policy "flags admin update" on public.flags for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "notes read" on public.admin_notes;
drop policy if exists "notes admin insert" on public.admin_notes;
create policy "notes read" on public.admin_notes for select to authenticated
  using (exists (select 1 from public.issues i where i.id = issue_id));
create policy "notes admin insert" on public.admin_notes for insert to authenticated
  with check (public.is_admin() and author_id = auth.uid());

drop policy if exists "audit read" on public.audit_log;
create policy "audit read" on public.audit_log for select to authenticated
  using (exists (select 1 from public.issues i where i.id = issue_id));

drop policy if exists "notif read own" on public.notifications;
drop policy if exists "notif update own" on public.notifications;
drop policy if exists "notif admin insert" on public.notifications;
create policy "notif read own" on public.notifications for select to authenticated using (user_id = auth.uid());
create policy "notif update own" on public.notifications for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "notif admin insert" on public.notifications for insert to authenticated with check (public.is_admin());

-- ---------- photo storage ----------
insert into storage.buckets (id, name, public) values ('issue-photos', 'issue-photos', true) on conflict do nothing;
drop policy if exists "upload own photos" on storage.objects;
create policy "upload own photos" on storage.objects for insert to authenticated
  with check (bucket_id = 'issue-photos' and (storage.foldername(name))[1] = auth.uid()::text);

-- ---------- API access grants ----------
-- Newer Supabase projects do not give the API roles access to new tables automatically,
-- which shows up as "permission denied for table ...". Row-level security above still limits what each row-level user can do.
grant usage on schema public to anon, authenticated;
grant select on public.profiles, public.buildings, public.app_settings, public.confirmations,
                public.audit_log, public.admin_notes to authenticated;
grant select, insert, update on public.issues, public.flags, public.notifications to authenticated;
grant insert on public.confirmations, public.admin_notes to authenticated;
grant update on public.buildings, public.app_settings to authenticated;
grant execute on all functions in schema public to authenticated;

-- Make yourself admin after your first Google sign-in:
-- update public.profiles set role = 'admin' where email = 'you@example.com';
