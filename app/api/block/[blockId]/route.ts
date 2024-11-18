export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
// Post to conform to useCompletion API
const POST = async (req: Request, context: { params: any }) => {
 //console.log("[ROUTE] POST /api/block/[blockId]/route")
  
  const blockId = context.params.blockId;
    //console.log(`/api/block/${blockId}`);

    console.log(`No response body`);
  throw Error("No response body");
};

// GET raw data from block
const GET = async (req: Request, context: { params: any }) => {
  //console.log("[ROUTE] GET /api/block/[blockId]/route")
  const blockId = context.params.blockId;
  //console.log(`/api/block/${blockId}`);

    console.log(`No response body`);
  throw Error("No response body");
};

export { GET, POST };
