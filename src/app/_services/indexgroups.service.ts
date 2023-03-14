import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { IndexGroup } from '../_models/indexgroup';

import { HttpUtils } from '../_utils/http.utils';

@Injectable({
  providedIn: 'root',
})
export class IndexGroupsService {

  apiResource: string = 'index_group';

  constructor(private http: HttpClient, private httpUtils: HttpUtils) {}

  getIndexGroups(): Observable<IndexGroup[]> {
    return this.http.get<IndexGroup[]>(this.httpUtils.getTogoAPIUrl() + this.httpUtils.getAdminUrl() + this.apiResource).pipe(
      catchError((err) => { return throwError(err); })
    );
  }

  getIndexGroup(id: number | string): Observable<IndexGroup> {
    return this.http.get<IndexGroup>(this.httpUtils.getTogoAPIUrl() + this.httpUtils.getAdminUrl() + this.apiResource + '/' + +id).pipe(
      catchError((err) => { return throwError(err); })
    );
  }

  createIndexGroup(group: IndexGroup): Observable<IndexGroup> {
    return this.http.post<IndexGroup>(this.httpUtils.getTogoAPIUrl() + this.httpUtils.getAdminUrl() + this.apiResource, group).pipe(
      catchError((err) => { return throwError(err); })
    );
  }

  updateIndexGroup(group: IndexGroup): Observable<any> {
    return this.http.put(this.httpUtils.getTogoAPIUrl() + this.httpUtils.getAdminUrl() + this.apiResource + '/' + group.id, group).pipe(
      catchError((err) => { return throwError(err); })
    );
  }

  deleteIndexGroup(group: IndexGroup | number): Observable<IndexGroup> {
    const id = typeof group === 'number' ? group : group.id;
    return this.http.delete<IndexGroup>(this.httpUtils.getTogoAPIUrl() + this.httpUtils.getAdminUrl() + this.apiResource + '/' + id).pipe(
      catchError((err) => { return throwError(err); })
    );
  }
}
