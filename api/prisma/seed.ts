import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const catalog: Record<
  string,
  { title: string; author: string; isbn: string; publishedYear: number; totalCopies: number }[]
> = {
  Fantasy: [
    { title: 'The Hobbit', author: 'J.R.R. Tolkien', isbn: '9780547928227', publishedYear: 1937, totalCopies: 3 },
    { title: 'A Wizard of Earthsea', author: 'Ursula K. Le Guin', isbn: '9780547773742', publishedYear: 1968, totalCopies: 2 },
    { title: 'The Name of the Wind', author: 'Patrick Rothfuss', isbn: '9780756404741', publishedYear: 2007, totalCopies: 2 },
    { title: 'Mistborn: The Final Empire', author: 'Brandon Sanderson', isbn: '9780765311788', publishedYear: 2006, totalCopies: 4 },
  ],
  'Science Fiction': [
    { title: 'Dune', author: 'Frank Herbert', isbn: '9780441013593', publishedYear: 1965, totalCopies: 3 },
    { title: 'Neuromancer', author: 'William Gibson', isbn: '9780441569595', publishedYear: 1984, totalCopies: 2 },
    { title: 'The Left Hand of Darkness', author: 'Ursula K. Le Guin', isbn: '9780441478125', publishedYear: 1969, totalCopies: 2 },
    { title: "Ender's Game", author: 'Orson Scott Card', isbn: '9780812550702', publishedYear: 1985, totalCopies: 3 },
  ],
  Mystery: [
    { title: 'And Then There Were None', author: 'Agatha Christie', isbn: '9780062073488', publishedYear: 1939, totalCopies: 3 },
    { title: 'The Big Sleep', author: 'Raymond Chandler', isbn: '9780394758282', publishedYear: 1939, totalCopies: 1 },
    { title: 'Gone Girl', author: 'Gillian Flynn', isbn: '9780307588371', publishedYear: 2012, totalCopies: 2 },
    { title: 'The Girl with the Dragon Tattoo', author: 'Stieg Larsson', isbn: '9780307454546', publishedYear: 2005, totalCopies: 2 },
  ],
  'Non-Fiction': [
    { title: 'Sapiens', author: 'Yuval Noah Harari', isbn: '9780062316110', publishedYear: 2011, totalCopies: 4 },
    { title: 'Educated', author: 'Tara Westover', isbn: '9780399590504', publishedYear: 2018, totalCopies: 2 },
    { title: 'The Selfish Gene', author: 'Richard Dawkins', isbn: '9780198788607', publishedYear: 1976, totalCopies: 1 },
    { title: 'A Brief History of Time', author: 'Stephen Hawking', isbn: '9780553380163', publishedYear: 1988, totalCopies: 2 },
  ],
};

async function main() {
  for (const [genreName, books] of Object.entries(catalog)) {
    const genre = await prisma.genre.upsert({
      where: { name: genreName },
      update: {},
      create: { name: genreName },
    });

    // upsert by unique ISBN: safe to re-run, and it fixes existing rows
    for (const b of books) {
      await prisma.book.upsert({
        where: { isbn: b.isbn },
        update: { totalCopies: b.totalCopies, genreId: genre.id },
        create: { ...b, genreId: genre.id },
      });
    }
  }

  // One librarian account (password comes from .env if set, else a dev default)
  const librarianPassword = process.env.SEED_LIBRARIAN_PASSWORD ?? 'Librarian123!';
  const hashed = await bcrypt.hash(librarianPassword, 10);
  await prisma.user.upsert({
    where: { email: 'librarian@library.com' },
    update: {},
    create: {
      email: 'librarian@library.com',
      name: 'Head Librarian',
      password: hashed,
      role: 'LIBRARIAN',
    },
  });

  const [genres, books, users] = await Promise.all([
    prisma.genre.count(),
    prisma.book.count(),
    prisma.user.count(),
  ]);
  console.log(`Seeded: ${genres} genres, ${books} books, ${users} users`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());