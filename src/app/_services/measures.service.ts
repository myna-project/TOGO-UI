import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { HttpUtils } from '../_utils/http.utils';

@Injectable({
  providedIn :  'root',
})
export class MeasuresService {

  apiResource: string = 'drains/measures';
  apiCostsResource: string = 'drains/costs';

  constructor(private http: HttpClient, private httpUtils: HttpUtils) {}

  getMeasures(drains: string, aggregations: string, operations: string, start_time: string, end_time: string, timeAggregation: string): Observable<any[]> {
    return this.http.get<any[][]>(this.httpUtils.getTogoAPIUrl() + this.httpUtils.getAdminUrl() + this.apiResource + '?ids%5B%5D=' + drains + '&measureAggregation%5B%5D=' + aggregations + '&operations%5B%5D=' + operations + '&start=' + start_time + '&end=' + end_time + '&timeAggregation=' + timeAggregation).pipe(
      catchError((err) => { return throwError(err); })
    );
  }

  getCosts(drain_cost_id: number, drains: string, aggregation: string, operations: string, start_time: string, end_time: string, timeAggregation: string): Observable<any[]> {
    return this.http.get<any[][]>(this.httpUtils.getTogoAPIUrl() + this.httpUtils.getAdminUrl() + this.apiCostsResource + '?drainCostId=' + drain_cost_id + '&ids%5B%5D=' + drains + '&measureAggregation=' + aggregation + '&operations%5B%5D=' + operations + '&start=' + start_time + '&end=' + end_time + '&timeAggregation=' + timeAggregation).pipe(
      catchError((err) => { return throwError(err); })
    );
  }

  updateMeasuresMatrix(measures: any): Observable<any> {
    return this.http.put(this.httpUtils.getTogoAPIUrl() + this.httpUtils.getAdminUrl() + 'measuresmatrix', measures).pipe(
      catchError((err) => { return throwError(err); })
    );
  }
}
