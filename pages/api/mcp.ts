import { NextApiRequest, NextApiResponse } from 'next';
import { createBaseMcpServer, createMcpRouter } from '@corsair-dev/mcp';
import { corsair } from '@/lib/corsair';

const mcpRouter = createMcpRouter(() => createBaseMcpServer({ corsair }));

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // Express router expects req.url to match the route path (which is '/')
  const oldUrl = req.url;
  console.log(`[MCP Router] incoming req.url=${req.url}, req.method=${req.method}`);
  req.url = '/';

  return new Promise<void>((resolve, reject) => {
    mcpRouter(req as any, res as any, (err: any) => {
      req.url = oldUrl;
      if (err) return reject(err);
      
      // If the router didn't handle the request, return 404
      if (!res.headersSent) {
        res.status(404).json({ error: 'Not Found' });
      }
      resolve();
    });
  });
}
