import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { Job } from '../_models/job';

import { HttpUtils } from '../_utils/http.utils';

@Injectable({
  providedIn: 'root',
})
export class JobsService {

  apiResource: string = 'jobs';

  constructor(private http: HttpClient, private httpUtils: HttpUtils) {}

  getJobs(): Observable<Job[]> {
    return this.http.get<Job[]>(this.httpUtils.getTogoAPIUrl() + this.httpUtils.getAdminUrl() + this.apiResource).pipe(
      catchError((err) => { return throwError(err); })
    );
  }

  getJob(id: number | string): Observable<Job> {
    return this.http.get<Job>(this.httpUtils.getTogoAPIUrl() + this.httpUtils.getAdminUrl() + this.apiResource + '/' + +id).pipe(
      catchError((err) => { return throwError(err); })
    );
  }

  createJob(job: Job): Observable<Job> {
    return this.http.post<Job>(this.httpUtils.getTogoAPIUrl() + this.httpUtils.getAdminUrl() + this.apiResource, job).pipe(
      catchError((err) => { return throwError(err); })
    );
  }

  updateJob(job: Job): Observable<any> {
    return this.http.put(this.httpUtils.getTogoAPIUrl() + this.httpUtils.getAdminUrl() + this.apiResource + '/' + job.id, job).pipe(
      catchError((err) => { return throwError(err); })
    );
  }

  deleteJob(job: Job | number): Observable<Job> {
    const id = typeof job === 'number' ? job : job.id;
    return this.http.delete<Job>(this.httpUtils.getTogoAPIUrl() + this.httpUtils.getAdminUrl() + this.apiResource + '/' + id).pipe(
      catchError((err) => { return throwError(err); })
    );
  }
}
