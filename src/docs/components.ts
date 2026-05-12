export const components = {
  securitySchemes: {
    bearerAuth: {
      type: "http",
      scheme: "bearer",
      bearerFormat: "JWT",
      description: "Preferred authentication method. Send the JWT as `Authorization: Bearer <token>`."
    },
    authTokenHeader: {
      type: "apiKey",
      in: "header",
      name: "auth-token",
      description: "Legacy authentication header supported by the API."
    }
  },
  schemas: {
    ErrorResponse: {
      type: "object",
      properties: {
        error: {
          oneOf: [{ type: "string" }, { type: "null" }]
        },
        message: {
          type: "string"
        }
      }
    },
    MessageResponse: {
      type: "object",
      properties: {
        message: {
          type: "string"
        }
      },
      required: ["message"]
    },
    SafeUser: {
      type: "object",
      properties: {
        id: { type: "string", example: "6820cc0db9f0cb815d969cb3" },
        name: { type: "string", example: "Catalina" },
        email: { type: "string", format: "email", example: "catalina@example.com" },
        handle: { type: "string", example: "catalina_reads" },
        avatarUrl: { type: "string", example: "/uploads/profiles/avatar-123.png" },
        coverImageUrl: { type: "string", example: "/uploads/profiles/cover-123.webp" },
        bio: { type: "string", example: "Fantasy lover, audiobook collector, serial rereader." },
        isProfilePublic: { type: "boolean", example: true },
        role: { type: "string", example: "user" }
      },
      required: ["id", "name", "email"]
    },
    RegisterRequest: {
      type: "object",
      properties: {
        name: { type: "string", minLength: 2, maxLength: 100, example: "Catalina" },
        email: { type: "string", format: "email", example: "catalina@example.com" },
        password: { type: "string", minLength: 6, maxLength: 20, example: "secret123" },
        handle: { type: "string", pattern: "^[A-Za-z0-9_]{3,30}$", example: "catalina_reads" },
        avatarUrl: { type: "string", nullable: true, example: "" },
        coverImageUrl: { type: "string", nullable: true, example: "" },
        bio: { type: "string", nullable: true, maxLength: 500, example: "I track every book I touch." },
        isProfilePublic: { type: "boolean", example: true }
      },
      required: ["name", "email", "password"]
    },
    RegisterResponse: {
      type: "object",
      properties: {
        error: { type: "null", example: null },
        data: {
          type: "object",
          properties: {
            id: { type: "string", example: "6820cc0db9f0cb815d969cb3" },
            message: { type: "string", example: "User registered successfully" },
            user: { $ref: "#/components/schemas/SafeUser" }
          },
          required: ["id", "message", "user"]
        }
      },
      required: ["error", "data"]
    },
    LoginRequest: {
      type: "object",
      properties: {
        email: { type: "string", format: "email", example: "catalina@example.com" },
        password: { type: "string", minLength: 6, maxLength: 20, example: "secret123" }
      },
      required: ["email", "password"]
    },
    ForgotPasswordRequest: {
      type: "object",
      properties: {
        email: { type: "string", format: "email", example: "reader@example.com" }
      },
      required: ["email"]
    },
    ForgotPasswordResponse: {
      type: "object",
      properties: {
        error: { type: "null", example: null },
        data: {
          type: "object",
          properties: {
            message: {
              type: "string",
              example: "If an account matches that email, a password reset link has been sent."
            }
          },
          required: ["message"]
        }
      },
      required: ["error", "data"]
    },
    ResetPasswordRequest: {
      type: "object",
      properties: {
        token: { type: "string", example: "secure-reset-token" },
        password: { type: "string", minLength: 6, maxLength: 20, example: "secret123" }
      },
      required: ["token", "password"]
    },
    ResetPasswordResponse: {
      type: "object",
      properties: {
        error: { type: "null", example: null },
        data: {
          type: "object",
          properties: {
            message: { type: "string", example: "Password reset successful." }
          },
          required: ["message"]
        }
      },
      required: ["error", "data"]
    },
    LoginResponse: {
      type: "object",
      properties: {
        error: { type: "null", example: null },
        data: {
          type: "object",
          properties: {
            userId: { type: "string", example: "6820cc0db9f0cb815d969cb3" },
            token: { type: "string", example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." },
            user: { $ref: "#/components/schemas/SafeUser" }
          },
          required: ["userId", "token", "user"]
        }
      },
      required: ["error", "data"]
    },
    CurrentUserResponse: {
      type: "object",
      properties: {
        error: { type: "null", example: null },
        data: {
          type: "object",
          properties: {
            user: { $ref: "#/components/schemas/SafeUser" }
          },
          required: ["user"]
        }
      },
      required: ["error", "data"]
    },
    UpdateProfileRequest: {
      type: "object",
      description: "Use `multipart/form-data` when uploading files. Uploaded files override raw URL fields.",
      properties: {
        name: { type: "string", minLength: 2, example: "Catalina Nicoleta" },
        bio: { type: "string", maxLength: 500, example: "Building a better reading life, one shelf at a time." },
        avatarUrl: { type: "string", example: "https://example.com/avatar.png" },
        coverImageUrl: { type: "string", example: "https://example.com/cover.png" },
        avatar: { type: "string", format: "binary" },
        cover: { type: "string", format: "binary" }
      }
    },
    PublicReaderCard: {
      type: "object",
      properties: {
        id: { type: "string", example: "6820cc0db9f0cb815d969cb3" },
        handle: { type: "string", example: "catalina_reads" },
        name: { type: "string", example: "Catalina" },
        avatarUrl: { type: "string", example: "/uploads/profiles/avatar-123.png" },
        bio: { type: "string", example: "Fantasy lover and note-taker." }
      },
      required: ["id", "name"]
    },
    ReaderSearchResult: {
      type: "object",
      properties: {
        id: { type: "string", example: "6820cc0db9f0cb815d969cb3" },
        handle: { type: "string", example: "catalina_reads" },
        name: { type: "string", example: "Catalina" },
        avatarUrl: { type: "string", example: "/uploads/profiles/avatar-123.png" },
        bio: { type: "string", example: "Fantasy lover and note-taker." },
        matchField: { type: "string", enum: ["handle", "name"], example: "handle" }
      },
      required: ["id", "name", "matchField"]
    },
    ReaderSearchResponse: {
      type: "object",
      properties: {
        error: { type: "null", example: null },
        data: {
          type: "object",
          properties: {
            query: { type: "string", example: "catalina" },
            readers: {
              type: "array",
              items: { $ref: "#/components/schemas/ReaderSearchResult" }
            }
          },
          required: ["query", "readers"]
        }
      },
      required: ["error", "data"]
    },
    PublicBookSnapshot: {
      type: "object",
      properties: {
        source: { type: "string", enum: ["open_library", "custom"], example: "open_library" },
        externalBookId: { type: "string", example: "OL27448W" },
        title: { type: "string", example: "A Court of Mist and Fury" },
        author: { type: "string", example: "Sarah J. Maas" },
        cover: { type: "string", example: "https://covers.openlibrary.org/b/id/12345-L.jpg" },
        publishedYear: { type: "number", example: 2016 }
      },
      required: ["source", "title"]
    },
    ReaderProfileResponse: {
      type: "object",
      properties: {
        error: { type: "null", example: null },
        data: {
          type: "object",
          properties: {
            reader: {
              type: "object",
              properties: {
                id: { type: "string" },
                handle: { type: "string" },
                name: { type: "string" },
                avatarUrl: { type: "string" },
                coverImageUrl: { type: "string" },
                bio: { type: "string" },
                isProfilePublic: { type: "boolean" },
                followerCount: { type: "number" },
                followingCount: { type: "number" },
                isFollowing: { type: "boolean" },
                isOwnProfile: { type: "boolean" }
              },
              required: ["id", "name", "followerCount", "followingCount", "isFollowing", "isOwnProfile"]
            },
            summary: {
              type: "object",
              properties: {
                booksInLibrary: { type: "number" },
                finishedCount: { type: "number" },
                inProgressCount: { type: "number" },
                reviewsCount: { type: "number" }
              },
              required: ["booksInLibrary", "finishedCount", "inProgressCount", "reviewsCount"]
            },
            shelves: {
              type: "object",
              properties: {
                want_to_read: { type: "number" },
                currently_reading: { type: "number" },
                currently_listening: { type: "number" },
                finished_reading: { type: "number" },
                finished_listening: { type: "number" },
                on_break: { type: "number" },
                did_not_finish: { type: "number" }
              }
            },
            recentActivity: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  type: { type: "string", enum: ["reviewed", "rated", "finished", "updated_library"] },
                  createdAt: { type: "string", format: "date-time" },
                  isSpoiler: { type: "boolean" },
                  reviewText: { type: "string" },
                  rating: { type: "number" },
                  status: {
                    type: "string",
                    enum: [
                      "want_to_read",
                      "currently_reading",
                      "currently_listening",
                      "finished_reading",
                      "finished_listening",
                      "on_break",
                      "did_not_finish"
                    ]
                  },
                  book: { $ref: "#/components/schemas/PublicBookSnapshot" }
                },
                required: ["type", "createdAt", "status", "book"]
              }
            },
            spotlight: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  createdAt: { type: "string", format: "date-time" },
                  status: {
                    type: "string",
                    enum: [
                      "want_to_read",
                      "currently_reading",
                      "currently_listening",
                      "finished_reading",
                      "finished_listening",
                      "on_break",
                      "did_not_finish"
                    ]
                  },
                  rating: { type: "number" },
                  reviewText: { type: "string" },
                  isSpoiler: { type: "boolean" },
                  book: { $ref: "#/components/schemas/PublicBookSnapshot" }
                },
                required: ["createdAt", "status", "book"]
              }
            }
          },
          required: ["reader", "summary", "shelves", "recentActivity", "spotlight"]
        }
      },
      required: ["error", "data"]
    },
    FollowMutationResponse: {
      type: "object",
      properties: {
        error: { type: "null", example: null },
        data: {
          type: "object",
          properties: {
            targetUserId: { type: "string", example: "6820cc0db9f0cb815d969cb4" },
            following: { type: "boolean", example: true },
            followerCount: { type: "number", example: 18 },
            followingCount: { type: "number", example: 42 }
          },
          required: ["targetUserId", "following", "followerCount", "followingCount"]
        }
      },
      required: ["error", "data"]
    },
    FeedResponse: {
      type: "object",
      properties: {
        error: { type: "null", example: null },
        data: {
          type: "object",
          properties: {
            items: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  type: {
                    type: "string",
                    enum: [
                      "added_to_shelf",
                      "started_reading",
                      "started_listening",
                      "finished_reading",
                      "finished_listening",
                      "rated_book",
                      "published_review",
                      "updated_review",
                      "reread_logged"
                    ]
                  },
                  createdAt: { type: "string", format: "date-time" },
                  actor: {
                    type: "object",
                    properties: {
                      id: { type: "string" },
                      handle: { type: "string" },
                      name: { type: "string" },
                      avatarUrl: { type: "string" }
                    },
                    required: ["id", "handle", "name"]
                  },
                  book: { $ref: "#/components/schemas/PublicBookSnapshot" },
                  rating: { type: "number" },
                  reviewText: { type: "string" },
                  isSpoiler: { type: "boolean" },
                  status: { type: "string" },
                  previousStatus: { type: "string" }
                },
                required: ["id", "type", "createdAt", "actor", "book"]
              }
            },
            pageInfo: {
              type: "object",
              properties: {
                nextCursor: { type: "string", example: "eyJjcmVhdGVkQXQiOiIyMDI2LTA1LTExVDEyOjAwOjAwLjAwMFoiLCJpZCI6IjY4MjBjYzBkYjlmMGNiODE1ZDk2OWNiMyJ9" },
                hasMore: { type: "boolean", example: true }
              },
              required: ["hasMore"]
            },
            meta: {
              type: "object",
              properties: {
                followingCount: { type: "number", example: 12 },
                includeSelf: { type: "boolean", example: true }
              },
              required: ["followingCount", "includeSelf"]
            }
          },
          required: ["items", "pageInfo", "meta"]
        }
      },
      required: ["error", "data"]
    },
    ReadingSession: {
      type: "object",
      properties: {
        dateStarted: { type: "string", format: "date-time" },
        dateFinished: { type: "string", format: "date-time" }
      }
    },
    LibraryEntryBase: {
      type: "object",
      properties: {
        bookSource: { type: "string", enum: ["open_library", "custom"], example: "open_library" },
        externalBookId: { type: "string", example: "OL27448W" },
        customBook: {
          type: "object",
          properties: {
            title: { type: "string", example: "My Handmade Zine" },
            author: { type: "string", example: "Catalina" },
            cover: { type: "string", example: "https://example.com/zine.png" },
            publishedYear: { type: "number", example: 2026 }
          }
        },
        title: { type: "string", example: "A Court of Mist and Fury" },
        author: { type: "string", example: "Sarah J. Maas" },
        cover: { type: "string", example: "https://covers.openlibrary.org/b/id/12345-L.jpg" },
        publishedYear: { type: "number", example: 2016 },
        status: {
          type: "string",
          enum: [
            "want_to_read",
            "currently_reading",
            "currently_listening",
            "finished_reading",
            "finished_listening",
            "on_break",
            "did_not_finish"
          ],
          example: "currently_reading"
        },
        format: {
          type: "string",
          enum: ["physical", "ebook", "audiobook"],
          description: "Legacy single-format field kept for backward compatibility."
        },
        formats: {
          type: "array",
          items: { type: "string", enum: ["physical", "ebook", "audiobook"] },
          example: ["physical", "ebook"]
        },
        customLists: {
          type: "array",
          items: { type: "string" },
          example: ["book-club", "favorites"]
        },
        rating: { type: "number", minimum: 0.5, maximum: 5, multipleOf: 0.5, example: 4.5 },
        reviewText: { type: "string", maxLength: 5000, example: "The banter was immaculate." },
        isSpoiler: { type: "boolean", example: false },
        notes: { type: "string", maxLength: 5000, example: "Private note: revisit chapter 54." },
        dateStarted: { type: "string", format: "date-time" },
        dateFinished: { type: "string", format: "date-time" },
        readingSessions: {
          type: "array",
          items: { $ref: "#/components/schemas/ReadingSession" }
        },
        progressValue: { type: "number", minimum: 0, example: 287 },
        progressMax: { type: "number", minimum: 0, example: 640 },
        progressUnit: { type: "string", enum: ["pages", "percent", "minutes", "hours"], example: "pages" }
      }
    },
    CreateLibraryEntryRequest: {
      allOf: [
        { $ref: "#/components/schemas/LibraryEntryBase" },
        {
          type: "object",
          required: ["bookSource", "title", "status"]
        }
      ]
    },
    UpdateLibraryEntryRequest: {
      type: "object",
      properties: {
        status: { type: "string" },
        format: { type: "string", enum: ["physical", "ebook", "audiobook"] },
        formats: {
          type: "array",
          items: { type: "string", enum: ["physical", "ebook", "audiobook"] }
        },
        customLists: {
          type: "array",
          items: { type: "string" }
        },
        rating: { type: "number", minimum: 0.5, maximum: 5, multipleOf: 0.5 },
        reviewText: { type: "string", maxLength: 5000 },
        isSpoiler: { type: "boolean" },
        notes: { type: "string", maxLength: 5000 },
        dateStarted: { type: "string", format: "date-time" },
        dateFinished: { type: "string", format: "date-time" },
        readingSessions: {
          type: "array",
          items: { $ref: "#/components/schemas/ReadingSession" }
        },
        progressValue: { type: "number", minimum: 0 },
        progressMax: { type: "number", minimum: 0 },
        progressUnit: { type: "string", enum: ["pages", "percent", "minutes", "hours"] }
      }
    },
    LibraryEntry: {
      allOf: [
        { $ref: "#/components/schemas/LibraryEntryBase" },
        {
          type: "object",
          properties: {
            _id: { type: "string", example: "6820d34cb9f0cb815d969ce7" },
            userId: { type: "string", example: "6820cc0db9f0cb815d969cb3" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" }
          },
          required: ["_id", "userId", "bookSource", "title", "status", "createdAt", "updatedAt"]
        }
      ]
    },
    LibraryListResponse: {
      type: "object",
      properties: {
        data: {
          type: "array",
          items: { $ref: "#/components/schemas/LibraryEntry" }
        }
      },
      required: ["data"]
    },
    BookSearchResponse: {
      type: "object",
      properties: {
        error: { type: "null", example: null },
        data: {
          type: "object",
          properties: {
            results: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  source: { type: "string", example: "open_library" },
                  externalBookId: { type: "string", example: "OL27448W" },
                  title: { type: "string", example: "A Court of Mist and Fury" },
                  author: { type: "string", example: "Sarah J. Maas" },
                  cover: { type: "string", example: "https://covers.openlibrary.org/b/id/12345-L.jpg" },
                  publishedYear: { type: "number", example: 2016 },
                  isbn: { type: "string", example: "9781619634466" }
                },
                required: ["externalBookId", "title"]
              }
            },
            pagination: {
              type: "object",
              properties: {
                page: { type: "number", example: 1 },
                limit: { type: "number", example: 6 },
                numFound: { type: "number", example: 235 }
              },
              required: ["page", "limit", "numFound"]
            }
          },
          required: ["results", "pagination"]
        }
      },
      required: ["error", "data"]
    },
    BookDetailResponse: {
      type: "object",
      properties: {
        error: { type: "null", example: null },
        data: {
          type: "object",
          properties: {
            source: { type: "string", example: "open_library" },
            requestedKey: { type: "string", example: "OL27448W" },
            workKey: { type: "string", example: "OL27448W" },
            editionKey: { type: "string", example: "OL12345M" },
            externalBookId: { type: "string", example: "OL27448W" },
            title: { type: "string", example: "A Court of Mist and Fury" },
            description: { type: "string" },
            cover: { type: "string" },
            authors: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  key: { type: "string" }
                },
                required: ["name"]
              }
            },
            firstPublishDate: { type: "string" },
            publishedYear: { type: "number" },
            subjects: { type: "array", items: { type: "string" } },
            subjectPeople: { type: "array", items: { type: "string" } },
            subjectPlaces: { type: "array", items: { type: "string" } },
            subjectTimes: { type: "array", items: { type: "string" } },
            publishers: { type: "array", items: { type: "string" } },
            publishPlaces: { type: "array", items: { type: "string" } },
            languages: { type: "array", items: { type: "string" } },
            excerpts: { type: "array", items: { type: "string" } },
            editionCount: { type: "number" },
            pageCount: { type: "number" },
            series: {
              type: "object",
              properties: {
                key: { type: "string" },
                name: { type: "string" }
              }
            },
            seriesPosition: { type: "string" },
            communityRating: {
              type: "object",
              properties: {
                average: { type: "number" },
                ratingsCount: { type: "number" },
                reviewsCount: { type: "number" }
              }
            },
            reviewsCount: { type: "number" },
            reviews: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  author: { $ref: "#/components/schemas/PublicReaderCard" },
                  userName: { type: "string" },
                  avatarUrl: { type: "string" },
                  handle: { type: "string" },
                  rating: { type: "number" },
                  content: { type: "string" },
                  createdAt: { type: "string", format: "date-time" },
                  source: { type: "string", example: "bookora" },
                  isSpoiler: { type: "boolean" }
                },
                required: ["id", "userName", "rating", "content", "createdAt", "source", "isSpoiler"]
              }
            },
            similarBooks: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  title: { type: "string" },
                  coverUrl: { type: "string" },
                  authors: {
                    type: "array",
                    items: { type: "string" }
                  }
                },
                required: ["id", "title"]
              }
            }
          },
          required: ["source", "requestedKey", "workKey", "externalBookId", "title", "authors"]
        }
      },
      required: ["error", "data"]
    },
    AuthorDetailsResponse: {
      type: "object",
      properties: {
        error: { type: "null", example: null },
        data: {
          type: "object",
          properties: {
            key: { type: "string", example: "OL1394242A" },
            name: { type: "string", example: "Sarah J. Maas" },
            photoUrl: { type: "string" },
            bio: { type: "string" },
            birthDate: { type: "string" },
            deathDate: { type: "string" },
            topSubjects: {
              type: "array",
              items: { type: "string" }
            },
            links: {
              type: "object",
              properties: {
                openLibrary: { type: "string" },
                wikipedia: { type: "string" }
              }
            },
            seriesGroups: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  seriesKey: { type: "string" },
                  seriesTitle: { type: "string" },
                  books: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        key: { type: "string" },
                        title: { type: "string" },
                        coverUrl: { type: "string" },
                        firstPublishYear: { type: "number" },
                        description: { type: "string" },
                        seriesTitle: { type: "string" },
                        seriesPosition: {
                          oneOf: [{ type: "string" }, { type: "number" }]
                        }
                      },
                      required: ["key", "title"]
                    }
                  }
                },
                required: ["seriesKey", "seriesTitle", "books"]
              }
            },
            standaloneBooks: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  key: { type: "string" },
                  title: { type: "string" },
                  coverUrl: { type: "string" },
                  firstPublishYear: { type: "number" },
                  description: { type: "string" }
                },
                required: ["key", "title"]
              }
            }
          },
          required: ["key", "name", "links", "seriesGroups", "standaloneBooks"]
        }
      },
      required: ["error", "data"]
    },
    SeriesDetailsResponse: {
      type: "object",
      properties: {
        error: { type: "null", example: null },
        data: {
          type: "object",
          properties: {
            key: { type: "string", example: "OL23323W" },
            title: { type: "string", example: "Throne of Glass" },
            description: { type: "string" },
            bookCount: { type: "number", example: 8 },
            books: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  key: { type: "string" },
                  title: { type: "string" },
                  coverUrl: { type: "string" },
                  firstPublishYear: { type: "number" },
                  description: { type: "string" },
                  authors: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        key: { type: "string" },
                        name: { type: "string" }
                      },
                      required: ["name"]
                    }
                  },
                  position: {
                    oneOf: [{ type: "string" }, { type: "number" }]
                  }
                },
                required: ["key", "title", "authors"]
              }
            }
          },
          required: ["key", "title", "bookCount", "books"]
        }
      },
      required: ["error", "data"]
    }
  }
} as const;
