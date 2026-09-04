import app from '../server/src/index.js';

// Vercel serverless entrypoint. The whole Express app (API + uploads + downloads)
// is served through this single function; static frontend files are served
// directly by Vercel from client/dist (see vercel.json).
export const config = {
  api: {
    // Let Express/multer own request parsing (JSON, urlencoded, multipart).
    bodyParser: false,
  },
};

export default app;