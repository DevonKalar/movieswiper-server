import type { WelcomeData, TemplateResult } from './index.js';

export function welcomeTemplate(data: WelcomeData): TemplateResult {
    return {
        subject: `Welcome to MovieSwiper, ${data.firstName}!`,
        html: `
<!DOCTYPE html>
<html>
<body style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
  <h1>Welcome, ${data.firstName}!</h1>
  <p>Your MovieSwiper account is ready. Start swiping to build your personal watchlist.</p>
  <p>Happy watching,<br>The MovieSwiper Team</p>
</body>
</html>`.trim(),
        text: `Welcome, ${data.firstName}!\n\nYour MovieSwiper account is ready. Start swiping to build your personal watchlist.\n\nHappy watching,\nThe MovieSwiper Team`,
    };
}
