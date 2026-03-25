import { ActionIcon, Divider } from "@mantine/core";
import { IconCodeDots } from "@tabler/icons-react";
import { useContext } from "react";
import { TemplateContext } from "./TemplateContext";

type Props = {
  index: number;
};

export const VariantDividerBar: React.FC<Props> = ({ index }) => {
  const context = useContext(TemplateContext)!;

  const { previewConversationAtIndexState } = context;

  const [_, setAt] = previewConversationAtIndexState;

  return (
    <Divider
      mt={0}
      variant="dashed"
      // size="sm"
      label={
        <ActionIcon.Group>
          <ActionIcon
            variant="subtle"
            color="gray"
            onClick={() => {
              context.previewConversationModal.open();
              setAt(index + 1);
            }}
          >
            <IconCodeDots stroke={1.5} />
          </ActionIcon>
        </ActionIcon.Group>
      }
    />
  );
};
