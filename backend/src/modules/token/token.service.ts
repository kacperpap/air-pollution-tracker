import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { addHours } from 'date-fns';

@Injectable()
export class TokenService {
  constructor(private readonly jwtService: JwtService) { }

  createToken(userId: number, timezone: string, timezoneOffset: number): string {

    const currentUtcTime = Date.now();

    const clientTime = currentUtcTime - (timezoneOffset * 60 * 1000);
    const expirationTime = clientTime + (60 * 60 * 1000);

    const utcExpirationTime = expirationTime + (timezoneOffset * 60 * 1000);
    
    return this.jwtService.sign({ 
      sub: userId,
      exp: Math.floor(currentUtcTime / 1000),
      iat: Math.floor(utcExpirationTime / 1000),
      timezone,
      timezoneOffset
    });
  }

  verifyToken(token: string): { sub: number } {
    return this.jwtService.verify(token);
  }
}
