import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { Vendor } from '../_models/vendor';

import { HttpUtils } from '../_utils/http.utils';

@Injectable({
  providedIn: 'root'
})
export class VendorsService {

  apiResource: string = 'vendors';

  constructor(private http: HttpClient, private httpUtils: HttpUtils) {}

  getVendors(): Observable<Vendor[]> {
    return this.http.get<Vendor[]>(this.httpUtils.getTogoAPIUrl() + this.httpUtils.getAdminUrl() + this.apiResource).pipe(
      catchError((err) => { return throwError(() => err);  })
    )
  }

  getVendor(id: number | string): Observable<Vendor> {
    return this.http.get<Vendor>(this.httpUtils.getTogoAPIUrl() + this.httpUtils.getAdminUrl() + this.apiResource + '/' + +id).pipe(
      catchError((err) => { return throwError(() => err);  })
    )
  }

  createVendor(vendor: Vendor): Observable<Vendor> {
    return this.http.post<Vendor>(this.httpUtils.getTogoAPIUrl() + this.httpUtils.getAdminUrl() + this.apiResource, vendor).pipe(
      catchError((err) => { return throwError(() => err);  })
    )
  }

  updateVendor(vendor: Vendor): Observable<Vendor> {
    return this.http.put<Vendor>(this.httpUtils.getTogoAPIUrl() + this.httpUtils.getAdminUrl() + this.apiResource + '/' + vendor.id, vendor).pipe(
      catchError((err) => { return throwError(() => err);  })
    )
  }

  deleteVendor(vendor: Vendor | number): Observable<Vendor> {
    const id = typeof vendor === 'number' ? vendor : vendor.id;
    return this.http.delete<Vendor>(this.httpUtils.getTogoAPIUrl() + this.httpUtils.getAdminUrl() + this.apiResource + '/' + id).pipe(
      catchError((err) => { return throwError(() => err);  })
    )
  }
}
