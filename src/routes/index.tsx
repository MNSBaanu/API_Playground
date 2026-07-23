import { createFileRoute } from "@tanstack/react-router";
import { Playground } from "@/components/api-playground/Playground";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "API Playground — Internal HTTP Testing Tool" },
      {
        name: "description",
        content:
          "Compose HTTP requests, inspect responses, and save reusable requests to a collection.",
      },
      { property: "og:title", content: "API Playground — Internal HTTP Testing Tool" },
      {
        property: "og:description",
        content:
          "Compose HTTP requests, inspect responses, and save reusable requests to a collection.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return <Playground />;
}
