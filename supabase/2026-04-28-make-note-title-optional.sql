-- Make notes.title optional. The title field is no longer required by the UI;
-- only the note body (text) must be present. Existing rows with empty titles
-- are normalised to NULL so queries can rely on a single sentinel for "no title".

alter table public.notes
  alter column title drop not null;

update public.notes
  set title = null
  where title is not null
    and length(btrim(title)) = 0;
