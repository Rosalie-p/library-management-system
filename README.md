\# Library Management System



Data layer for a library's book catalog, built with NestJS, Prisma and a hosted PostgreSQL database (Neon).



\## Setup



```bash

cd api

npm install

cp .env.example .env    # Windows: copy .env.example .env, then add your Postgres URL

npx prisma migrate dev --name init

npx prisma db seed

```



The seed inserts 4 genres and 16 books. It is safe to re-run.



\## Schema Decisions



\*\*Why Book references Genre instead of embedding it.\*\*

A `Book` stores a `genreId` foreign key pointing at a row in the `Genre` table

(`@relation(fields: \[genreId], references: \[id])`) rather than copying genre

data into each book. Reasons:



\- \*\*Single source of truth.\*\* A genre's name lives in one row. Renaming

&#x20; "Science Fiction" is one update, not an edit to every book.

\- \*\*No inconsistency.\*\* Embedded strings drift ("Sci-Fi", "SciFi", "sci fi").

&#x20; The foreign key guarantees every book points at a genre that exists.

\- \*\*Genre is its own entity.\*\* We need to list genres, browse books by genre

&#x20; and count books per genre. A separate table with an index on `genreId` keeps

&#x20; these queries simple.

\- \*\*The data is relational.\*\* Genre-to-book is one-to-many and shared, so a

&#x20; relation fits better than duplication.



\*\*Other decisions\*\*



\- `Role` is an enum (`PATRON`, `LIBRARIAN`) defaulting to `PATRON`, so invalid

&#x20; roles are rejected by the database and new users get least privilege.

\- `Book.isbn` and `User.email` are `@unique`, which also makes the seed safe to re-run.

\- `Review` (stretch) links `Book` and `User`, with `@@unique(\[bookId, userId])`

&#x20; so a patron can review a given book only once.



\## Prisma vs. a document database



(Write 2-3 sentences in your own words about one thing that felt different.)

