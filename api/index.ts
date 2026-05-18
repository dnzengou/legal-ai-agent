// Vercel serverless entry point — wraps the Hono app's fetch handler
import app from "./boot";

export default app.fetch.bind(app);
