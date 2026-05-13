const authSecurity = [{ bearerAuth: [] }, { authTokenHeader: [] }];
const optionalAuthSecurity = [{ bearerAuth: [] }, { authTokenHeader: [] }, {}];

export const paths = {
  "/": {
    get: {
      tags: ["System"],
      summary: "API welcome route",
      description: "Simple health-style welcome endpoint for the API root.",
      responses: {
        "200": {
          description: "Welcome message",
          content: {
            "text/plain": {
              schema: {
                type: "string",
                example: "Welcome to BOOKORA"
              }
            }
          }
        }
      }
    }
  },
  "/auth/register": {
    post: {
      tags: ["Auth"],
      summary: "Register a new user",
      description: "Creates a user account, hashes the password, and generates a handle when one is not provided.",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/RegisterRequest" }
          }
        }
      },
      responses: {
        "201": {
          description: "User created",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/RegisterResponse" }
            }
          }
        },
        "400": {
          description: "Validation error or duplicate email/handle",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" }
            }
          }
        },
        "409": {
          description: "Duplicate email or handle",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" }
            }
          }
        },
        "500": {
          description: "Server error"
        }
      }
    }
  },
  "/auth/login": {
    post: {
      tags: ["Auth"],
      summary: "Log in a user",
      description: "Authenticates the user and returns a JWT. The same token is also sent back in the `auth-token` response header.",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/LoginRequest" }
          }
        }
      },
      responses: {
        "200": {
          description: "Authentication successful",
          headers: {
            "auth-token": {
              description: "JWT token for authenticated requests",
              schema: {
                type: "string"
              }
            }
          },
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/LoginResponse" }
            }
          }
        },
        "400": {
          description: "Invalid request body",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" }
            }
          }
        },
        "401": {
          description: "Invalid credentials",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" }
            }
          }
        },
        "500": {
          description: "Server error"
        }
      }
    }
  },
  "/users/me": {
    get: {
      tags: ["Users"],
      summary: "Get the current authenticated user",
      security: authSecurity,
      responses: {
        "200": {
          description: "Current user profile",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CurrentUserResponse" }
            }
          }
        },
        "401": {
          description: "Missing or invalid token",
          content: {
            "application/json": {
              schema: {
                oneOf: [
                  { $ref: "#/components/schemas/ErrorResponse" },
                  { $ref: "#/components/schemas/MessageResponse" }
                ]
              }
            }
          }
        },
        "404": {
          description: "User not found"
        }
      }
    },
    patch: {
      tags: ["Users"],
      summary: "Update the current user's profile",
      description: "Supports both raw image URLs and direct file uploads. If `avatar` or `cover` files are uploaded, those file paths take precedence over `avatarUrl` and `coverImageUrl` fields.",
      security: authSecurity,
      requestBody: {
        required: false,
        content: {
          "multipart/form-data": {
            schema: { $ref: "#/components/schemas/UpdateProfileRequest" }
          }
        }
      },
      responses: {
        "200": {
          description: "Updated user profile",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CurrentUserResponse" }
            }
          }
        },
        "401": {
          description: "Missing or invalid token"
        },
        "404": {
          description: "User not found"
        },
        "500": {
          description: "Server error"
        }
      }
    }
  },
  "/readers/{handle}": {
    get: {
      tags: ["Readers"],
      summary: "Get a public reader profile by handle",
      description: "Returns the public profile, reading summary, recent activity, and spotlight items for a reader. Authentication is optional and only influences relationship fields such as `isFollowing` and `isOwnProfile`.",
      parameters: [
        {
          name: "handle",
          in: "path",
          required: true,
          schema: { type: "string" },
          description: "Reader handle",
          example: "catalina_reads"
        }
      ],
      security: optionalAuthSecurity,
      responses: {
        "200": {
          description: "Reader profile",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ReaderProfileResponse" }
            }
          }
        },
        "404": {
          description: "Reader not found"
        },
        "500": {
          description: "Server error"
        }
      }
    }
  },
  "/readers/search": {
    get: {
      tags: ["Readers"],
      summary: "Search public readers by handle",
      description: "Searches public reader accounts by handle, with name matches included as a secondary fallback. Exact and prefix handle matches are ranked first.",
      parameters: [
        {
          name: "q",
          in: "query",
          required: true,
          schema: { type: "string" },
          description: "Reader handle or partial handle to search for.",
          example: "catalina"
        },
        {
          name: "limit",
          in: "query",
          required: false,
          schema: { type: "integer", minimum: 1, maximum: 20, default: 10 },
          description: "Maximum number of reader results to return."
        }
      ],
      responses: {
        "200": {
          description: "Reader search results",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ReaderSearchResponse" }
            }
          }
        },
        "400": {
          description: "Missing search query",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" }
            }
          }
        },
        "500": {
          description: "Server error"
        }
      }
    }
  },
  "/readers/{handle}/followers": {
    get: {
      tags: ["Readers"],
      summary: "Get public followers for a reader",
      parameters: [
        {
          name: "handle",
          in: "path",
          required: true,
          schema: { type: "string" },
          example: "catalina_reads"
        }
      ],
      responses: {
        "200": {
          description: "Followers list",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  error: { type: "null" },
                  data: {
                    type: "object",
                    properties: {
                      followers: {
                        type: "array",
                        items: { $ref: "#/components/schemas/PublicReaderCard" }
                      }
                    },
                    required: ["followers"]
                  }
                },
                required: ["error", "data"]
              }
            }
          }
        },
        "404": {
          description: "Reader not found"
        }
      }
    }
  },
  "/readers/{handle}/following": {
    get: {
      tags: ["Readers"],
      summary: "Get public accounts followed by a reader",
      parameters: [
        {
          name: "handle",
          in: "path",
          required: true,
          schema: { type: "string" },
          example: "catalina_reads"
        }
      ],
      responses: {
        "200": {
          description: "Following list",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  error: { type: "null" },
                  data: {
                    type: "object",
                    properties: {
                      following: {
                        type: "array",
                        items: { $ref: "#/components/schemas/PublicReaderCard" }
                      }
                    },
                    required: ["following"]
                  }
                },
                required: ["error", "data"]
              }
            }
          }
        },
        "404": {
          description: "Reader not found"
        }
      }
    }
  },
  "/follows/{targetUserId}": {
    post: {
      tags: ["Follows"],
      summary: "Follow a reader",
      security: authSecurity,
      parameters: [
        {
          name: "targetUserId",
          in: "path",
          required: true,
          schema: { type: "string" },
          example: "6820cc0db9f0cb815d969cb4"
        }
      ],
      responses: {
        "200": {
          description: "Follow state updated",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/FollowMutationResponse" }
            }
          }
        },
        "400": {
          description: "Attempted to follow self"
        },
        "401": {
          description: "Missing or invalid token"
        },
        "404": {
          description: "Reader not found"
        }
      }
    },
    delete: {
      tags: ["Follows"],
      summary: "Unfollow a reader",
      security: authSecurity,
      parameters: [
        {
          name: "targetUserId",
          in: "path",
          required: true,
          schema: { type: "string" },
          example: "6820cc0db9f0cb815d969cb4"
        }
      ],
      responses: {
        "200": {
          description: "Follow state updated",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/FollowMutationResponse" }
            }
          }
        },
        "400": {
          description: "Attempted to unfollow self"
        },
        "401": {
          description: "Missing or invalid token"
        },
        "404": {
          description: "Reader not found"
        }
      }
    }
  },
  "/feed/home": {
    get: {
      tags: ["Feed"],
      summary: "Get the authenticated home feed",
      security: authSecurity,
      parameters: [
        {
          name: "limit",
          in: "query",
          schema: { type: "number", minimum: 1, maximum: 50, default: 20 },
          description: "Maximum number of feed items to return."
        },
        {
          name: "cursor",
          in: "query",
          schema: { type: "string" },
          description: "Opaque pagination cursor returned from the previous response."
        },
        {
          name: "includeSelf",
          in: "query",
          schema: { type: "boolean", default: true },
          description: "Whether the feed should include the authenticated user's own public activity."
        }
      ],
      responses: {
        "200": {
          description: "Feed page",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/FeedResponse" }
            }
          }
        },
        "401": {
          description: "Missing or invalid token"
        },
        "500": {
          description: "Server error"
        }
      }
    }
  },
  "/library": {
    post: {
      tags: ["Library"],
      summary: "Create a library entry",
      description: "Creates a personal library entry for the authenticated user. For `bookSource = open_library`, `externalBookId` is required. For `bookSource = custom`, `customBook.title` is required.",
      security: authSecurity,
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/CreateLibraryEntryRequest" }
          }
        }
      },
      responses: {
        "201": {
          description: "Library entry created",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/LibraryEntry" }
            }
          }
        },
        "400": {
          description: "Validation error"
        },
        "401": {
          description: "Missing or invalid token"
        },
        "500": {
          description: "Server error"
        }
      }
    },
    get: {
      tags: ["Library"],
      summary: "Get the authenticated user's library",
      security: authSecurity,
      responses: {
        "200": {
          description: "Library entries",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/LibraryListResponse" }
            }
          }
        },
        "401": {
          description: "Missing or invalid token"
        },
        "500": {
          description: "Server error"
        }
      }
    }
  },
  "/library/{id}": {
    put: {
      tags: ["Library"],
      summary: "Update a library entry",
      security: authSecurity,
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string" },
          example: "6820d34cb9f0cb815d969ce7"
        }
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/UpdateLibraryEntryRequest" }
          }
        }
      },
      responses: {
        "200": {
          description: "Updated library entry",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/LibraryEntry" }
            }
          }
        },
        "401": {
          description: "Missing or invalid token"
        },
        "404": {
          description: "Library entry not found"
        }
      }
    },
    delete: {
      tags: ["Library"],
      summary: "Delete a library entry",
      security: authSecurity,
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string" },
          example: "6820d34cb9f0cb815d969ce7"
        }
      ],
      responses: {
        "200": {
          description: "Library entry deleted",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/MessageResponse" }
            }
          }
        },
        "401": {
          description: "Missing or invalid token"
        },
        "404": {
          description: "Library entry not found"
        }
      }
    }
  },
  "/books/search": {
    get: {
      tags: ["Books"],
      summary: "Search books",
      description: "Searches Open Library and supplements results with local library matches when the remote result set is too small.",
      parameters: [
        {
          name: "q",
          in: "query",
          schema: { type: "string" },
          description: "Free-text search query."
        },
        {
          name: "author",
          in: "query",
          schema: { type: "string" },
          description: "Author name filter."
        },
        {
          name: "isbn",
          in: "query",
          schema: { type: "string" },
          description: "ISBN filter."
        },
        {
          name: "page",
          in: "query",
          schema: { type: "number", default: 1 },
          description: "Result page."
        },
        {
          name: "limit",
          in: "query",
          schema: { type: "number", default: 6 },
          description: "Maximum number of results."
        }
      ],
      responses: {
        "200": {
          description: "Search results",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/BookSearchResponse" }
            }
          }
        },
        "400": {
          description: "Invalid search query"
        },
        "500": {
          description: "Server error"
        }
      }
    }
  },
  "/books/{id}": {
    get: {
      tags: ["Books"],
      summary: "Get book details",
      description: "Fetches an Open Library work or edition and enriches it with Bookora community reviews and rating aggregates.",
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string" },
          description: "Open Library work key, edition key, or normalized external book id.",
          example: "OL27448W"
        }
      ],
      responses: {
        "200": {
          description: "Book details",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/BookDetailResponse" }
            }
          }
        },
        "400": {
          description: "Missing or invalid book id"
        },
        "500": {
          description: "Server error"
        }
      }
    }
  },
  "/authors/{authorKey}": {
    get: {
      tags: ["Authors"],
      summary: "Get author details",
      parameters: [
        {
          name: "authorKey",
          in: "path",
          required: true,
          schema: { type: "string" },
          example: "OL1394242A"
        }
      ],
      responses: {
        "200": {
          description: "Author details",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/AuthorDetailsResponse" }
            }
          }
        },
        "400": {
          description: "Invalid author key"
        },
        "500": {
          description: "Server error"
        }
      }
    }
  },
  "/series/{seriesKey}": {
    get: {
      tags: ["Series"],
      summary: "Get series details",
      parameters: [
        {
          name: "seriesKey",
          in: "path",
          required: true,
          schema: { type: "string" },
          example: "OL23323W"
        }
      ],
      responses: {
        "200": {
          description: "Series details",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/SeriesDetailsResponse" }
            }
          }
        },
        "400": {
          description: "Invalid series key"
        },
        "404": {
          description: "Series not found"
        },
        "500": {
          description: "Server error"
        }
      }
    }
  }
} as const;
