import { StrictMode, useEffect } from "react";
import "@/index.css";
import customParseFormat from "dayjs/plugin/customParseFormat";
import relativeTime from "dayjs/plugin/relativeTime";
import dayjs from "dayjs";
dayjs.extend(customParseFormat);
dayjs.extend(relativeTime);

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ModalsProvider } from "@mantine/modals";

import { routeTree } from "@/routeTree.gen";
import {
  createHashHistory,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import {
  createTheme,
  MantineProvider,
  TypographyStylesProvider,
} from "@mantine/core";

import "@mantine/notifications/styles.css";
import { Notifications } from "@mantine/notifications";

import "@mantine/code-highlight/styles.css";
import { useLogger } from "@/hooks/useLogger";
import { useSendNavigationToServer } from "./hooks/useSendNavigationToServer";

export const router = createRouter({
  routeTree,
  history: createHashHistory(),
});

export const theme = createTheme({
  primaryColor: "blue",
});

const queryClient = new QueryClient();

export const App = () => {
  const sendNavigation = useSendNavigationToServer();

  const logger = useLogger();

  useEffect(
    () =>
      router.subscribe("onLoad", ({ toLocation, fromLocation }) => {
        sendNavigation(toLocation.href, fromLocation?.href);
      }),
    [router, logger]
  );

  return (
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <MantineProvider defaultColorScheme="auto" theme={theme}>
          <Notifications />
          <TypographyStylesProvider>
            <ModalsProvider>
              <RouterProvider router={router} />
            </ModalsProvider>
          </TypographyStylesProvider>
        </MantineProvider>
      </QueryClientProvider>
    </StrictMode>
  );
};

// Register the router instance for type safety
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
