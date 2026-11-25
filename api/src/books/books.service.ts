import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateBookDto } from './dto/create-book.dto.js';
import { UpdateBookDto } from './dto/update-book.dto.js';

@Injectable()
export class BooksService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateBookDto) {
    try {
      return await this.prisma.book.create({
        data: dto,
        include: { genre: true },
      });
    } catch (e: any) {
      throw this.mapError(e);
    }
  }

  async findAll(params: {
    genreId?: number;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const page = params.page && params.page > 0 ? params.page : 1;
    const limit =
      params.limit && params.limit > 0 ? Math.min(params.limit, 100) : 10;

    const where: Prisma.BookWhereInput = {};

    if (params.genreId) {
      where.genreId = params.genreId;
    }

    if (params.search) {
      where.OR = [
        { title: { contains: params.search, mode: 'insensitive' } },
        { author: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.book.findMany({
        where,
        include: { genre: true },
        orderBy: { title: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.book.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: number) {
    const book = await this.prisma.book.findUnique({
      where: { id },
      include: { genre: true },
    });
    if (!book) throw new NotFoundException(`Book ${id} not found`);
    return book;
  }

  async update(id: number, dto: UpdateBookDto) {
    try {
      return await this.prisma.book.update({
        where: { id },
        data: dto,
        include: { genre: true },
      });
    } catch (e: any) {
      if (e?.code === 'P2025') {
        throw new NotFoundException(`Book ${id} not found`);
      }
      throw this.mapError(e);
    }
  }

  async remove(id: number) {
    try {
      return await this.prisma.book.delete({ where: { id } });
    } catch (e: any) {
      if (e?.code === 'P2025') {
        throw new NotFoundException(`Book ${id} not found`);
      }
      throw e;
    }
  }

  private mapError(e: any) {
    if (e?.code === 'P2002') {
      return new ConflictException('A book with that ISBN already exists');
    }
    if (e?.code === 'P2003') {
      return new NotFoundException('That genreId does not exist');
    }
    return e;
  }
}
