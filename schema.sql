-- Run once in Supabase > SQL Editor.
-- Column names match exactly what the API code reads/writes.
create table if not exists public.tickets (
  id              bigint generated always as identity primary key,
  "fullName"      text not null,
  phone           text not null,
  "paymentMethod" text not null,
  "transactionId" text not null unique,
  "ticketNumber"  text not null unique,
  status          text not null default 'Pending'
                  check (status in ('Pending','Approved','Rejected')),
  "isWinner"      boolean not null default false,
  "prizeWon"      text,
  created_at      timestamptz not null default now()
);
create index if not exists tickets_phone_idx on public.tickets (phone);
create index if not exists tickets_draw_idx  on public.tickets (status, "isWinner");

create table if not exists public.prizes (
  id          bigint generated always as identity primary key,
  "prizeName" text not null,
  amount      text not null,
  description text,
  created_at  timestamptz not null default now()
);

-- Lock the tables: only the server (service_role key) can touch them.
alter table public.tickets enable row level security;
alter table public.prizes  enable row level security;

-- If your tickets table already exists with "createdAt" instead of created_at:
--   alter table public.tickets rename column "createdAt" to created_at;
