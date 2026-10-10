import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Service, inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiSuccess, BeautyRecord } from './beauty.model';

export interface ListQuery {
  branchId?: string;
  search?: string;
  status?: string;
  from?: string;
  to?: string;
  cursor?: string;
  limit?: number;
}

@Service()
export class ApiClient {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl.replace(/\/$/, '')}/beauty`;

  list<T extends BeautyRecord>(resource: string, query: ListQuery = {}) {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== '') params = params.set(key, String(value));
    }
    return this.http
      .get<ApiSuccess<T[]>>(`${this.baseUrl}/${resource}`, { params })
      .pipe(catchError((error: HttpErrorResponse) => throwError(() => this.message(error))));
  }

  get<T>(resource: string, id: string) {
    return this.http.get<ApiSuccess<T>>(`${this.baseUrl}/${resource}/${id}`);
  }

  create<T>(resource: string, body: unknown) {
    return this.http.post<ApiSuccess<T>>(`${this.baseUrl}/${resource}`, body);
  }

  update<T>(resource: string, id: string, body: unknown) {
    return this.http.patch<ApiSuccess<T>>(`${this.baseUrl}/${resource}/${id}`, body);
  }

  remove(resource: string, id: string) {
    return this.http.delete<ApiSuccess<{ id: string }>>(`${this.baseUrl}/${resource}/${id}`);
  }

  private message(error: HttpErrorResponse): Error {
    const body = error.error as { message?: string } | undefined;
    return new Error(body?.message ?? 'MainApi istegi tamamlanamadi.');
  }
}
