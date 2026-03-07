import { Affix, Card, Transition } from "@mantine/core";
import { TemplateActionButtons } from "./TemplateActionButtons";
import { useWindowScroll } from "@mantine/hooks";

export const TemplateFormAffix = () => {
  const [scroll] = useWindowScroll();

  return (
    <Affix position={{ bottom: 20, right: 20 }}>
      <Transition transition="slide-up" mounted={scroll.y > 100}>
        {(transitionStyles) => (
          <Card p="xs" style={transitionStyles}>
            <TemplateActionButtons />
          </Card>
        )}
      </Transition>
    </Affix>
  );
};
