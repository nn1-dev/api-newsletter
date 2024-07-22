import { PREFIX } from "./constants.ts";

const handlerGet = async (_request: Request, kv: Deno.Kv) => {
  const entriesIterator = kv.list<{
    timestamp: string;
    email: string;
  }>({
    prefix: [PREFIX],
  });
  const entries = await Array.fromAsync(entriesIterator);

  return Response.json(
    {
      status: "success",
      statusCode: 200,
      data: entries,
      error: null,
    },
    { status: 200 },
  );
};

export default handlerGet;
