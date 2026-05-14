import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  DashboardOverview,
  DashboardMetrics,
  RevenueAnalytics,
  LogisticsPerformance,
  ComplianceScore,
} from '../models';

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private readonly base = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getDashboardOverview(): Observable<DashboardOverview> {
    return this.http.get<DashboardOverview>(`${this.base}/dashboard`);
  }

  getDashboardMetrics(): Observable<DashboardMetrics> {
    return this.http.get<DashboardMetrics>(`${this.base}/dashboard/metrics`);
  }

  getRevenue(): Observable<RevenueAnalytics> {
    return this.http.get<RevenueAnalytics>(`${this.base}/analytics/revenue`);
  }

  getLogisticsPerformance(): Observable<LogisticsPerformance> {
    return this.http.get<LogisticsPerformance>(`${this.base}/analytics/logistics-performance`);
  }

  getComplianceScore(): Observable<ComplianceScore> {
    return this.http.get<ComplianceScore>(`${this.base}/analytics/compliance-score`);
  }
}
