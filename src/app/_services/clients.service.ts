import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { Client } from '../_models/client';
import { Feed } from '../_models/feed';

import { HttpUtils } from '../_utils/http.utils';

@Injectable({
  providedIn: 'root',
})
export class ClientsService {

  apiResource: string = 'clients';
  apiTypeResource: string = 'client_types';

  constructor(private http: HttpClient, private httpUtils: HttpUtils) {}

  getClients(): Observable<Client[]> {
    return this.http.get<Client[]>(this.httpUtils.getTogoAPIUrl() + this.httpUtils.getAdminUrl() + this.apiResource).pipe(
      catchError((err) => { return throwError(() => err);  })
    );
  }

  getClient(id: number | string): Observable<Client> {
    return this.http.get<Client>(this.httpUtils.getTogoAPIUrl() + this.httpUtils.getAdminUrl() + this.apiResource + '/' + +id).pipe(
      catchError((err) => { return throwError(() => err);  })
    );
  }

  getClientImage(id: number | string): Observable<any> {
    return this.http.get<any>(this.httpUtils.getTogoAPIUrl() + this.httpUtils.getAdminUrl() + this.apiResource + '/' + +id + '/image').pipe(
      catchError((err) => { return throwError(() => err);  })
    );
  }

  createClient(client: Client): Observable<Client> {
    return this.http.post<Client>(this.httpUtils.getTogoAPIUrl() + this.httpUtils.getAdminUrl() + this.apiResource, client).pipe(
      catchError((err) => { return throwError(() => err);  })
    );
  }

  updateClient(client: Client): Observable<any> {
    return this.http.put(this.httpUtils.getTogoAPIUrl() + this.httpUtils.getAdminUrl() + this.apiResource + '/' + client.id, client).pipe(
      catchError((err) => { return throwError(() => err);  })
    );
  }

  deleteClient(client: Client | number): Observable<Client> {
    const id = typeof client === 'number' ? client : client.id;
    return this.http.delete<Client>(this.httpUtils.getTogoAPIUrl() + this.httpUtils.getAdminUrl() + this.apiResource + '/' + id).pipe(
      catchError((err) => { return throwError(() => err);  })
    );
  }

  getClientTypes(): Observable<string[]> {
    return this.http.get<string[]>(this.httpUtils.getTogoAPIUrl() + this.httpUtils.getAdminUrl() + this.apiTypeResource).pipe(
      catchError((err) => { return throwError(() => err);  })
    );
  }

  getFeedsForClient(client: Client | number): Observable<Feed[]> {
    const id = typeof client === 'number' ? client : client.id;
    return this.http.get<Feed[]>(this.httpUtils.getTogoAPIUrl() + this.httpUtils.getAdminUrl() + this.apiResource + '/' + id + '/feeds').pipe(
      catchError((err) => { return throwError(() => err);  })
    );
  }
}
