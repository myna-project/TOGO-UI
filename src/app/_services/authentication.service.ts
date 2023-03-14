import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';

import { User } from '../_models/user';

import { HttpUtils } from '../_utils/http.utils';

@Injectable({
  providedIn: 'root',
})
export class AuthenticationService {

  constructor(private http: HttpClient, private router: Router, private httpUtils: HttpUtils) {}

  public getCurrentUser(): User {
    let currentUser = <User>JSON.parse(localStorage.getItem('currentUser'));
    if (currentUser === null || currentUser === undefined) {
      return null;
    } else {
      if (currentUser.is_logged)
        return currentUser;
    }
    return null;
  }

  login(username: string, password: string): Observable<HttpResponse<any>> {
    const payload = new HttpParams()
      .set('username', username)
      .set('password', password);

    return this.http.post(this.httpUtils.getTogoAPIUrl() + 'authenticate', payload, { headers: { 'Content-Type': 'application/x-www-form-urlencoded' },  observe: 'response' });
  }

  logout() {
    localStorage.removeItem('currentUser');
    this.http.post(this.httpUtils.getTogoAPIUrl() + 'logout', null).pipe().subscribe();
    this.router.navigate(['/login']);
  }
}
