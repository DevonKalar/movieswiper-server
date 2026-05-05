import type { WeeklyDigestData, TemplateResult } from './index.js';

export function weeklyDigestTemplate(data: WeeklyDigestData): TemplateResult {
    const movieListHtml = data.topMovies
        .map(
            (m) =>
                `<li><strong>${m.title}</strong> — ${m.ratings.toFixed(1)}/10</li>`,
        )
        .join('\n');

    const movieListText = data.topMovies
        .map((m) => `- ${m.title} (${m.ratings.toFixed(1)}/10)`)
        .join('\n');

    return {
        subject: `Your MovieSwiper digest for ${data.weekLabel}`,
        html: `
<!DOCTYPE html>
<html>
<body style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
  <h1>Your weekly digest, ${data.firstName}</h1>
  <p>Here are your top-rated watchlist picks for <strong>${data.weekLabel}</strong>:</p>
  <ul>
    ${movieListHtml}
  </ul>
  <p>The MovieSwiper Team</p>
</body>
</html>`.trim(),
        text: `Your weekly digest, ${data.firstName}\n\nTop-rated watchlist picks for ${data.weekLabel}:\n${movieListText}\n\nThe MovieSwiper Team`,
    };
}
