import {
    CanActivate,
    ExecutionContext,
    Injectable,
    Logger,
    UnauthorizedException,
  } from '@nestjs/common';
  import { TokenService } from '../token/token.service';
  import { Observable } from 'rxjs';
  
  @Injectable()
  export class TokenGuard implements CanActivate {

    private readonly logger = new Logger(TokenGuard.name);
    
    constructor(private readonly tokenService: TokenService) {}
  
    canActivate(
      context: ExecutionContext,
    ): boolean | Promise<boolean> | Observable<boolean> {
      const request = context.switchToHttp().getRequest();
      const token = request.cookies['access-token'];
  
      if (!token) {
        this.logger.warn('No token found in cookies');
        throw new UnauthorizedException('No token found in cookies');
      }

      try {
        const payload = this.tokenService.verifyToken(token);
        request.userId = payload.sub;
        return true;
      } catch (e) {
        this.logger.error('Invalid or expired token', e.stack);
        throw new UnauthorizedException('Invalid or expired token');
      }
    }
  }