import { welcomeTemplate } from '../welcome.js';
import { watchlistMilestoneTemplate } from '../watchlistMilestone.js';
import { weeklyDigestTemplate } from '../weeklyDigest.js';
import { passwordResetTemplate } from '../passwordReset.js';

describe('welcomeTemplate', () => {
    it('includes firstName in subject and body', () => {
        const result = welcomeTemplate({ firstName: 'Alice', lastName: 'Smith' });
        expect(result.subject).toContain('Alice');
        expect(result.html).toContain('Alice');
        expect(result.text).toContain('Alice');
    });

    it('returns non-empty html and text', () => {
        const result = welcomeTemplate({ firstName: 'Alice', lastName: 'Smith' });
        expect(result.html.length).toBeGreaterThan(0);
        expect(result.text.length).toBeGreaterThan(0);
    });
});

describe('watchlistMilestoneTemplate', () => {
    it('includes milestoneCount in subject and body', () => {
        const result = watchlistMilestoneTemplate({ firstName: 'Bob', milestoneCount: 10 });
        expect(result.subject).toContain('10');
        expect(result.html).toContain('10');
        expect(result.text).toContain('10');
    });

    it('includes firstName in body', () => {
        const result = watchlistMilestoneTemplate({ firstName: 'Bob', milestoneCount: 10 });
        expect(result.html).toContain('Bob');
        expect(result.text).toContain('Bob');
    });
});

describe('weeklyDigestTemplate', () => {
    const data = {
        firstName: 'Carol',
        weekLabel: 'Week of May 4, 2026',
        topMovies: [
            { title: 'Inception', ratings: 8.8 },
            { title: 'The Matrix', ratings: 8.7 },
        ],
    };

    it('includes weekLabel in subject', () => {
        const result = weeklyDigestTemplate(data);
        expect(result.subject).toContain('Week of May 4, 2026');
    });

    it('lists all movie titles in html and text', () => {
        const result = weeklyDigestTemplate(data);
        expect(result.html).toContain('Inception');
        expect(result.html).toContain('The Matrix');
        expect(result.text).toContain('Inception');
        expect(result.text).toContain('The Matrix');
    });

    it('includes firstName in body', () => {
        const result = weeklyDigestTemplate(data);
        expect(result.html).toContain('Carol');
    });
});

describe('passwordResetTemplate', () => {
    const data = {
        firstName: 'Dave',
        resetUrl: 'https://app.movieswiper.com/reset?token=abc123',
        expiresInMinutes: 30,
    };

    it('includes resetUrl in html and text', () => {
        const result = passwordResetTemplate(data);
        expect(result.html).toContain(data.resetUrl);
        expect(result.text).toContain(data.resetUrl);
    });

    it('includes expiry in html and text', () => {
        const result = passwordResetTemplate(data);
        expect(result.html).toContain('30');
        expect(result.text).toContain('30');
    });

    it('includes firstName in body', () => {
        const result = passwordResetTemplate(data);
        expect(result.html).toContain('Dave');
    });
});
