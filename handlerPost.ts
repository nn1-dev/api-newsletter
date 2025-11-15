import { Resend } from "npm:resend";
import { PREFIX } from "./constants.ts";
import { renderEmailAdminNewsletterSubscribe } from "https://raw.githubusercontent.com/nn1-dev/emails/main/emails/admin-newsletter-subscribe.tsx";
import { ulid } from "https://deno.land/x/ulid@v0.3.0/mod.ts";
import { normalizeEmail } from "./utils.ts";

const resend = new Resend(Deno.env.get("API_KEY_RESEND"));

const handlerPost = async (request: Request, kv: Deno.Kv) => {
  const body: {
    email: string;
  } = await request.json();
  const normalizedBodyEmail = normalizeEmail(body.email);

  const entriesIterator = kv.list<{
    timestamp: string;
    email: string;
  }>({
    prefix: [PREFIX],
  });
  const entries = await Array.fromAsync(entriesIterator);
  const entry = entries.find((e) => e.value.email === normalizedBodyEmail);
  if (entry) {
    return Response.json(
      {
        status: "success",
        statusCode: 200,
        data: entry,
        error: null,
      },
      { status: 200 },
    );
  }

  const data = {
    timestamp: new Date().toISOString(),
    email: normalizedBodyEmail,
  };

  // const memberId = ulid();
  // await kv.set([PREFIX, memberId], data);
  console.log({ normalizedBodyEmail });

  const emailAdmin = await renderEmailAdminNewsletterSubscribe({
    email: normalizedBodyEmail,
  });
  const { error } = await resend.emails.send({
    from: "NN1 Dev Club <club@nn1.dev>",
    to: Deno.env.get("ADMIN_RECIPIENTS")?.split(",")!,
    subject: "✨ Newsletter - user subscribed",
    html: emailAdmin.html,
    text: emailAdmin.text,
  });

  if (error) {
    return Response.json(
      {
        status: "error",
        statusCode: 400,
        data: null,
        error: error,
      },
      { status: 400 },
    );
  }

  return Response.json(
    {
      status: "success",
      statusCode: 200,
      data,
      error: null,
    },
    { status: 200 },
  );
};

export default handlerPost;
