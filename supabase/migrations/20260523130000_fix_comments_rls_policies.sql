-- Yorum silme/güncelleme: auth.uid() yorum sahibi (user_id) ile eşleşmeli.
drop policy if exists "Users can insert their own comments" on public.comments;
drop policy if exists "Users can update own comments" on public.comments;
drop policy if exists "Users can delete own comments" on public.comments;

create policy "Users can insert their own comments"
  on public.comments
  for insert
  with check (auth.uid() = user_id);

create policy "Users can update own comments"
  on public.comments
  for update
  using (auth.uid() = user_id);

create policy "Users can delete own comments"
  on public.comments
  for delete
  using (auth.uid() = user_id);
