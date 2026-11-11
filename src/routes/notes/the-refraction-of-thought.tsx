import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/notes/the-refraction-of-thought")({
  beforeLoad: () => {
    throw redirect({
      to: "/thesis",
      statusCode: 308,
    });
  },
  component: () => null,
});
