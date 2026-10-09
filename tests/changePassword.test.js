import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * `POST /api/auth/change-password` (ECCdigital/tickets#264): the backend
 * 4.3.1 changes a password only for the signed-in account and only with the
 * current password. The route hands both passwords and the session on, and
 * passes a refusal on with the backend's status.
 *
 * The Nitro auto-imports the route relies on are stubbed on `globalThis`;
 * `$fetch` is the backend.
 */

let cookies;
let body;
let backend;

globalThis.defineEventHandler = (handler) => handler;
globalThis.readBody = async () => body;
globalThis.getCookie = (_event, name) => cookies[name];
globalThis.useRuntimeConfig = () => ({ apiBaseUrl: "https://api.example.test" });
globalThis.createError = (input) => Object.assign(new Error("createError"), input);
globalThis.$fetch = vi.fn((url, options) => backend(url, options));

const { default: changePassword } = await import(
  "~~/server/api/auth/change-password.post.js"
);

function refusal(statusCode, data) {
  return Object.assign(new Error("refused"), { statusCode, data });
}

beforeEach(() => {
  cookies = { "access-token": "token-erika" };
  body = { currentPassword: "bisher-1", password: "neu-2" };
  backend = vi.fn(async () => "OK");
  globalThis.$fetch.mockClear();
});

describe("POST /api/auth/change-password", () => {
  it("sends the current and the new password with the session", async () => {
    await changePassword({});

    expect(globalThis.$fetch).toHaveBeenCalledWith(
      "https://api.example.test/auth/resetpassword",
      expect.objectContaining({
        method: "POST",
        body: { currentPassword: "bisher-1", password: "neu-2" },
        headers: expect.objectContaining({
          Authorization: "Bearer token-erika",
        }),
      }),
    );
  });

  it("names no account: the backend changes the signed-in one", async () => {
    body = { id: "owner@example.test", currentPassword: "bisher-1", password: "neu-2" };

    await changePassword({});

    const [, options] = globalThis.$fetch.mock.calls[0];
    expect(options.body).not.toHaveProperty("id");
  });

  it("passes a wrong current password on as 403", async () => {
    backend = async () => {
      throw refusal(403, "Current password is wrong");
    };

    await expect(changePassword({})).rejects.toMatchObject({ statusCode: 403 });
  });

  it("refuses without both passwords and asks the backend nothing", async () => {
    body = { password: "neu-2" };

    await expect(changePassword({})).rejects.toMatchObject({ statusCode: 400 });
    expect(globalThis.$fetch).not.toHaveBeenCalled();
  });
});
