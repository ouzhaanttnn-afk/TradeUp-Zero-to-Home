/// <reference types="node" />
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { describe, expect, it, vi } from "vitest";

const source = readFileSync(
  new URL("../../public/sw.js", import.meta.url),
  "utf8",
);
function worker() {
  const handlers: Record<string, (event: unknown) => void> = {};
  const values = new Map<string, Response>();
  const cache = {
    addAll: vi.fn(async () => {}),
    put: vi.fn(async () => {}),
    match: vi.fn(async (request: { url: string } | string) =>
      values.get(typeof request === "string" ? request : request.url),
    ),
  };
  const caches = {
    open: vi.fn(async () => cache),
    keys: vi.fn(async () => ["tradeup-v2", "tradeup-v3", "other-app-v1"]),
    delete: vi.fn(async () => true),
  };
  const fetch = vi.fn(async () => new Response("online"));
  runInNewContext(source, {
    self: {
      location: { origin: "https://tradeup.test" },
      addEventListener: (type: string, handler: (event: unknown) => void) => {
        handlers[type] = handler;
      },
    },
    caches,
    fetch,
    URL,
    Response,
  });
  async function request(
    path: string,
    options: { method?: string; mode?: string } = {},
  ) {
    const waits: Promise<unknown>[] = [];
    let response: Promise<Response> | undefined;
    handlers.fetch({
      request: {
        url: new URL(path, "https://tradeup.test").href,
        method: "GET",
        mode: "cors",
        ...options,
      },
      waitUntil: (promise: Promise<unknown>) => waits.push(promise),
      respondWith: (promise: Promise<Response>) => {
        response = promise;
      },
    });
    const result = await response;
    await Promise.all(waits);
    return result;
  }
  return { handlers, values, cache, caches, fetch, request };
}
describe("offline worker", () => {
  it("deletes only older TradeUp caches", async () => {
    const app = worker();
    let completion: Promise<unknown> | undefined;
    app.handlers.activate({
      waitUntil: (promise: Promise<unknown>) => {
        completion = promise;
      },
    });
    await completion;
    expect(app.caches.delete.mock.calls).toEqual([["tradeup-v2"]]);
  });
  it("does not intercept external or non-GET requests", async () => {
    const app = worker();
    expect(
      await app.request("https://external.test/image.png"),
    ).toBeUndefined();
    expect(await app.request("/save", { method: "POST" })).toBeUndefined();
    expect(app.fetch).not.toHaveBeenCalled();
  });
  it("serves a cached asset offline", async () => {
    const app = worker();
    app.values.set(
      "https://tradeup.test/assets/app.js",
      new Response("cached"),
    );
    app.fetch.mockRejectedValue(new Error("offline"));
    expect(await (await app.request("/assets/app.js"))?.text()).toBe("cached");
  });
  it("uses the shell only for navigation and returns an error for missing assets", async () => {
    const app = worker();
    app.values.set("/", new Response("shell"));
    app.fetch.mockRejectedValue(new Error("offline"));
    expect(
      await (await app.request("/journey", { mode: "navigate" }))?.text(),
    ).toBe("shell");
    expect((await app.request("/missing.png"))?.type).toBe("error");
  });
  it("does not cache unsuccessful responses", async () => {
    const app = worker();
    app.fetch.mockResolvedValue(new Response("unavailable", { status: 503 }));
    expect((await app.request("/asset.png"))?.status).toBe(503);
    expect(app.cache.put).not.toHaveBeenCalled();
  });
  it("handles storage failure online and offline", async () => {
    const app = worker();
    app.cache.put.mockRejectedValue(new Error("quota"));
    expect(await (await app.request("/assets/app.js"))?.text()).toBe("online");
    app.fetch.mockRejectedValue(new Error("offline"));
    app.caches.open.mockRejectedValue(new Error("storage blocked"));
    expect((await app.request("/assets/app.js"))?.type).toBe("error");
  });
});
