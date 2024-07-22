import { PREFIX } from "./constants.ts";

const handlerDelete = async (request: Request, kv: Deno.Kv) => {
  const pattern = new URLPattern({
    pathname: "/:memberId?",
  });
  const patternResult = pattern.exec(request.url);
  const memberId = patternResult?.pathname.groups.memberId;

  if (!memberId) {
    return Response.json(
      {
        status: "success",
        statusCode: 400,
        data: null,
        error: "Invalid request.",
      },
      { status: 400 },
    );
  }

  await kv.delete([PREFIX, memberId]);

  return Response.json(
    {
      status: "success",
      statusCode: 200,
      data: {
        memberId,
      },
      error: null,
    },
    { status: 200 },
  );
};

export default handlerDelete;
