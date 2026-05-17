import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PdfDownloadResponse } from '../models';

@Injectable({ providedIn: 'root' })
export class PdfService {
  private readonly api = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getLicensePdf(companyId: string): Observable<PdfDownloadResponse> {
    return this.http.get<PdfDownloadResponse>(`${this.api}/companies/${companyId}/license-pdf`);
  }

  getInvoicePdf(orderId: string): Observable<PdfDownloadResponse> {
    return this.http.get<PdfDownloadResponse>(`${this.api}/orders/${orderId}/invoice-pdf`);
  }

  getReceiptPdf(orderId: string): Observable<PdfDownloadResponse> {
    return this.http.get<PdfDownloadResponse>(`${this.api}/orders/${orderId}/receipt-pdf`);
  }

  getDispatchPdf(shipmentId: string): Observable<PdfDownloadResponse> {
    return this.http.get<PdfDownloadResponse>(`${this.api}/shipments/${shipmentId}/dispatch-pdf`);
  }

  openPdf(response: PdfDownloadResponse): void {
    window.open(response.signedUrl, '_blank');
  }

  downloadPdf(response: PdfDownloadResponse): void {
    const a = document.createElement('a');
    a.href = response.signedUrl;
    a.download = response.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}
