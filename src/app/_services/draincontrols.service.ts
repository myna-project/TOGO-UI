import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { DrainControl } from '../_models/draincontrol';

import { HttpUtils } from '../_utils/http.utils';

@Injectable({
  providedIn :  'root',
})
export class DrainControlsService {

  apiResource: string = 'drain_controls';

  constructor(private http: HttpClient, private httpUtils: HttpUtils) {}

  getDrainControls(): Observable<DrainControl[]> {
    return this.http.get<DrainControl[]>(this.httpUtils.getTogoAPIUrl() + this.httpUtils.getAdminUrl() + this.apiResource).pipe(
      catchError((err) => { return throwError(err); })
    );
  }

  getDrainControl(id: number | string): Observable<DrainControl> {
    return this.http.get<DrainControl>(this.httpUtils.getTogoAPIUrl() + this.httpUtils.getAdminUrl() + this.apiResource + '/' + +id).pipe(
      catchError((err) => { return throwError(err); })
    );
  }

  createDrainControl(control: DrainControl): Observable<DrainControl> {
    return this.http.post<DrainControl>(this.httpUtils.getTogoAPIUrl() + this.httpUtils.getAdminUrl() + this.apiResource, control).pipe(
      catchError((err) => { return throwError(err); })
    );
  }

  updateDrainControl(control: DrainControl): Observable<any> {
    return this.http.put(this.httpUtils.getTogoAPIUrl() + this.httpUtils.getAdminUrl() + this.apiResource + '/' + control.id, control).pipe(
      catchError((err) => { return throwError(err); })
    );
  }

  deleteDrainControl(control: DrainControl | number): Observable<DrainControl> {
    const id = typeof control === 'number' ? control : control.id;
    return this.http.delete<DrainControl>(this.httpUtils.getTogoAPIUrl() + this.httpUtils.getAdminUrl() + this.apiResource + '/' + id).pipe(
      catchError((err) => { return throwError(err); })
    );
  }
}
