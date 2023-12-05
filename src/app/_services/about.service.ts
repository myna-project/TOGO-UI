import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { About } from '../_models/about';

import { HttpUtils } from '../_utils/http.utils';

@Injectable({
  providedIn: 'root'
})
export class AboutService {

  apiResource = 'version';

  constructor(private http: HttpClient, private httpUtils: HttpUtils) { }

  getVersion(): Observable<About> {
    return this.http.get<About>(this.httpUtils.getTogoAPIUrl() + this.httpUtils.getAdminUrl() + this.apiResource).pipe(
      catchError((err) => throwError(() => err))
    );
  }
}
