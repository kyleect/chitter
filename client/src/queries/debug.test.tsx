import { describe, test, expect, beforeAll, afterAll, vi } from "vitest";
import { DEBUG_KEYS, useGetDebugInfoQuery } from "@/queries/debug";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode } from "react";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { beforeEach } from "node:test";
import { DebugInfo } from "server-types";

describe("DEBUG_KEYS", () => {
  describe("all", () => {
    test("equals", () => {
      expect(DEBUG_KEYS.all).toStrictEqual(["debug"]);
    });
  });
});

describe("useGetDebugInfoQuery", () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  const renderHookOptions = { wrapper };

  const handler = vi.fn();
  const server = setupServer(http.get("/api/debug", handler));

  beforeAll(() => server.listen());

  beforeEach(() => {
    server.resetHandlers();
    handler.mockReset();
  });

  afterAll(() => server.close());

  describe("when fails", () => {
    test("returns error", async () => {
      const expectedError = "expectedError";

      handler.mockReturnValue(new HttpResponse(expectedError, { status: 500 }));

      const { result } = renderHook(
        () => useGetDebugInfoQuery(),
        renderHookOptions,
      );

      expect(queryClient.getQueryData(DEBUG_KEYS.all)).toBeUndefined();

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toStrictEqual(
        new Error(`Failed to get debug information: ${expectedError}`),
      );
    });
  });

  describe("when succeeds", () => {
    test("returns debug info", async () => {
      handler.mockReturnValue(
        HttpResponse.json({
          db: "expectedDb",
          db_is_encrypted: true,
          cwd: "expectedCwd",
          commit: "expectedCommit",
        } as DebugInfo),
      );

      const { result } = renderHook(
        () => useGetDebugInfoQuery(),
        renderHookOptions,
      );

      expect(queryClient.getQueryData(DEBUG_KEYS.all)).toBeUndefined();

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toStrictEqual({
        db: "expectedDb",
        db_is_encrypted: true,
        cwd: "expectedCwd",
        commit: "expectedCommit",
      });

      expect(queryClient.getQueryData(DEBUG_KEYS.all)).toStrictEqual({
        db: "expectedDb",
        db_is_encrypted: true,
        cwd: "expectedCwd",
        commit: "expectedCommit",
      });
    });
  });
});
