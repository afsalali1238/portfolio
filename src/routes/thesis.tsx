import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/thesis")({
  beforeLoad: () => {
    throw redirect({
      to: "/notes/the-energy-ledger",
      statusCode: 308,
    });
  },
  component: () => null,
});
