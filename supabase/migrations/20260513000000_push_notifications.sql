-- Create push_tokens table
create table if not exists public.push_tokens (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade not null,
    token text not null,
    device_id text,
    device_name text,
    platform text,
    last_seen_at timestamp with time zone default now(),
    created_at timestamp with time zone default now(),
    unique(user_id, token)
);

-- Enable RLS
alter table public.push_tokens enable row level security;

-- Policies
create policy "Users can view their own tokens"
    on public.push_tokens for select
    using (auth.uid() = user_id);

create policy "Users can insert their own tokens"
    on public.push_tokens for insert
    with check (auth.uid() = user_id);

create policy "Users can update their own tokens"
    on public.push_tokens for update
    using (auth.uid() = user_id);

create policy "Users can delete their own tokens"
    on public.push_tokens for delete
    using (auth.uid() = user_id);

-- Indexes
create index if not exists idx_push_tokens_user_id on public.push_tokens(user_id);
create index if not exists idx_push_tokens_token on public.push_tokens(token);

-- Function to update last_seen_at
create or replace function public.handle_push_token_update()
returns trigger as $$
begin
    new.last_seen_at = now();
    return new;
end;
$$ language plpgsql;

create trigger tr_push_tokens_update
    before update on public.push_tokens
    for each row
    execute function public.handle_push_token_update();
