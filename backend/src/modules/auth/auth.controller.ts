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
    @Body() body: { timezone: string, timezoneOffset: number }
  ) {

    const { timezone, timezoneOffset } = body;

    const token = this.tokenService.createToken(userId, timezone, timezoneOffset);

    const expiresIn = 60 * 60 * 1000;
    const expirationDate = new Date(Date.now() + expiresIn);

    res.cookie('access-token', token, {
      httpOnly: true,
      sameSite: 'lax',
      expires: expirationDate,
    });
    res.cookie('is-logged', true, {
      sameSite: 'lax',
      expires: expirationDate,
    });
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('access-token');
    res.clearCookie('is-logged');
  }
}
