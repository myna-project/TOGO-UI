import { HttpClient, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { HttpUtils } from '../_utils/http.utils';

@Injectable({
  providedIn: 'root',
})
export class TokenService {

  constructor(private http: HttpClient, private httpUtils: HttpUtils) {}

  getToken(): Observable<HttpResponse<any>> {
    return this.http.get<Observable<HttpResponse<any>>>(this.httpUtils.getTogoAPIUrl() + 'token', {  observe: 'response' });
  }
}
