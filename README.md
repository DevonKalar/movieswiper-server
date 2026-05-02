# MovieSwiper Server

A TypeScript/Node.js backend API for a movie recommendation application that combines user authentication, OpenAI integration, and TMDB (The Movie Database) services.

## Features

- **User Authentication**: JWT-based auth with secure httpOnly cookies
- **OpenAI Integration**: AI-powered movie recommendations using the latest Responses API
- **TMDB Integration**: Access to comprehensive movie database
- **Database Management**: PostgreSQL with Prisma ORM
- **Security**: Rate limiting, CORS protection, input validation
- **Type Safety**: Full TypeScript implementation with Zod validation

## Architecture

Application

```
src/
├── app.ts           # Express application configuration and middleware setup
├── server.ts        # Server startup and graceful shutdown handling
├── config/          # Environment configuration
├── lib/             # Database and utility libraries (Prisma client)
├── controllers/     # Route request and response handling
├── middleware/      # Authentication and validation
├── models/          # Zod schemas and inferred input types
├── routes/          # API endpoint definitions (thin wrappers)
├── services/        # Internal business logic (auth, recommendations, watchlist)
├── clients/         # External service integrations (OpenAI, TMDB)
├── types/           # TypeScript type definitions and response types
└── utils/           # Utility functions (genre mapping, data transformations, etc.)
```

Testing

```
tests/
├── integration/    # Integration Tests (routes with real database)
├── unit/           # Unit Tests (middleware, services)
├── mocks/          # MSW handlers for external API mocking
├── utils/          # Utility functions for testing (MSW setup)
└── setupTests.ts   # Global test configuration
```

## Database Schema

The application uses PostgreSQL with three main tables:

### User

- `id`: Primary key
- `email`: Unique email address
- `password`: Hashed password (bcrypt)
- `firstName`, `lastName`: User's name
- `createdAt`, `updatedAt`: Timestamps

### Movies

- `id`: Primary key (TMDB movie ID - synced with external API)
- `title`, `description`: Movie information
- `releaseDate`: Release date
- `posterUrl`: Movie poster image URL (nullable)
- `genres`: Array of genre strings
- `ratings`: Float rating value
- `createdAt`, `updatedAt`: Timestamps

### Watchlist

- `id`: Primary key
- `userId`: Foreign key to User
- `movieId`: Foreign key to Movies
- `createdAt`: Timestamp
- **Unique constraint**: (userId, movieId) - prevents duplicate entries
- **Cascade delete**: Removes watchlist entries when user or movie is deleted

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL database
- OpenAI API key
- TMDB API key

### Installation

1. **Clone the repository**

    ```bash
    git clone <repository-url>
    cd movieswiper-server
    ```

2. **Install dependencies**

    ```bash
    npm install
    ```

3. **Set up environment variables**

    ```bash
    cp .env.example .env
    ```

    Update `.env` with your configuration:

    ```env
    # Database
    DATABASE_URL=postgresql://username:password@localhost:5432/movieswiper_app

    # API Keys
    OPENAI_API_KEY=your_openai_api_key
    TMDB_BEARER_TOKEN=your_tmdb_bearer_token

    # Security
    JWT_SECRET=your_jwt_secret_key

    # Server Configuration
    PORT=3000
    NODE_ENV=development
    CORS_ORIGINS=http://localhost:5173
    ```

4. **Set up the database**

    ```bash
    npx prisma migrate dev
    npx prisma generate
    ```

5. **Start development server**
    ```bash
    npm run dev
    ```

## API Endpoints

### Authentication (`/api/auth`)

| Method | Endpoint    | Description             |
| ------ | ----------- | ----------------------- |
| POST   | `/register` | Create new user account |
| POST   | `/login`    | Authenticate user       |
| POST   | `/logout`   | Sign out user           |

**Example Registration:**

```json
POST /api/auth/register
{
  "email": "user@example.com",
  "password": "securepassword",
  "firstName": "John",
  "lastName": "Doe"
}
```

### Recommendations (`/api/recommendations`)

| Method | Endpoint               | Description                            |
| ------ | ---------------------- | -------------------------------------- |
| GET    | `/api/recommendations` | Get personalized movie recommendations |

**Query Parameters:**

- `page` (optional): Page number for pagination (default: 1)

**Behavior:**

- **Authenticated users**: Returns popular movies filtered to exclude movies already in user's watchlist
- **Unauthenticated users**: Returns popular movies without filtering

**Example Response:**

```json
{
    "results": [
        {
            "id": 550,
            "title": "Fight Club",
            "overview": "A ticking-time-bomb insomniac...",
            "poster_path": "/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg",
            "genre_ids": [18, 53, 35],
            "genre_names": ["Drama", "Thriller", "Comedy"],
            "vote_average": 8.433,
            "release_date": "1999-10-15"
        }
    ],
    "nextPage": 2
}
```

### Watchlist (`/api/watchlist`)

| Method | Endpoint            | Description                 |
| ------ | ------------------- | --------------------------- |
| POST   | `api/watchlist`     | Adds movie to watchlist     |
| GET    | `api/watchlist`     | Retrieve user watchlist     |
| DELETE | `api/watchlist/:id` | Delete movie from watchlist |

**Example Add Watchlist Movie:**

