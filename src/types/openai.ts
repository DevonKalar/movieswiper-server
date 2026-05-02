// Response types (based on OpenAI API structure)
export type OpenAIResponse = {
    id: string;
    object: string;
    created_at: number;
    output: string | null;
    status: string;
    metadata?: Record<string, unknown>;
};

// Error responses
export type OpenAIErrorResponse = {
    error: string;
};
