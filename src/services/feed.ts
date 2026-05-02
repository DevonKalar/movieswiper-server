import prisma from '@/lib/prisma.js';
import type { FeedMovie } from '@/types/feed.js';
import { getDaysAgoDate } from '@/utils/dates.js';

const FEED_WINDOW_DAYS = 7;

const VIEW_MULTIPLIERS = {
    within1Day: 0.1,
    within3Days: 0.3,
    within7Days: 0.6,
} as const;

function getRecentlyViewedMultiplier(lastViewedAt: Date): number {
    const oneDayAgo = getDaysAgoDate(1);
    const threeDaysAgo = getDaysAgoDate(3);
    const sevenDaysAgo = getDaysAgoDate(7);

    if (lastViewedAt >= oneDayAgo) return VIEW_MULTIPLIERS.within1Day;
    if (lastViewedAt >= threeDaysAgo) return VIEW_MULTIPLIERS.within3Days;
    if (lastViewedAt >= sevenDaysAgo) return VIEW_MULTIPLIERS.within7Days;
    return 1;
}

function getFeedCandidateMovies(userId: string, since: Date) {
    return prisma.movies.findMany({
        where: { createdAt: { gte: since } },
        include: {
            movieReactions: { select: { reaction: true } },
            movieViews: {
                where: { userId, viewedAt: { gte: since } },
                orderBy: { viewedAt: 'desc' },
                take: 1,
                select: { viewedAt: true },
            },
        },
    });
}

function countLikes(movieReactions: { reaction: string }[]): number {
    return movieReactions.filter(({ reaction }) => reaction === 'like').length;
}

function compareFeedMovies(a: FeedMovie, b: FeedMovie) {
    if(a.score !== b.score) return b.score - a.score;

    return b.createdAt.getTime() - a.createdAt.getTime();
}

export async function getFeed(userId: string): Promise<FeedMovie[]> {
    const feedWindowStart = getDaysAgoDate(FEED_WINDOW_DAYS);
    const movies = await getFeedCandidateMovies(userId, feedWindowStart);

    return movies
        .map(({ movieReactions, movieViews, ...movie }) => {
            const baseScore = countLikes(movieReactions);
            const lastViewedAt = movieViews[0]?.viewedAt ?? null;
            const score = lastViewedAt
                ? baseScore * getRecentlyViewedMultiplier(lastViewedAt)
                : baseScore;

            return { ...movie, score };
        })
        .sort(compareFeedMovies);
}