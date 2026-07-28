export const SERVER_URL = process.env.NEXT_PUBLIC_API_URL?.slice(0, -4) ?? 'http://localhost:8000';
export const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? `${SERVER_URL}/api`;
export const HEALTH_URL = `${SERVER_URL}/health`;
