export interface TemplateResult {
    subject: string;
    html: string;
    text: string;
}

export interface WelcomeData {
    firstName: string;
    lastName: string;
}

export interface WatchlistMilestoneData {
    firstName: string;
    milestoneCount: number;
}

export interface WeeklyDigestData {
    firstName: string;
    topMovies: Array<{ title: string; ratings: number }>;
    weekLabel: string;
}

export interface PasswordResetData {
    firstName: string;
    resetUrl: string;
    expiresInMinutes: number;
}

export type EmailTemplateInput =
    | { eventType: 'welcome'; data: WelcomeData }
    | { eventType: 'watchlist_milestone'; data: WatchlistMilestoneData }
    | { eventType: 'weekly_digest'; data: WeeklyDigestData }
    | { eventType: 'password_reset'; data: PasswordResetData };

export { welcomeTemplate } from './welcome.js';
export { watchlistMilestoneTemplate } from './watchlistMilestone.js';
export { weeklyDigestTemplate } from './weeklyDigest.js';
export { passwordResetTemplate } from './passwordReset.js';
