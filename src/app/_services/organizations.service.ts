import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { Organization } from '../_models/organization';

import { HttpUtils } from '../_utils/http.utils';

@Injectable({
  providedIn: 'root',
})
export class OrganizationsService {

  apiResource: string = 'orgs';

  constructor(private http: HttpClient, private httpUtils: HttpUtils) {}

  getOrganizations(): Observable<Organization[]> {
    return this.http.get<Organization[]>(this.httpUtils.getTogoAPIUrl() + this.httpUtils.getAdminUrl() + this.apiResource).pipe(
      catchError((err) => { return throwError(() => err);  })
    );
  }

  getOrganization(id: number | string): Observable<Organization> {
    return this.http.get<Organization>(this.httpUtils.getTogoAPIUrl() + this.httpUtils.getAdminUrl() + this.apiResource + '/' + +id).pipe(
      catchError((err) => { return throwError(() => err);  })
    );
  }

  createOrganization(org: Organization): Observable<Organization> {
    return this.http.post<Organization>(this.httpUtils.getTogoAPIUrl() + this.httpUtils.getAdminUrl() + this.apiResource, org).pipe(
      catchError((err) => { return throwError(() => err);  })
    );
  }

  updateOrganization(org: Organization): Observable<any> {
    return this.http.put(this.httpUtils.getTogoAPIUrl() + this.httpUtils.getAdminUrl() + this.apiResource + '/' + org.id, org).pipe(
      catchError((err) => { return throwError(() => err);  })
    );
  }

  deleteOrganization(org: Organization | number): Observable<Organization> {
    const id = typeof org === 'number' ? org : org.id;
    return this.http.delete<Organization>(this.httpUtils.getTogoAPIUrl() + this.httpUtils.getAdminUrl() + this.apiResource + '/' + id).pipe(
      catchError((err) => { return throwError(() => err);  })
    );
  }
}
