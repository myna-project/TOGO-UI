import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { Drain } from '../_models/drain';

import { HttpUtils } from '../_utils/http.utils';

@Injectable({
  providedIn :  'root',
})
export class DrainsService {

  apiResource: string = 'drains';

  constructor(private http: HttpClient, private httpUtils: HttpUtils) {}

  getDrains(): Observable<Drain[]> {
    return this.http.get<Drain[]>(this.httpUtils.getTogoAPIUrl() + this.httpUtils.getAdminUrl() + this.apiResource).pipe(
      catchError((err) => { return throwError(() => err);  })
    );
  }

  getDrain(id: number | string): Observable<Drain> {
    return this.http.get<Drain>(this.httpUtils.getTogoAPIUrl() + this.httpUtils.getAdminUrl() + this.apiResource + '/' + +id).pipe(
      catchError((err) => { return throwError(() => err);  })
    );
  }

  createDrain(drain: Drain): Observable<Drain> {
    return this.http.post<Drain>(this.httpUtils.getTogoAPIUrl() + this.httpUtils.getAdminUrl() + this.apiResource, drain).pipe(
      catchError((err) => { return throwError(() => err);  })
    );
  }

  updateDrain(drain: Drain): Observable<any> {
    return this.http.put(this.httpUtils.getTogoAPIUrl() + this.httpUtils.getAdminUrl() + this.apiResource + '/' + drain.id, drain).pipe(
      catchError((err) => { return throwError(() => err);  })
    );
  }

  deleteDrain(drain: Drain | number): Observable<Drain> {
    const id = typeof drain === 'number' ? drain : drain.id;
    return this.http.delete<Drain>(this.httpUtils.getTogoAPIUrl() + this.httpUtils.getAdminUrl() + this.apiResource + '/' + id).pipe(
      catchError((err) => { return throwError(() => err);  })
    );
  }
}