```json
POST /api/watchlist
{
  "movie": {
    "id": 550,
    "title": "Fight Club",
    "description": "A ticking-time-bomb insomniac and a devil-may-care soapmaker form an underground fight club...",
    "releaseDate": "1999-10-15",
    "poster": "https://image.tmdb.org/t/p/original/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg",
    "genres": ["Drama", "Thriller", "Comedy"]
  }
}
```

### OpenAI (`/api/openai`)

Proxied API requests to OpenAI responses.

| Method | Endpoint        | Description                |
| ------ | --------------- | -------------------------- |
| POST   | `/response`     | Generate AI response       |
| GET    | `/response/:id` | Retrieve specific response |

**Example AI Request:**

```json
POST /api/openai/response
{
  "input": "Recommend a sci-fi movie similar to Blade Runner",
  "instructions": "Focus on atmospheric cyberpunk themes",
  "previous_response_id": "resp_123" // Optional for conversation
}
```

## Error Response Formats

All error responses follow consistent formats:

**Authentication Errors (401):**

```json
{ "message": "Unauthorized" }
```

**Validation Errors (400):**

```json
{
    "message": "Invalid request body",
    "errors": [
        {
            "code": "invalid_type",
            "path": ["email"],
            "message": "Expected string, received number"
        }
    ]
}
```

**Conflict Errors (409):**

```json
{ "message": "item already in table" }
```

**Not Found (404):**

```json
{ "message": "table item not found" }
```

**Server Errors (500):**

```json
{ "error": "Internal server error" }
```

## Security Features

- **JWT Authentication**: Secure token-based authentication
- **HTTP-only Cookies**: Prevents XSS attacks
- **Rate Limiting**: Protects against abuse
- **Input Validation**: Zod schema validation
- **CORS Configuration**: Controlled cross-origin requests
- **Password Hashing**: bcrypt with salt rounds

### Middleware Types

- **`requireUser`**: Blocks unauthenticated requests (401)
- **`optionalUser`**: Allows requests but extracts user if authenticated
- **`authRateLimiter`**: Rate limits authentication endpoints (stricter limits)
- **`requestRateLimiter`**: General API rate limiting

### Technology Stack

### Core

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Build Tool**: tsup

### Database

- **Database**: PostgreSQL
- **ORM**: Prisma
- **Migration**: Prisma Migrate

### External APIs

- **AI**: OpenAI (Responses API)
- **Movies**: The Movie Database (TMDB)

### Security & Validation

- **Authentication**: jsonwebtoken
- **Password Hashing**: bcrypt
- **Validation**: Zod
- **Rate Limiting**: express-rate-limit

### Testing

- **Test Library**: Vitest
- **API Mocks**: MockServiceWorker (MSW)
- **Route Testing**: SuperTest

## Development

### Available Scripts

```bash
# Development
npm run dev           # Start development server with hot reload
npm run build         # Build for production
npm start             # Start production server

# Testing
npm test                  # Run all tests once
npm run test:watch        # Run tests in watch mode
npm run test:ui           # Open Vitest UI dashboard
npm run vitest:coverage   # Generate test coverage report

# Database
npm run postinstall   # Generate Prisma client

# Code Quality
npm run lint          # Run ESLint
```

### Database Operations

```bash
# Run migrations
npx prisma migrate dev

# Reset database
npx prisma migrate reset

# View data
npx prisma studio

# Generate client
npx prisma generate
```

### Testing

The project uses **Vitest** for testing with separate unit and integration test suites:

**Unit Tests** (`tests/unit/`):

- Mock external dependencies using `setupMSW()` **MSW (Mock Service Worker)**
- Test services (TMDB, OpenAI) with mocked HTTP responses
- Test middleware (validation, auth) with mocked Express objects

**Integration Tests** (`tests/integration/`):

- Test complete request/response cycle with real database
- Use **Supertest** to simulate HTTP requests
- Test authentication flow, validation, and database operations
- Clean up test data in `beforeAll`/`afterAll` hooks

**Running Tests:**

```bash
# Run all tests
npm test

# Watch mode for development
npm run test:watch

# View coverage report
npm run vitest:coverage

# Interactive UI
npm run test:ui
```

## Environment Variables

| Variable            | Description                  | Required |
| ------------------- | ---------------------------- | -------- |
| `DATABASE_URL`      | PostgreSQL connection string | ✅       |
| `OPENAI_API_KEY`    | OpenAI API authentication    | ✅       |
| `TMDB_BEARER_TOKEN` | TMDB API bearer token        | ✅       |
| `JWT_SECRET`        | Secret key for JWT signing   | ✅       |
| `PORT`              | Server port (default: 3000)  | ❌       |
| `NODE_ENV`          | Environment mode             | ❌       |
| `CORS_ORIGINS`      | Allowed CORS origins         | ❌       |

## Deployment

### Production Build

```bash
npm run build
npm start
```

### Environment Setup

1. Set `NODE_ENV=production`
2. Use strong `JWT_SECRET`
3. Configure secure database connection
4. Set appropriate `CORS_ORIGINS`
5. Enable SSL/HTTPS in production

## License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

### ISC License Summary

- ✅ **Commercial use** - Use in commercial applications
- ✅ **Modification** - Modify and create derivative works
- ✅ **Distribution** - Distribute copies of the software
- ✅ **Private use** - Use privately without restrictions
- ⚠️ **License notice required** - Include original copyright notice
