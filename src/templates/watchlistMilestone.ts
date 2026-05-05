import type { WatchlistMilestoneData, TemplateResult } from './index.js';

export function watchlistMilestoneTemplate(data: WatchlistMilestoneData): TemplateResult {
    return {
        subject: `Nice! You've added ${data.milestoneCount} movies to your watchlist`,
        html: `
<!DOCTYPE html>
<html>
<body style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
  <h1>Congrats, ${data.firstName}!</h1>
  <p>You've hit <strong>${data.milestoneCount} movies</strong> on your watchlist — you're on a roll.</p>
  <p>Keep swiping to discover even more great films.</p>
  <p>The MovieSwiper Team</p>
</body>
</html>`.trim(),
        text: `Congrats, ${data.firstName}!\n\nYou've hit ${data.milestoneCount} movies on your watchlist — you're on a roll.\n\nKeep swiping to discover even more great films.\n\nThe MovieSwiper Team`,
    };
}
