import { createRootRoute, Link, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import {
  AppShell,
  Burger,
  Group,
  NavLink,
  ThemeIcon,
  Title,
} from "@mantine/core";

import "@mantine/core/styles.css";
import "@mantine/dates/styles.css";
import "@mantine/spotlight/styles.css";
import { useDisclosure } from "@mantine/hooks";
import { useState } from "react";
import { useServerWebSocket } from "@/hooks/useServerWebSocket";
import { notifications } from "@mantine/notifications";
import { useReward } from "react-rewards";
import { ServerMessage } from "server-types";
import { IconMessageFilled } from "@tabler/icons-react";

export const Route = createRootRoute({
  component: () => {
    const [opened, { toggle }] = useDisclosure();
    const [achievementId, setAchievementId] = useState<string>("");

    const { reward } = useReward(`achievement_${achievementId}`, "confetti", {
      startVelocity: 15,
      elementCount: 75,
      spread: 90,
      lifetime: 200,
    });

    useServerWebSocket(undefined, {
      onMessage(event: MessageEvent<string>) {
        const message = JSON.parse(event.data) as ServerMessage;

        if (message.type === "Achievement") {
          const achievement = message.data;

          notifications.show({
            message: achievement.description,
            color: "violet",
            id: `achievement_${achievementId}`,
            title: `🏆 ${achievement.title}`,
            position: "bottom-center",
            autoClose: 5000,
            onOpen: () => {
              reward();
            },
          });

          // This is required by the useReward hook to be able to show multiple
          // achievement notifications at the same time.
          setAchievementId(achievement.id.toString());
        }
      },
    });

    return (
      <AppShell
        header={{ height: 70 }}
        navbar={{
          width: 175,
          breakpoint: "sm",
          collapsed: { mobile: !opened },
        }}
        data-testid="root"
      >
        <AppShell.Header>
          <Group align="center">
            <Burger
              opened={opened}
              onClick={toggle}
              size="sm"
              hiddenFrom="sm"
              p="xs"
            />
            <Title m="xs">
              <ThemeIcon variant="gradient" size="xl" mr="sm" radius="sm">
                <IconMessageFilled />
              </ThemeIcon>{" "}
              chitter
            </Title>
          </Group>
        </AppShell.Header>

        <AppShell.Navbar>
          <NavLink
            label="Home"
            component={Link}
            to="/"
            activeProps={{
              style: { fontWeight: "bold" },
            }}
            aria-label="Home"
          />

          <NavLink
            label="Personas"
            component={Link}
            to="/personas"
            activeProps={{
              style: { fontWeight: "bold" },
            }}
            aria-label="Personas"
          />

          <NavLink
            label="Insertables"
            component={Link}
            to="/insertables"
            activeProps={{
              style: { fontWeight: "bold" },
            }}
            aria-label="Insertables"
          />

          <NavLink
            label="Templates"
            component={Link}
            to="/templates"
            activeProps={{
              style: { fontWeight: "bold" },
            }}
            aria-label="Templates"
          />

          <NavLink
            label="Conversations"
            component={Link}
            to="/conversations"
            activeProps={{
              style: { fontWeight: "bold" },
            }}
            aria-label="Conversations"
          />

          <NavLink
            label="Settings"
            component={Link}
            to="/settings"
            activeProps={{
              style: { fontWeight: "bold" },
            }}
            aria-label="Settings"
          />

          <NavLink
            label="Debug"
            component={Link}
            to="/debug"
            activeProps={{
              style: { fontWeight: "bold" },
            }}
          />
        </AppShell.Navbar>

        <AppShell.Main>
          <Outlet />
        </AppShell.Main>
        <TanStackRouterDevtools />
      </AppShell>
    );
  },
});
