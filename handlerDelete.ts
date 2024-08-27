import { Resend } from "npm:resend";
import { PREFIX } from "./constants.ts";
import { renderEmailAdminNewsletterUnsubscribe } from "https://raw.githubusercontent.com/nn1-dev/emails/main/emails/admin-newsletter-unsubscribe.tsx";

const resend = new Resend(Deno.env.get("API_KEY_RESEND"));

const handlerDelete = async (request: Request, kv: Deno.Kv) => {
  const pattern = new URLPattern({
    pathname: "/:memberId?",
  });
  const patternResult = pattern.exec(request.url);
  const memberId = patternResult?.pathname.groups.memberId;

  if (!memberId) {
    return Response.json(
      {
        status: "error",
        statusCode: 400,
        data: null,
        error: "Invalid request.",
      },
      { status: 400 },
    );
  }

  const entry = await kv.get<{
    timestamp: string;
    email: string;
  }>([PREFIX, memberId]);

  if (!entry.value) {
    return Response.json(
      {
        status: "error",
        statusCode: 400,
        data: null,
        error: "Invalid request.",
      },
      { status: 400 },
    );
  }

  const emailAdmin = await renderEmailAdminNewsletterUnsubscribe({
    email: entry.value.email,
  });

  await Promise.all([
    kv.delete([PREFIX, memberId]),
    resend.emails.send({
      from: "NN1 Dev Club <club@nn1.dev>",
      to: Deno.env.get("ADMIN_RECIPIENTS")?.split(",")!,
      subject: "✨ Newsletter - user unsubscribed",
      html: emailAdmin.html,
      text: emailAdmin.text,
    }),
  ]);

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
