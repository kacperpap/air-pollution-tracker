import { Body, Controller, HttpCode, HttpStatus, Post, Res, UseGuards } from '@nestjs/common';
import { UserID } from 'src/decorators/user.decorator';
import { TokenService } from '../token/token.service';
import { BasicGuard } from './basic.guard';
import { Response } from 'express';


@Controller('auth')
export class AuthController {
  constructor(private readonly tokenService: TokenService) { }

  @Post('login')
  @UseGuards(BasicGuard)
  @HttpCode(HttpStatus.OK)
  login(
    @UserID() userId: number,
    @Res({ passthrough: true }) res: Response,
  ) {

    const token = this.tokenService.createToken(userId);

    res.cookie('access-token', token, {
      httpOnly: true,
      domain: undefined,
      sameSite: process.env.SECURE === 'true' ? 'none' : 'lax',
      secure: process.env.SECURE === 'true' ? true : false,
      expires: new Date(Date.now() + 90 * 60 * 1000),
    });
    res.cookie('is-logged', true, {
      domain: undefined,
      sameSite: process.env.SECURE === 'true' ? 'none' : 'lax',
      secure: process.env.SECURE === 'true' ? true : false,
      expires: new Date(Date.now() + 90 * 60 * 1000),
    });
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('access-token');
    res.clearCookie('is-logged');
  }
}
