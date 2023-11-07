import Fastify from "fastify";
import { request as httpRequest } from "node:https";

const destination = {
  "/foo/something": "http://example.com?foo=something",
};

const options = ({ ip, headers: { "user-agent": userAgent } }) => ({
  method: "POST",
  hostname: "plausible.io",
  path: "/api/event",
  headers: {
    "Content-Type": "application/json",
    "X-Forwarded-For": ip,
    "User-Agent": userAgent,
  },
});

// @TODO cleanup once https://github.com/fastify/fastify/pull/4766 is integrated
const payload = ({ hostname, url }) => ({
  name: "pageview",
  url: "http://localhost" + (process.env.PLAUSIBLE_PATH_PREFIX || "") + url,
  domain: process.env.PLAUSIBLE_DOMAIN || hostname.split(":")[0],
});

const handler = async (request, reply) => {
  httpRequest(options(request)).end(JSON.stringify(payload(request)));

  reply.header("debug-options", JSON.stringify(options(request)));
  reply.header("debug-payload", JSON.stringify(payload(request)));

  const location = destination[request.url];
  return location
    ? reply.code(302).header("location", location).send()
    : reply.send("default");
};

Fastify({ trustProxy: true })
  .get("/~health", async (request, reply) => {
    reply.code(204).send();
  })
  .get("*", handler)
  .listen({ port: 3000, host: "0.0.0.0" })
  .then((address) => console.log({ address }))
  .catch((error) => {
    console.error("Error starting server", { error });
    process.exit(1);
  });
