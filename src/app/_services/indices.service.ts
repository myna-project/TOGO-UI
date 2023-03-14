import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { Index } from '../_models/index';

import { HttpUtils } from '../_utils/http.utils';

@Injectable({
  providedIn: 'root',
})
export class IndicesService {

  apiResource: string = 'index';

  constructor(private http: HttpClient, private httpUtils: HttpUtils) {}

  getIndices(): Observable<Index[]> {
    return this.http.get<Index[]>(this.httpUtils.getTogoAPIUrl() + this.httpUtils.getAdminUrl() + this.apiResource).pipe(
      catchError((err) => { return throwError(err); })
    );
  }

  getIndex(id: number | string): Observable<Index> {
    return this.http.get<Index>(this.httpUtils.getTogoAPIUrl() + this.httpUtils.getAdminUrl() + this.apiResource + '/' + +id).pipe(
      catchError((err) => { return throwError(err); })
    );
  }

  createIndex(index: Index): Observable<Index> {
    return this.http.post<Index>(this.httpUtils.getTogoAPIUrl() + this.httpUtils.getAdminUrl() + this.apiResource, index).pipe(
      catchError((err) => { return throwError(err); })
    );
  }

  updateIndex(index: Index): Observable<any> {
    return this.http.put(this.httpUtils.getTogoAPIUrl() + this.httpUtils.getAdminUrl() + this.apiResource + '/' + index.id, index).pipe(
      catchError((err) => { return throwError(err); })
    );
  }

  deleteIndex(index: Index | number): Observable<Index> {
    const id = typeof index === 'number' ? index : index.id;
    return this.http.delete<Index>(this.httpUtils.getTogoAPIUrl() + this.httpUtils.getAdminUrl() + this.apiResource + '/' + id).pipe(
      catchError((err) => { return throwError(err); })
    );
  }

  calculateIndex(index: Index | number, start_time: string, end_time: string): Observable<Index> {
    const id = typeof index === 'number' ? index : index.id;
    return this.http.get<Index>(this.httpUtils.getTogoAPIUrl() + this.httpUtils.getAdminUrl() + this.apiResource + '/' + id + '/calculate?start=' + start_time + '&end=' + end_time).pipe(
      catchError((err) => { return throwError(err); })
    );
  }

  calculateLastIndex(index: Index | number, timeAggregation: string, nTimes: number): Observable<Index> {
    const id = typeof index === 'number' ? index : index.id;
    return this.http.get<Index>(this.httpUtils.getTogoAPIUrl() + this.httpUtils.getAdminUrl() + this.apiResource + '/' + id + '/calculatelast?timeAggregation=' + timeAggregation + '&nTimes=' + nTimes).pipe(
      catchError((err) => { return throwError(err); })
    );
  }
}
