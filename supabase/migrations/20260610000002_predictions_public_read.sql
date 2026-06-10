-- Allow all authenticated users to read all predictions and bonus_predictions
-- Required for leaderboard view (security_invoker=true) and estadísticas page
-- to show data from all participants, not just the current user.

drop policy if exists "predictions_select" on predictions;
create policy "predictions_select" on predictions
  for select using (auth.uid() is not null);

drop policy if exists "bonus_select" on bonus_predictions;
create policy "bonus_select" on bonus_predictions
  for select using (auth.uid() is not null);
