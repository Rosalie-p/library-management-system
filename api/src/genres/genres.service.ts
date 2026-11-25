import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateGenreDto } from './dto/create-genre.dto.js';
import { UpdateGenreDto } from './dto/update-genre.dto.js';

@Injectable()
export class GenresService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateGenreDto) {
    try {
      return await this.prisma.genre.create({ data: dto });
    } catch (e: any) {
      if (e?.code === 'P2002') {
        throw new ConflictException('A genre with that name already exists');
      }
      throw e;
    }
  }

  findAll() {
    return this.prisma.genre.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { books: true } } },
    });
  }

  async findOne(id: number) {
    const genre = await this.prisma.genre.findUnique({
      where: { id },
      include: { _count: { select: { books: true } } },
    });
    if (!genre) throw new NotFoundException(`Genre ${id} not found`);
    return genre;
  }

  async update(id: number, dto: UpdateGenreDto) {
    try {
      return await this.prisma.genre.update({ where: { id }, data: dto });
    } catch (e: any) {
      if (e?.code === 'P2025') {
        throw new NotFoundException(`Genre ${id} not found`);
      }
      if (e?.code === 'P2002') {
        throw new ConflictException('A genre with that name already exists');
      }
      throw e;
    }
  }

  async remove(id: number) {
    try {
      return await this.prisma.genre.delete({ where: { id } });
    } catch (e: any) {
      if (e?.code === 'P2025') {
        throw new NotFoundException(`Genre ${id} not found`);
      }
      if (e?.code === 'P2003') {
        throw new ConflictException(
          'Cannot delete a genre that still has books',
        );
      }
      throw e;
    }
  }
}