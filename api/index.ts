import app, { ensureDbLoaded } from '../server';

export default async function handler(req: any, res: any) {
  try {
    await ensureDbLoaded();
    return app(req, res);
  } catch (err: any) {
    console.error("Vercel Serverless Function Error:", err);
    return res.status(500).json({
      error: "Internal Server Error",
      message: err.message || String(err)
    });
  }
}
