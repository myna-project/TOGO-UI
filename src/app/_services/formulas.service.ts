import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { Formula } from '../_models/formula';

import { HttpUtils } from '../_utils/http.utils';

@Injectable({
  providedIn :  'root',
})
export class FormulasService {

  apiResource: string = 'formula';

  constructor(private http: HttpClient, private httpUtils: HttpUtils) {}

  getFormulas(): Observable<Formula[]> {
    return this.http.get<Formula[]>(this.httpUtils.getTogoAPIUrl() + this.httpUtils.getAdminUrl() + this.apiResource).pipe(
      catchError((err) => { return throwError(() => err);  })
    );
  }

  getFormula(id: number | string): Observable<Formula> {
    return this.http.get<Formula>(this.httpUtils.getTogoAPIUrl() + this.httpUtils.getAdminUrl() + this.apiResource + '/' + +id).pipe(
      catchError((err) => { return throwError(() => err);  })
    );
  }

  createFormula(formula: Formula): Observable<Formula> {
    return this.http.post<Formula>(this.httpUtils.getTogoAPIUrl() + this.httpUtils.getAdminUrl() + this.apiResource, formula).pipe(
      catchError((err) => { return throwError(() => err);  })
    );
  }

  updateFormula(formula: Formula): Observable<any> {
    return this.http.put(this.httpUtils.getTogoAPIUrl() + this.httpUtils.getAdminUrl() + this.apiResource + '/' + formula.id, formula).pipe(
      catchError((err) => { return throwError(() => err);  })
    );
  }

  deleteFormula(formula: Formula | number): Observable<Formula> {
    const id = typeof formula === 'number' ? formula : formula.id;
    return this.http.delete<Formula>(this.httpUtils.getTogoAPIUrl() + this.httpUtils.getAdminUrl() + this.apiResource + '/' + id).pipe(
      catchError((err) => { return throwError(() => err);  })
    );
  }
}
