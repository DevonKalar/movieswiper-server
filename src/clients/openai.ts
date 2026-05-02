import { openaiAxios } from '@/lib/openaiAxios.js';

export async function createResponse(
    input: string,
    instructions?: string,
    previous_response_id?: string,
) {
    const { data } = await openaiAxios.post('responses', {
        model: 'gpt-4o',
        input,
        ...(instructions && { instructions }),
        ...(previous_response_id && { previous_response_id }),
    });
    return data;
}

export async function retrieveResponse(responseId: string) {
    const { data } = await openaiAxios.get(`responses/${responseId}`);
    return data;
}
