import { useGetTemplateByIdQuery } from "@/queries/templates";
import { Alert, Loader } from "@mantine/core";
import { Link } from "@tanstack/react-router";
import { FC } from "react";
import { ConversationTemplate } from "server-types";

type Props = {
  templateId: ConversationTemplate["id"];
};

export const LinkToTemplate: FC<Props> = ({ templateId }) => {
  const getTemplateByIdQuery = useGetTemplateByIdQuery(templateId);

  if (getTemplateByIdQuery.isPending) {
    return <Loader />;
  }

  if (getTemplateByIdQuery.isError) {
    return <Alert color="red">Error fetching template ({templateId})</Alert>;
  }

  return (
    <Link
      to="/templates/$templateId"
      params={{
        templateId,
      }}
    >
      {getTemplateByIdQuery.data?.title}
    </Link>
  );
};
