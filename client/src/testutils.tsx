import { render } from "@testing-library/react";
import { MantineProvider } from "@mantine/core";

export function renderComponentForTest(children: React.ReactNode) {
  const component = <MantineProvider>{children}</MantineProvider>;
  render(component);
}
