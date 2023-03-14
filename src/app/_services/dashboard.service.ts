import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { HttpUtils } from '../_utils/http.utils';
import { Observable, throwError } from 'rxjs';
import { Dashboard } from '../_models/dashboard';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {

  apiResource: string = 'dashboards'

  constructor(private http: HttpClient, private httpUtils: HttpUtils) { }

  getDasboard(id: number | string): Observable<Dashboard> {
    return this.http.get<Dashboard>(this.httpUtils.getTogoAPIUrl() + this.httpUtils.getAdminUrl() + this.apiResource + '/' + id).pipe(
      catchError((err) => { return throwError(err); })
    );
  }

  getDashboards(): Observable<Dashboard[]> {
    return this.http.get<Dashboard[]>(this.httpUtils.getTogoAPIUrl() + this.httpUtils.getAdminUrl() + this.apiResource).pipe(
      catchError((err) => { return throwError(err); })
    );
  }

  createDashboard(dashboard: Dashboard): Observable<Dashboard> {
    return this.http.post<Dashboard>(this.httpUtils.getTogoAPIUrl() + this.httpUtils.getAdminUrl() + this.apiResource, dashboard).pipe(
      catchError((err) => { return throwError(err); })
    );
  }

  updateDashboard(id: number | string, dashboard: Dashboard): Observable<Dashboard> {
    return this.http.put<Dashboard>(this.httpUtils.getTogoAPIUrl() + this.httpUtils.getAdminUrl() + this.apiResource + `/${id}`, dashboard).pipe(
      catchError((err) => { return throwError(err); })
    );
  }

  deleteDashboard(id: number): Observable<Dashboard> {
    return this.http.delete<Dashboard>(this.httpUtils.getTogoAPIUrl() + this.httpUtils.getAdminUrl() + this.apiResource + `/${id}`).pipe(
      catchError((err) => { return throwError(err); })
    );
  }
}
