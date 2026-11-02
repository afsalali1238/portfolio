import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/contact")({
  beforeLoad: () => {
    throw redirect({
      to: "/the-man-behind",
      statusCode: 301,
    });
  },
  component: () => null,
});
