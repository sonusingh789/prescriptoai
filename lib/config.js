/**
 * App config for auth and OpenAI. DB is configured in lib/db.js.
 */
const config = {
  auth: {
    jwtSecret: process.env.JWT_SECRET || 'prescriptoai-jwt-secret-change-in-production-min-32-chars',
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
  },
};

export default config;
