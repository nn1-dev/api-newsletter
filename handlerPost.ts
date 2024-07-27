import { Resend } from "npm:resend";
import { PREFIX } from "./constants.ts";
import { renderEmailAdminNewsletterSubscribe } from "https://raw.githubusercontent.com/nn1-dev/emails/main/emails/admin-newsletter-subscribe.tsx";
import { renderEmail_2024_07_24 } from "https://raw.githubusercontent.com/nn1-dev/emails/main/emails/newsletter-2024-07-24.tsx";
import { ulid } from "https://deno.land/x/ulid@v0.3.0/mod.ts";
import { normalizeEmail } from "./utils.ts";

const resend = new Resend(Deno.env.get("API_KEY_RESEND"));

const TEMPLATE_MAPPER = {
  "2024-07-24": renderEmail_2024_07_24,
};

const handlerPost = async (request: Request, kv: Deno.Kv) => {
  const patternBroadcast = new URLPattern({ pathname: "/broadcast" });
  const patternBroadcastMatch = patternBroadcast.test(request.url);

  return patternBroadcastMatch
    ? await handlerPostBroadcast(request, kv)
    : await handlerPostNewEntry(request, kv);
};

const handlerPostBroadcast = async (request: Request, kv: Deno.Kv) => {
  const body: {
    template: string;
    subject: string;
  } = await request.json();

  if (!Object.keys(TEMPLATE_MAPPER).includes(body.template)) {
    return Response.json(
      {
        status: "error",
        statusCode: 400,
        data: null,
        error: "Template is not configured",
      },
      { status: 400 },
    );
  }
  const template =
    TEMPLATE_MAPPER[body.template as keyof typeof TEMPLATE_MAPPER];

  const entriesIterator = kv.list<{
    timestamp: string;
    email: string;
  }>({
    prefix: [PREFIX],
  });
  const entries = await Array.fromAsync(entriesIterator);

  for (const entry of entries) {
    const email = template({
      unsubscribeUrl: `https://nn1.dev/newsletter/unsubscribe/${entry?.key[1].toString()}`,
    });
    const { error } = await resend.emails.send({
      from: "NN1 Dev Club <club@nn1.dev>",
      to: entry.value.email,
      subject: body.subject,
      html: email.html,
      text: email.text,
    });

    error
      ? console.error(error)
      : console.log(`Email successfully sent to ${entry.value.email}`);
  }

  return Response.json(
    {
      status: "success",
      statusCode: 200,
      data: "Broadcast successful",
      error: null,
    },
    { status: 200 },
  );
};

const handlerPostNewEntry = async (request: Request, kv: Deno.Kv) => {
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

  const memberId = ulid();
  await kv.set([PREFIX, memberId], data);

  const emailAdmin = renderEmailAdminNewsletterSubscribe({
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
