
const config = {
  auth: {
    jwtSecret: process.env.JWT_SECRET || '',
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
  },
};

export default config;
