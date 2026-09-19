import type { Handle } from "@sveltejs/kit";
import { building } from "$app/environment";
import { svelteKitHandler } from "better-auth/svelte-kit";

import { createAuth } from "$lib/auth";

export const handle: Handle = async ({ event, resolve }) => {
  event.locals.userId = null;
  event.locals.session = null;

  const env = event.platform?.env;
  if (!env) return resolve(event);

  const authInstance = createAuth(env.DB);

  const session = await authInstance.api.getSession({
    headers: event.request.headers,
  });

  if (session) {
    event.locals.userId = session.user.id;
    event.locals.session = {
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
      },
      session: {
        id: session.session.id,
        token: session.session.token,
      },
    };
  }

  const response = await svelteKitHandler({
    event,
    resolve,
    auth: authInstance,
    building,
  });

  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=(), usb=",
  );

  if (event.url.protocol === "https:") {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains",
    );
  }

  return response;
};
