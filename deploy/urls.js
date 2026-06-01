/**
 * Canonical deployment URLs — update when domains change.
 * Used in docs; production CORS also lists PRODUCTION_FRONTEND_URL in server/src/config/cors.js
 */
export const FRONTEND_URL = 'https://runlog-eta.vercel.app';

/** Set after Render deploy, then add the same value to Vercel as VITE_API_URL */
export const API_URL_PLACEHOLDER = 'https://YOUR-SERVICE.onrender.com';
export const API_BASE_PATH = '/api';
