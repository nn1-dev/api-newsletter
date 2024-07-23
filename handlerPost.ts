import { Resend } from "npm:resend";
import { PREFIX } from "./constants.ts";
import { renderEmailAdminNewsletterSubscribe } from "./emails/admin-newsletter-subscribe.tsx";
import { renderEmailNewsletterThanks } from "./emails/newsletter-thanks.tsx";
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

  await kv.set([PREFIX, ulid()], data);

  const newEntriesIterator = kv.list<{
    timestamp: string;
    email: string;
  }>({
    prefix: [PREFIX],
  });
  const newEntries = await Array.fromAsync(newEntriesIterator);
  const newEntry = newEntries.find(
    (e) => e.value.email === normalizedBodyEmail,
  );

  const [emailUser, emailAdmin] = [
    renderEmailNewsletterThanks({
      unsubscribeUrl: `https://nn1.dev/newsletter/unsubscribe/${newEntry?.key[1].toString()}`,
    }),
    renderEmailAdminNewsletterSubscribe({
      email: normalizedBodyEmail,
    }),
  ];

  const [emailUserResponse, emailAdminResponse] = await Promise.all([
    resend.emails.send({
      from: "NN1 Dev Club <club@nn1.dev>",
      to: normalizedBodyEmail,
      subject: "✨ Newsletter",
      html: emailUser.html,
      text: emailUser.text,
    }),
    resend.emails.send({
      from: "NN1 Dev Club <club@nn1.dev>",
      to: Deno.env.get("ADMIN_RECIPIENTS")?.split(",")!,
      subject: "✨ Newsletter - user subscribed",
      html: emailAdmin.html,
      text: emailAdmin.text,
    }),
  ]);

  if (emailUserResponse.error || emailAdminResponse.error) {
    return Response.json(
      {
        status: "error",
        statusCode: 400,
        data: null,
        error: emailUserResponse.error || emailAdminResponse.error,
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
