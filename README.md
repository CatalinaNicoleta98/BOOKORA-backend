# Bookora Backend

Bookora is a modern reading tracker inspired by Goodreads and StoryGraph.

This repository contains the backend API for Bookora. It handles authentication, reader profiles, personal libraries, social features, activity feeds, and Open Library integration.

## Features

- User registration and login
- JWT-based authentication
- Protected routes
- Reader profiles and public profiles
- Book search and book details
- Author pages
- Series pages
- Library entries
- Reading statuses
- Ownership formats
- Ratings and reviews
- Follow system
- Activity feed
- Demo data seeding
- Swagger/OpenAPI documentation

## Tech Stack

- Node.js
- Express
- TypeScript
- MongoDB
- Mongoose
- JWT
- Swagger/OpenAPI
- Vitest
- Render

## Project Structure

```txt
src/
├── config/
├── controllers/
├── docs/
├── interfaces/
├── middleware/
├── models/
├── routes/
├── seed/
├── services/
├── tests/
├── app.ts
├── index.ts
└── routes.ts
```

The backend follows a layered architecture with clear separation between routes, controllers, services, models, middleware, documentation, seeding, and tests.

## Architecture

- Routes define API endpoints
- Controllers handle HTTP requests and responses
- Services contain business logic
- Models define MongoDB schemas
- Interfaces define TypeScript contracts
- Middleware handles authentication and uploads
- Docs contain the OpenAPI specification
- Seed files create demo users, follows, books, library entries, and activity data
- Tests validate Open Library normalization and service behavior

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/BOOKORA-backend.git
cd BOOKORA-backend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the project root.

```env
PORT=4000
DBHOST=your_mongodb_connection_string
TOKEN_SECRET=your_jwt_secret
CLIENT_URL=http://localhost:5173
```


### 4. Run the development server

```bash
npm run dev
```

The API runs locally on:

```txt
http://localhost:4000
```

## API Documentation

Swagger documentation is available locally at:

```txt
http://localhost:4000/docs
```

Production Swagger documentation:

```txt
https://your-backend-url.onrender.com/docs
```

## Available Scripts

```bash
npm run dev
```

Starts the backend in development mode.

```bash
npm run build
```

Builds the TypeScript project.

```bash
npm run start
```

Runs the compiled production server.

```bash
npm run test
```

Runs backend tests.

```bash
npm run seed
```

Seeds the database with demo data, if configured in the project scripts.

## Testing

The backend includes service-level tests for Open Library integration and normalization logic.

Current test areas include:

- Author data mapping
- Edition handling
- Series grouping
- Open Library normalization

## Seeding

The `src/seed` folder contains demo data and services for creating a realistic Bookora demo environment.

Seed data includes:

- Demo users
- Demo books
- Demo follows
- Demo library entries
- Reading activity

This is useful for testing the platform and presenting the project with realistic user data.

## External Data

Bookora integrates with Open Library through the backend service layer.

The backend normalizes external data where possible, especially for:

- Books
- Authors
- Editions
- Series
- Covers
- Metadata

Because Open Library data can be incomplete or inconsistent, Bookora includes fallback handling to keep the user experience stable.

## Deployment

The backend is deployed on Render.

Recommended Render configuration:

```txt
Build Command: npm install && npm run build
Start Command: npm run start
```

Production environment variables should be configured directly in Render and never committed to GitHub.

## Frontend Repository

Bookora frontend repository:

```txt
Add your frontend GitHub repository link here.
```

## Live Links

```txt
Frontend: Add your frontend deployment link here.
Backend API: Add your backend Render link here.
Swagger Docs: Add your backend /docs link here.
```

## Author

Created by Catalina Nicoleta Vrinceanu  
Web Development Bachelor Project
