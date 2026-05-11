import { components } from "./components";
import { paths } from "./paths";

export const openApiDocument = {
  openapi: "3.0.3",
  info: {
    title: "BOOKORA API",
    version: "1.0.0",
    description:
      "REST API documentation for BOOKORA. The spec is maintained in dedicated docs modules so route behavior and documentation can evolve cleanly without mixing concerns into controllers."
  },
  servers: [
    {
      url: "/api",
      description: "Current API base path"
    }
  ],
  tags: [
    { name: "System", description: "Top-level utility endpoints." },
    { name: "Auth", description: "Authentication and account entry points." },
    { name: "Users", description: "Authenticated user profile endpoints." },
    { name: "Readers", description: "Public reader profile and relationship views." },
    { name: "Follows", description: "Authenticated follow and unfollow actions." },
    { name: "Feed", description: "Authenticated social feed endpoints." },
    { name: "Library", description: "Personal library CRUD operations." },
    { name: "Books", description: "Book search and detail endpoints." },
    { name: "Authors", description: "Author metadata endpoints backed by Open Library." },
    { name: "Series", description: "Series metadata endpoints backed by Open Library." }
  ],
  components,
  paths
} as const;
