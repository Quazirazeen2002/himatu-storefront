import {
  Body,
  Controller,
  Get,
  Inject,
  Module,
  Patch,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiPropertyOptional, ApiTags } from "@nestjs/swagger";
import {
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  Matches,
  ValidateIf,
} from "class-validator";
import { Transform } from "class-transformer";
import { CurrentUser } from "../auth/roles";
import { AuthGuard } from "../auth/auth.guard";
import { UsersService } from "./users.service";
import type { UserProfile } from "../generated/prisma/client";
export class UpdateProfileDto {
  @ApiPropertyOptional()
  @ValidateIf((_o, value) => value !== undefined)
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  fullName?: string;
  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @Matches(/^(?:\+880|0)1[3-9]\d{8}$/)
  phone?: string | null;
}
@ApiTags("users")
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller("users")
export class UsersController {
  constructor(@Inject(UsersService) private readonly users: UsersService) {}
  @Get("me") me(@CurrentUser() user: UserProfile) {
    return user;
  }
  @Patch("me") update(
    @CurrentUser() user: UserProfile,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.users.update(user.id, dto);
  }
}
@Module({ controllers: [UsersController] })
export class UsersModule {}
