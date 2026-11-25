# Library Management System

A book catalog API for a library, built with NestJS, Prisma and a hosted PostgreSQL database (Neon). It has genre and book CRUD with search, filtering and pagination, JWT authentication, and role-based access (librarians manage the catalog, patrons browse it).

## Setup

```bash
cd api
npm install
cp .env.example .env    # Windows: copy .env.example .env
```

Then fill in `.env`:

- `DATABASE_URL`: your PostgreSQL connection string (use the direct, non-pooled one for migrations).
- `JWT_SECRET`: a long random string. Generate one with:
  `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

Create the tables, load the sample data and start the API:

```bash
npx prisma migrate dev
npx prisma db seed
npm run start
```

The seed inserts 4 genres, 16 books and one librarian account. It is safe to re-run.

**Development librarian login (created by the seed):**
`librarian@library.com` / `Librarian123!`. This is for local testing only.

## API Endpoints

| Method | Route | Access |
|---|---|---|
| POST | `/auth/register` | Public (creates a PATRON) |
| POST | `/auth/login` | Public (returns a JWT) |
| GET | `/genres`, `/genres/:id` | Public |
| POST, PATCH, DELETE | `/genres`, `/genres/:id` | LIBRARIAN |
| GET | `/books` | Public |
| GET | `/books/:id` | Public |
| POST, PATCH, DELETE | `/books`, `/books/:id` | LIBRARIAN |

`GET /books` accepts `genreId`, `search` (title or author), `page` and `limit`.
Send the token as `Authorization: Bearer <token>`.

A Postman collection with a request for every endpoint is in `docs/postman_collection.json`.

## Schema Decisions

**Why Book references Genre instead of embedding it.**
A `Book` stores a `genreId` foreign key pointing at a row in the `Genre` table
(`@relation(fields: [genreId], references: [id])`) rather than copying genre
data into each book. Reasons:

- **Single source of truth.** A genre's name lives in one row. Renaming
  "Science Fiction" is one update, not an edit to every book.
- **No inconsistency.** Embedded strings drift ("Sci-Fi", "SciFi", "sci fi").
  The foreign key guarantees every book points at a genre that exists.
- **Genre is its own entity.** We need to list genres, browse books by genre
  and count books per genre. A separate table with an index on `genreId` keeps
  these queries simple.
- **The data is relational.** Genre-to-book is one-to-many and shared, so a
  relation fits better than duplication.

**Other decisions**

- `Role` is an enum (`PATRON`, `LIBRARIAN`) defaulting to `PATRON`, so invalid
  roles are rejected by the database and new users get least privilege.
- `Book.isbn` and `User.email` are `@unique`, which also makes the seed safe to re-run.
- `Review` (stretch) links `Book` and `User`, with `@@unique([bookId, userId])`
  so a patron can review a given book only once.

**Changes in Week 2**

- **`password` on `User`.** Stores a bcrypt hash, never the plain password.
  Register and login need somewhere to keep credentials, and responses never
  include this field.
- **`copiesAvailable` renamed to `totalCopies`.** The field holds how many
  copies the library owns, not how many are currently on the shelf, so the new
  name is more accurate.
- **Role is not accepted at registration.** `RegisterDto` has no `role` field,
  and the global `ValidationPipe` uses `whitelist: true`, so every new account
  is a `PATRON`. Librarian accounts are created only by the seed script.
- **Foreign key protection.** Deleting a genre that still has books is
  rejected with a 409, so a book can never point at a missing genre.

## Prisma vs. a Document Database

Working with Prisma and PostgreSQL felt different from using a document database because I had to define the relationships between entities in advance using a schema. In a document database, related data can be stored together in nested documents, while in PostgreSQL, I used foreign keys to connect tables such as Book and Genre. This helped me understand the importance of data consistency, normalization, and maintaining clear relationships between data.