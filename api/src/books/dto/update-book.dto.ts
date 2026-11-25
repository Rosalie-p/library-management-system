import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdateBookDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  author?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{10}(\d{3})?$/, {
    message: 'isbn must be 10 or 13 digits with no dashes',
  })
  isbn?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  totalCopies?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  genreId?: number;

  @IsOptional()
  @IsInt()
  @Min(1000)
  @Max(2100)
  publishedYear?: number;
}