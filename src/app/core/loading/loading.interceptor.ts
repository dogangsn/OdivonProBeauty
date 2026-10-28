import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs';
import { LoadingService } from './loading.service';

/** Translation files are tiny local assets; showing the bar for them only adds flicker. */
const SILENT_PATHS = ['/i18n/'];

export const loadingInterceptor: HttpInterceptorFn = (request, next) => {
  if (SILENT_PATHS.some((path) => request.url.includes(path))) return next(request);
  const loading = inject(LoadingService);
  loading.start();
  return next(request).pipe(finalize(() => loading.stop()));
};
