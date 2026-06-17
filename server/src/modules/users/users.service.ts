import { Injectable } from '@nestjs/common';
import PrismaService from '../../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly _prismaService: PrismaService) {}
  getUsers() {
    return this._prismaService.user.findMany();
  }
}
