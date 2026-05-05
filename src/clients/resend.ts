import { Resend } from 'resend';
import { config } from '@/config/env.js';

const resendClient = new Resend(config.apiKeys.resend);

export interface SendEmailParams {
    to: string;
    subject: string;
    html: string;
    text: string;
}

export async function sendEmail(params: SendEmailParams): Promise<{ id: string }> {
    const { data, error } = await resendClient.emails.send({
        from: config.emailFromAddress,
        to: params.to,
        subject: params.subject,
        html: params.html,
        text: params.text,
    });

    if (error || !data) {
        throw new Error(`Resend error: ${error?.message ?? 'unknown'}`);
    }

    return { id: data.id };
}
