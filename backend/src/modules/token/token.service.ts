import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { addHours } from 'date-fns';

@Injectable()
export class TokenService {
  constructor(private readonly jwtService: JwtService) { }

  createToken(userId: number): string {

    return this.jwtService.sign({ sub: userId }, { expiresIn: '5400' });
  }

  verifyToken(token: string): { sub: number } {
    return this.jwtService.verify(token);
  }
}
