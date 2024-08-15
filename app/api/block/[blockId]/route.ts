import { Steamship,SteamshipStream, } from '@steamship/client';
import { StreamingTextResponse } from "ai";
export const runtime = 'edge';
export const dynamic = 'force-dynamic';
// Post to conform to useCompletion API
const POST = async (req: Request, context: { params: any }) => {
 console.log("[ROUTE] POST /api/block/[blockId]/route")
  const blockId = context.params.blockId;
    console.log(`/api/block/${blockId}`);
  const steamship = new Steamship({apiKey: process.env.STEAMSHIP_API_KEY})
  const response = await steamship.block.raw({ id: blockId });
  if (response.body) {
      console.log(`/api/block/${blockId} -streaming`);
    return new StreamingTextResponse(response.body);
  }
    console.log(`No response body`);
  throw Error("No response body");
};

// GET raw data from block
const GET = async (req: Request, context: { params: any }) => {
    console.log("[ROUTE] GET /api/block/[blockId]/route")
  const blockId = context.params.blockId;
  console.log(`/api/block/${blockId}`);
  const steamship =  new Steamship({apiKey: process.env.STEAMSHIP_API_KEY})
  const response = await steamship.block.raw({ id: blockId });
  console.log(`/api/block/${blockId} - Response OK? ${response.ok}`);
  return response;
};

export { GET, POST };
