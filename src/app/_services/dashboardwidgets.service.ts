import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { DashboardWidget } from '../_models/dashboardwidget';

import { HttpUtils } from '../_utils/http.utils';

@Injectable({
  providedIn :  'root',
})
export class DashboardWidgetsService {

  apiResource: string = 'dashboard_widgets';

  constructor(private http: HttpClient, private httpUtils: HttpUtils) {}

  getDashboardWidgets(dashboardId: number | string): Observable<DashboardWidget[]> {
    return this.http.get<DashboardWidget[]>(this.httpUtils.getTogoAPIUrl() + this.httpUtils.getAdminUrl() + 'dashboard/' + dashboardId + '/' + this.apiResource).pipe(
      catchError((err) => { return throwError(err); })
    );
  }

  getDashboardWidget(id: number | string, dashboardId: number): Observable<DashboardWidget> {
    return this.http.get<DashboardWidget>(this.httpUtils.getTogoAPIUrl() + this.httpUtils.getAdminUrl()+ 'dashboard/' + dashboardId + '/' + this.apiResource + '/' + +id).pipe(
      catchError((err) => { return throwError(err); })
    );
  }

  createDashboardWidget(widget: DashboardWidget, dashboardId: number): Observable<DashboardWidget> {
    return this.http.post<DashboardWidget>(this.httpUtils.getTogoAPIUrl() + this.httpUtils.getAdminUrl() + 'dashboard/' + dashboardId + '/' + this.apiResource, widget).pipe(
      catchError((err) => { return throwError(err); })
    );
  }

  updateDashboardWidget(widget: DashboardWidget, dashboardId: number): Observable<any> {
    return this.http.put(this.httpUtils.getTogoAPIUrl() + this.httpUtils.getAdminUrl() + 'dashboard/' + dashboardId + '/' + this.apiResource + '/' + widget.id, widget).pipe(
      catchError((err) => { return throwError(err); })
    );
  }

  deleteDashboardWidget(widget: DashboardWidget | number, dashboardId: number): Observable<DashboardWidget> {
    const id = typeof widget === 'number' ? widget : widget.id;
    return this.http.delete<DashboardWidget>(this.httpUtils.getTogoAPIUrl() + this.httpUtils.getAdminUrl() + 'dashboard/' + dashboardId + '/' + this.apiResource + '/' + id).pipe(
      catchError((err) => { return throwError(err); })
    );
  }
}
