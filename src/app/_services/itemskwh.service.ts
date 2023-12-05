import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { InvoiceItem } from '../_models/invoiceitem';

import { HttpUtils } from '../_utils/http.utils';

@Injectable({
  providedIn: 'root'
})
export class ItemskWhService {

  apiResource: string = 'invoice_item_kwh';

  constructor(private http: HttpClient, private httpUtils: HttpUtils) {}

  getInvoiceItems(): Observable<InvoiceItem[]> {
    return this.http.get<InvoiceItem[]>(this.httpUtils.getTogoAPIUrl() + this.httpUtils.getAdminUrl() + this.apiResource).pipe(
      catchError((err) => { return throwError(() => err);  })
    );
  }

  getInvoiceItem(id: number | string): Observable<InvoiceItem> {
    return this.http.get<InvoiceItem>(this.httpUtils.getTogoAPIUrl() + this.httpUtils.getAdminUrl() + this.apiResource + '/' + +id).pipe(
      catchError((err) => { return throwError(() => err);  })
    );
  }

  createInvoiceItem(item: InvoiceItem): Observable<InvoiceItem> {
    return this.http.post<InvoiceItem>(this.httpUtils.getTogoAPIUrl() + this.httpUtils.getAdminUrl() + this.apiResource, item).pipe(
      catchError((err) => { return throwError(() => err);  })
    )
  }

  updateInvoiceItem(item: InvoiceItem): Observable<InvoiceItem> {
    return this.http.put<InvoiceItem>(this.httpUtils.getTogoAPIUrl() + this.httpUtils.getAdminUrl() + this.apiResource + '/' + item.id, item).pipe(
      catchError((err) => { return throwError(() => err);  })
    )
  }

  deleteInvoiceItem(item: InvoiceItem | number): Observable<InvoiceItem> {
    const id = typeof item === 'number' ? item : item.id;
    return this.http.delete<InvoiceItem>(this.httpUtils.getTogoAPIUrl() + this.httpUtils.getAdminUrl() + this.apiResource + '/' + +id).pipe(
      catchError((err) => { return throwError(() => err);  })
    )
  }
}
