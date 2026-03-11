import { ActionIcon, Divider } from "@mantine/core";
import { IconCodeDots, IconPlus } from "@tabler/icons-react";
import { useContext } from "react";
import { TemplateContext } from "./TemplateContext";
import { DividerBarMenu } from "./DividerBarMenu";

type Props = {
  index: number;

  onClickAdd?: () => void;
};

export const DividerBar: React.FC<Props> = ({ index, onClickAdd }) => {
  const context = useContext(TemplateContext)!;

  const { previewConversationAtIndexState, isEditingState } = context;
  const [isEditing] = isEditingState;

  const [_, setAt] = previewConversationAtIndexState;

  return (
    <Divider
      mt={0}
      variant="dashed"
      // size="sm"
      label={
        <ActionIcon.Group>
          {isEditing && (
            <DividerBarMenu index={index}>
              <ActionIcon
                variant="subtle"
                color="gray"
                onClick={() => {
                  onClickAdd?.();
                }}
              >
                <IconPlus />
              </ActionIcon>
            </DividerBarMenu>
          )}

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
