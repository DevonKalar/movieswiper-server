import axios from 'axios';
import { config } from '@/config/env.js';

export const openaiAxios = axios.create({
    baseURL: 'https://api.openai.com/v1/',
    headers: {
        Authorization: `Bearer ${config.apiKeys.openai}`,
        'Content-Type': 'application/json',
    },
});
