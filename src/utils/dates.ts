export const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function getDaysAgoDate(days: number): Date {
    return new Date(Date.now() - MS_PER_DAY * days);
}