import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { User } from '../_models/user';

import { HttpUtils } from '../_utils/http.utils';

@Injectable({
  providedIn: 'root',
})
export class UsersService {

  apiResource: string = 'users';

  constructor(private http: HttpClient, private httpUtils: HttpUtils) {}

  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(this.httpUtils.getTogoAPIUrl() + this.httpUtils.getAdminUrl() + this.apiResource).pipe(
      catchError((err) => { return throwError(err); })
    );
  }

  getUsersByUsername(username: string): Observable<User[]> {
    return this.http.get<User[]>(this.httpUtils.getTogoAPIUrl() + this.httpUtils.getAdminUrl() + this.apiResource + '?username=' + username).pipe(
      catchError((err) => { return throwError(err); })
    );
  }

  getUser(id: number | string): Observable<User> {
    return this.http.get<User>(this.httpUtils.getTogoAPIUrl() + this.httpUtils.getAdminUrl() + this.apiResource + '/' + +id).pipe(
      catchError((err) => { return throwError(err); })
    );
  }

  createUser(user: User): Observable<User> {
    return this.http.post<User>(this.httpUtils.getTogoAPIUrl() + this.httpUtils.getAdminUrl() + this.apiResource, user).pipe(
      catchError((err) => { return throwError(err); })
    );
  }

  updateUser(user: User): Observable<any> {
    return this.http.put(this.httpUtils.getTogoAPIUrl() + this.httpUtils.getAdminUrl() + this.apiResource + '/' + user.id, user).pipe(
      catchError((err) => { return throwError(err); })
    );
  }

  deleteUser(user: User | number): Observable<User> {
    const id = typeof user === 'number' ? user : user.id;
    return this.http.delete<User>(this.httpUtils.getTogoAPIUrl() + this.httpUtils.getAdminUrl() + this.apiResource + '/' + id).pipe(
      catchError((err) => { return throwError(err); })
    );
  }

  addJobToUser(user_id: number, job_id: number): Observable<any> {
    return this.http.put(this.httpUtils.getTogoAPIUrl() + this.httpUtils.getAdminUrl() + this.apiResource + '/' + user_id + '/jobs/' + job_id, null).pipe(
      catchError((err) => { return throwError(err); })
    );
  }

  removeJobFromUser(user_id: number, job_id: number): Observable<any> {
    return this.http.delete<any>(this.httpUtils.getTogoAPIUrl() + this.httpUtils.getAdminUrl() + this.apiResource + '/' + user_id + '/jobs/' + job_id).pipe(
      catchError((err) => { return throwError(err); })
    );
  }
}
