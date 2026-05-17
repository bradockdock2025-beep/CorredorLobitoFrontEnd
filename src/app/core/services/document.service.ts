import { Injectable } from '@angular/core';
import { HttpClient, HttpEventType, HttpParams, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Document, DocumentEntityType, DocumentType } from '../models';

export interface UploadProgress {
  type: 'progress' | 'done';
  percent?: number;
  document?: Document;
}

@Injectable({ providedIn: 'root' })
export class DocumentService {
  private readonly base = `${environment.apiUrl}/documents`;

  constructor(private http: HttpClient) {}

  getByEntity(entityType: DocumentEntityType, entityId: string): Observable<Document[]> {
    const params = new HttpParams()
      .set('entityType', entityType)
      .set('entityId', entityId);
    return this.http.get<Document[]>(this.base, { params });
  }

  upload(
    file: File,
    entityType: DocumentEntityType,
    entityId: string,
    type: DocumentType,
    name: string,
  ): Observable<UploadProgress> {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('entityType', entityType);
    fd.append('entityId', entityId);
    fd.append('type', type);
    fd.append('name', name);

    const req = new HttpRequest('POST', `${this.base}/upload`, fd, {
      reportProgress: true,
    });

    return this.http.request<Document>(req).pipe(
      filter((e) => e.type === HttpEventType.UploadProgress || e.type === HttpEventType.Response),
      map((e) => {
        if (e.type === HttpEventType.UploadProgress) {
          const percent = e.total ? Math.round((e.loaded * 100) / e.total) : 0;
          return { type: 'progress' as const, percent };
        }
        if (e.type === HttpEventType.Response) {
          return { type: 'done' as const, document: e.body! };
        }
        return { type: 'progress' as const, percent: 0 };
      }),
    );
  }

  download(id: string): Observable<{ signedUrl: string; fileName: string; expiresIn: number }> {
    return this.http.get<{ signedUrl: string; fileName: string; expiresIn: number }>(
      `${this.base}/${id}/download`,
    );
  }

  delete(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.base}/${id}`);
  }

  accept(id: string): Observable<Document> {
    return this.http.post<Document>(`${this.base}/${id}/accept`, {});
  }

  reject(id: string, reason: string): Observable<Document> {
    return this.http.post<Document>(`${this.base}/${id}/reject`, { reason });
  }
}
