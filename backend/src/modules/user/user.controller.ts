import { Body, Controller, Get, Post } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserType } from 'src/types/create-user';
import { plainToInstance } from 'class-transformer';
import { UserType } from 'src/types/user';

@Controller('user')
export class UserController {
    constructor(private readonly userService: UserService) { }

    @Post()
    async create(@Body() createUser: CreateUserType) {
        const user = await this.userService.create(createUser);
        return plainToInstance(UserType, user);
    }

    @Get('/me')
    async me(@Body() me: UserType) {
        const user = await this.userService.findOne(me.id);
        return plainToInstance(UserType, user);
    }
}
