import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { Drain } from '../_models/drain';
import { Feed } from '../_models/feed';

import { HttpUtils } from '../_utils/http.utils';

@Injectable({
  providedIn: 'root',
})
export class FeedsService {

  apiResource: string = 'feeds';

  constructor(private http: HttpClient, private httpUtils: HttpUtils) {}

  getFeeds(): Observable<Feed[]> {
    return this.http.get<Feed[]>(this.httpUtils.getTogoAPIUrl() + this.httpUtils.getAdminUrl() + this.apiResource).pipe(
      catchError((err) => { return throwError(() => err);  })
    );
  }

  getFeed(id: number | string): Observable<Feed> {
    return this.http.get<Feed>(this.httpUtils.getTogoAPIUrl() + this.httpUtils.getAdminUrl() + this.apiResource + '/' + +id).pipe(
      catchError((err) => { return throwError(() => err);  })
    );
  }

  createFeed(feed: Feed): Observable<Feed> {
    return this.http.post<Feed>(this.httpUtils.getTogoAPIUrl() + this.httpUtils.getAdminUrl() + this.apiResource, feed).pipe(
      catchError((err) => { return throwError(() => err);  })
    );
  }

  updateFeed(feed: Feed): Observable<any> {
    return this.http.put(this.httpUtils.getTogoAPIUrl() + this.httpUtils.getAdminUrl() + this.apiResource + '/' + feed.id, feed).pipe(
      catchError((err) => { return throwError(() => err);  })
    );
  }

  deleteFeed(feed: Feed | number): Observable<Feed> {
    const id = typeof feed === 'number' ? feed : feed.id;
    return this.http.delete<Feed>(this.httpUtils.getTogoAPIUrl() + this.httpUtils.getAdminUrl() + this.apiResource + '/' + id).pipe(
      catchError((err) => { return throwError(() => err);  })
    );
  }

  getDrainsForFeed(feed: Feed | number): Observable<Drain[]> {
    const id = typeof feed === 'number' ? feed : feed.id;
    return this.http.get<Drain[]>(this.httpUtils.getTogoAPIUrl() + this.httpUtils.getAdminUrl() + this.apiResource + '/' + id + '/drains').pipe(
      catchError((err) => { return throwError(() => err);  })
    );
  }
}
