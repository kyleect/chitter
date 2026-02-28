import { useGetConservationByIdQuery } from "@/queries/conversations";
import { Alert, Loader } from "@mantine/core";
import { Link } from "@tanstack/react-router";
import { FC } from "react";
import { Conversation } from "server-types";

type Props = {
  conversationId: Conversation["id"];
};

export const LinkToConversation: FC<Props> = ({ conversationId }) => {
  const getConservationByIdQuery = useGetConservationByIdQuery(conversationId);

  if (getConservationByIdQuery.isPending) {
    return <Loader />;
  }

  if (getConservationByIdQuery.isError) {
    return (
      <Alert color="red">Error fetching conversation ({conversationId})</Alert>
    );
  }

  return (
    <Link
      to="/conversations/$conversationId"
      params={{
        conversationId,
      }}
    >
      {getConservationByIdQuery.data?.title}
    </Link>
  );
};
