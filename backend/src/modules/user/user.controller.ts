import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserType } from 'src/types/create-user';
import { plainToInstance } from 'class-transformer';
import { UserType } from 'src/types/user';
import { TokenGuard } from '../auth/token.guard';
import { UserID } from 'src/decorators/user.decorator';

@Controller('user')
export class UserController {
    constructor(private readonly userService: UserService) { }

    @Post()
    async create(@Body() createUser: CreateUserType) {
        const user = await this.userService.create(createUser);
        return plainToInstance(UserType, user);
    }

    @Get('/me')
    @UseGuards(TokenGuard)
    async me(@UserID() userId: number) {
        const user = await this.userService.findOne(userId);
        return plainToInstance(UserType, user);
    }
}
