import {
    processPendingEmailNotifications,
    resetStuckEmailNotifications,
} from '@services/emailNotifications.js';

export async function processEmailNotifications(): Promise<void> {
    const resetCount = await resetStuckEmailNotifications();
    if (resetCount > 0) {
        console.log(`processEmailNotifications: reset ${resetCount} stuck email(s) to pending`);
    }

    const result = await processPendingEmailNotifications();

    console.log(
        `processEmailNotifications complete — sent: ${result.sent}, failed: ${result.failed}, skipped: ${result.skipped}`,
    );
}
