alter table public.documents
drop column if exists category,
drop column if exists link_url;