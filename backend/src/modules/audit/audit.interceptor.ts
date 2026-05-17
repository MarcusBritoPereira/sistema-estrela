import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  HttpException,
} from '@nestjs/common';
import { Observable, catchError, tap, throwError } from 'rxjs';
import { AuditService } from './audit.service';
import { AuthenticatedRequest } from '../../common/guards/jwt-auth.guard';

interface ResponseWithStatus {
  statusCode?: number;
}

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const response = context.switchToHttp().getResponse<ResponseWithStatus>();
    const startedAt = Date.now();

    return next.handle().pipe(
      tap(() => {
        void this.auditService.record({
          action: 'http.request',
          userId: request.user?.sub,
          userEmail: request.user?.email,
          userRole: request.user?.role,
          method: request.method,
          path: request.originalUrl || request.url,
          statusCode: response.statusCode,
          durationMs: Date.now() - startedAt,
        });
      }),
      catchError((error: unknown) => {
        const statusCode = this.resolveErrorStatus(error);
        void this.auditService.record({
          action: 'http.request.error',
          userId: request.user?.sub,
          userEmail: request.user?.email,
          userRole: request.user?.role,
          method: request.method,
          path: request.originalUrl || request.url,
          statusCode,
          durationMs: Date.now() - startedAt,
        });
        return throwError(() => error);
      }),
    );
  }

  private resolveErrorStatus(error: unknown): number {
    if (error instanceof HttpException) {
      return error.getStatus();
    }

    return 500;
  }
}
