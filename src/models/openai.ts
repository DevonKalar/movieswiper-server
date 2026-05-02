import * as z from 'zod';

export const responseSchema = z.object({
    input: z.string().min(2).max(1000),
    instructions: z.string().min(2).max(1000).optional(),
    previous_response_id: z.string().optional(),
});

export const retrieveSchema = z.object({
    id: z.string().min(1),
});

export type ResponseInput = z.infer<typeof responseSchema>;
export type RetrieveParams = z.infer<typeof retrieveSchema>;
