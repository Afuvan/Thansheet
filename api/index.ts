import app, { ensureDbLoaded } from '../server';

export default async function handler(req: any, res: any) {
  await ensureDbLoaded();
  return app(req, res);
}
