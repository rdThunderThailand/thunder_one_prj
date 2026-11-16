import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve } from "node:path";

const require = createRequire(import.meta.url);
const ts: typeof import("typescript") = require("typescript");
const root = process.env.ONE_CHECK_ROOT ?? process.cwd();
function load(path: string, dependencies: Record<string, unknown>) {
  const source = readFileSync(resolve(root, path), "utf8");
  const js = ts.transpileModule(source, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX,
  } }).outputText;
  const loaded = { exports: {} as Record<string, unknown> };
  new Function("require", "module", "exports", js)((name: string) => {
    assert.ok(name in dependencies, `Unexpected runtime dependency: ${name}`);
    return dependencies[name];
  }, loaded, loaded.exports);
  return loaded.exports;
}
const errors = load("src/features/auth/login-error.ts", {});
const LoginError = errors.LoginError as new (code: string) => Error;
const failures = errors.LOGIN_FAILURES as Record<string, { status: number; message: string }>;
const credentials = { email: "login359@example.invalid", password: "fixture-password-sensitive" };
const token = "fixture-access-token-sensitive";
const rawFailure = "fixture-raw-upstream-failure-sensitive";
let upstream: () => Promise<Response> = async () => Response.json({});
let localResponse: (() => Promise<Response>) | null = null;
let cookiesWritten: unknown[][] = [];
let cookiesDeleted: string[] = [];
let requests: { url: string; init?: RequestInit }[] = [];
const logs: unknown[][] = [];
const route = load("src/app/api/auth/login/route.ts", {
  "next/server": { NextResponse: { json: (body: unknown, options?: ResponseInit) => Response.json(body, options) } },
  "next/headers": { cookies: async () => ({
    set: (...args: unknown[]) => { cookiesWritten.push(args); },
    delete: (name: string) => { cookiesDeleted.push(name); },
  }) },
  "@/config/env": { env: { coreApiUrl: "https://core.fixture.invalid", coreApiKey: "fixture-app-key-sensitive" } },
  "@/lib/core/tenant-selection": { TENANT_COOKIE: "fixture-tenant" },
  "@/lib/core/core-get": { coreGet: async () => ({ preferred_language: "th" }) },
  "@/lib/app-locale": {
    LOCALE_COOKIE: "fixture-locale", LOCALE_COOKIE_MAX_AGE: 100,
    languageFromTag: (value: unknown) => value === "th" ? "th" : null,
  },
  "@/features/auth/login-error": errors,
}).POST as (request: Request) => Promise<Response>;
const service = load("src/features/auth/services/auth.service.ts", {
  "@/lib/api/client": { apiClient: {} }, "../login-error": errors,
});
const login = service.login as (value: typeof credentials) => Promise<{ userId: string }>;
function request() {
  return new Request("https://one.fixture.invalid/api/auth/login", {
    method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(credentials),
  });
}
function reset(response: () => Promise<Response>) {
  upstream = response; localResponse = null; cookiesWritten = []; cookiesDeleted = []; requests = [];
}
const originalFetch = globalThis.fetch;
const originalError = console.error;
const originalWarn = console.warn;
globalThis.fetch = async (input, init) => {
  const url = String(input);
  requests.push({ url, init });
  if (url === "/api/auth/login") return localResponse ? localResponse() : route(request());
  assert.equal(url, "https://core.fixture.invalid/api/core/v1/auth/login");
  assert.equal(new Headers(init?.headers).get("x-api-key"), "fixture-app-key-sensitive");
  assert.deepEqual(JSON.parse(String(init?.body)), credentials);
  return upstream();
};
console.error = (...args: unknown[]) => { logs.push(args); };
console.warn = (...args: unknown[]) => { logs.push(args); };
async function expectRouteFailure(status: number, code: string) {
  const response = await route(request());
  assert.equal(response.status, status);
  assert.deepEqual(await response.json(), { error: failures[code].message, code });
  assert.deepEqual(cookiesWritten, [], "failed login must not set a session cookie");
  assert.deepEqual(cookiesDeleted, [], "failed login must not change tenant selection");
}
async function expectServiceFailure(code: string) {
  await assert.rejects(login(credentials), (error: unknown) => {
    assert.ok(error instanceof LoginError);
    assert.equal(error.message, failures[code].message);
    return true;
  });
}
type Element = { type: unknown; props: Record<string, unknown> };
let state: unknown[] = [];
let stateIndex = 0;
let pushed: string[] = [];
let nextPath: string | null = null;
let formFailure: Error | null = null;
const jsx = (type: unknown, props: Record<string, unknown>): Element => ({ type, props });
const Form = load("src/features/auth/components/LoginForm.tsx", {
  "next/link": { default: "link", __esModule: true },
  "next/navigation": { useRouter: () => ({ push: (path: string) => { pushed.push(path); } }),
    useSearchParams: () => ({ get: () => nextPath }) },
  react: { useState: (initial: unknown) => {
    const index = stateIndex++;
    state[index] = index === 0 ? credentials.email : index === 1 ? credentials.password : initial;
    return [state[index], (value: unknown) => { state[index] = value; }];
  } },
  "react/jsx-runtime": { jsx, jsxs: jsx },
  "@/components/ui/Button": { Button: "button" },
  "@/components/ui/Input": { Input: "input" },
  "../services/auth.service": { ...service, login: async (value: typeof credentials) => {
    if (formFailure) throw formFailure;
    return login(value);
  } },
  "../login-error": errors,
}).LoginForm as () => Element;
async function submitForm() {
  state = []; stateIndex = 0; pushed = [];
  const form = Form();
  const submit = form.props.onSubmit as (event: { preventDefault(): void }) => Promise<void>;
  await submit({ preventDefault() {} });
  assert.equal(state[3], false, "submission must always clear pending state");
}
try {
  for (const [status, upstreamCode, expectedStatus, expectedCode] of [
    [401, "INVALID_CREDENTIALS", 401, "INVALID_CREDENTIALS"],
    [403, "EMAIL_NOT_CONFIRMED", 403, "EMAIL_NOT_CONFIRMED"],
    [429, "RATE_LIMITED", 429, "RATE_LIMITED"],
    [429, undefined, 429, "RATE_LIMITED"],
    [401, "AUTH_SERVICE_UNAVAILABLE", 502, "AUTH_SERVICE_UNAVAILABLE"],
    [401, undefined, 502, "AUTH_SERVICE_UNAVAILABLE"],
    [401, "EMAIL_NOT_CONFIRMED", 502, "AUTH_SERVICE_UNAVAILABLE"],
    [403, "INVALID_CREDENTIALS", 502, "AUTH_SERVICE_UNAVAILABLE"],
    [400, "INVALID_INPUT", 502, "AUTH_SERVICE_UNAVAILABLE"],
    [500, "INVALID_CREDENTIALS", 502, "AUTH_SERVICE_UNAVAILABLE"],
    [503, "AUTH_SERVICE_UNAVAILABLE", 502, "AUTH_SERVICE_UNAVAILABLE"],
  ] as const) {
    reset(async () => Response.json({ code: upstreamCode, error: rawFailure }, { status }));
    await expectRouteFailure(expectedStatus, expectedCode);
    await expectServiceFailure(expectedCode);
    await submitForm();
    assert.equal(state[2], failures[expectedCode].message);
    assert.deepEqual(pushed, [], "failed login must not navigate");
  }
  for (const status of [401, 403, 429, 502]) {
    reset(async () => new Response(`<html>${rawFailure}</html>`, { status, headers: { "content-type": "text/html" } }));
    await expectRouteFailure(status === 429 ? 429 : 502, status === 429 ? "RATE_LIMITED" : "AUTH_SERVICE_UNAVAILABLE");
  }
  for (const data of [null, {}, { data: null }, { data: {} },
    { data: { access_token: 123, user_id: "fixture-user" } },
    { data: { access_token: "   ", user_id: "fixture-user" } },
    { data: { access_token: token } }, { data: { access_token: token, user_id: 123 } },
    { data: { access_token: token, user_id: "   " } }]) {
    reset(async () => Response.json(data));
    await expectRouteFailure(502, "AUTH_SERVICE_UNAVAILABLE");
  }
  reset(async () => new Response("{", { status: 200 }));
  await expectRouteFailure(502, "AUTH_SERVICE_UNAVAILABLE");
  reset(async () => { throw new Error(rawFailure); });
  await expectRouteFailure(502, "AUTH_SERVICE_UNAVAILABLE");
  await expectServiceFailure("AUTH_SERVICE_UNAVAILABLE");
  for (const response of [
    async () => Response.json({ error: rawFailure }, { status: 401 }),
    async () => new Response(rawFailure, { status: 503 }),
    async () => new Response("{", { status: 200 }),
    async () => { throw new Error(rawFailure); },
  ]) {
    localResponse = response;
    await expectServiceFailure("AUTH_SERVICE_UNAVAILABLE");
    await submitForm();
    assert.equal(state[2], failures.AUTH_SERVICE_UNAVAILABLE.message);
  }
  for (const body of [{}, null, { userId: 123 }, { userId: " " }]) {
    localResponse = async () => Response.json(body);
    await expectServiceFailure("AUTH_SERVICE_UNAVAILABLE");
  }
  reset(async () => Response.json({ data: { access_token: token, user_id: "fixture-user", expires_at: 1800000000 } }));
  const success = await route(request());
  assert.equal(success.status, 200);
  assert.deepEqual(await success.json(), { userId: "fixture-user" });
  assert.equal(cookiesWritten[0][0], "to_at");
  assert.equal(cookiesWritten[0][1], token);
  const sessionOptions = cookiesWritten[0][2] as Record<string, unknown>;
  assert.equal(sessionOptions.httpOnly, true);
  assert.equal(sessionOptions.sameSite, "lax");
  assert.equal(sessionOptions.path, "/");
  assert.deepEqual(sessionOptions.expires, new Date(1800000000 * 1000));
  assert.deepEqual(cookiesDeleted, ["fixture-tenant"]);
  assert.equal(cookiesWritten[1][0], "fixture-locale");
  assert.equal(cookiesWritten[1][1], "th");
  assert.deepEqual(await login(credentials), { userId: "fixture-user" });
  for (const [next, destination] of [["/media", "/media"], ["//evil.invalid", "/"], ["https://evil.invalid", "/"], [null, "/"]]) {
    nextPath = next;
    await submitForm();
    assert.deepEqual(pushed, [destination]);
    assert.equal(state[2], null);
  }
  formFailure = new Error(rawFailure);
  await submitForm();
  assert.equal(state[2], failures.AUTH_SERVICE_UNAVAILABLE.message);
  assert.deepEqual(pushed, []);
  formFailure = null;
  const serializedLogs = JSON.stringify(logs);
  for (const secret of [credentials.email, credentials.password, token, "fixture-app-key-sensitive", rawFailure]) {
    assert.ok(!serializedLogs.includes(secret), "logs must omit credentials, tokens, app keys and raw upstream bodies");
  }
  assert.ok(logs.length > 0, "upstream failures must leave a server-side diagnostic");
  assert.ok(serializedLogs.includes("401"), "upstream HTTP status must be logged server-side");
} finally {
  globalThis.fetch = originalFetch; console.error = originalError; console.warn = originalWarn;
}
console.log("One login checks passed (actual route, service and form submission; fixture Core/cookies/hooks)");
