import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { ClientCategory } from '../_models/clientcategory';

import { HttpUtils } from '../_utils/http.utils';

@Injectable({
  providedIn: 'root',
})
export class ClientCategoriesService {

  apiResource: string = 'client_categories';

  constructor(private http: HttpClient, private httpUtils: HttpUtils) {}

  getClientCategories(): Observable<ClientCategory[]> {
    return this.http.get<ClientCategory[]>(this.httpUtils.getTogoAPIUrl() + this.httpUtils.getAdminUrl() + this.apiResource).pipe(
      catchError((err) => { return throwError(err); })
    );
  }

  getClientCategory(id: number | string): Observable<ClientCategory> {
    return this.http.get<ClientCategory>(this.httpUtils.getTogoAPIUrl() + this.httpUtils.getAdminUrl() + this.apiResource + '/' + +id).pipe(
      catchError((err) => { return throwError(err); })
    );
  }

  createClientCategory(category: ClientCategory): Observable<ClientCategory> {
    return this.http.post<ClientCategory>(this.httpUtils.getTogoAPIUrl() + this.httpUtils.getAdminUrl() + this.apiResource, category).pipe(
      catchError((err) => { return throwError(err); })
    );
  }

  updateClientCategory(category: ClientCategory): Observable<any> {
    return this.http.put(this.httpUtils.getTogoAPIUrl() + this.httpUtils.getAdminUrl() + this.apiResource + '/' + category.id, category).pipe(
      catchError((err) => { return throwError(err); })
    );
  }

  deleteClientCategory(category: ClientCategory | number): Observable<ClientCategory> {
    const id = typeof category === 'number' ? category : category.id;
    return this.http.delete<ClientCategory>(this.httpUtils.getTogoAPIUrl() + this.httpUtils.getAdminUrl() + this.apiResource + '/' + id).pipe(
      catchError((err) => { return throwError(err); })
    );
  }
}
