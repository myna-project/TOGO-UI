import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AccountingDataComponent } from './accountingdata/accountingdata.component';
import { AboutComponent } from './about/about.component';
import { ClientCategoriesComponent } from './clientcategories/clientcategories-list/clientcategories-list.component';
import { ClientCategoryComponent } from './clientcategories/clientcategory-detail/clientcategory-detail.component';
import { ClientComponent } from './clients/client-detail/client-detail.component';
import { ClientsComponent } from './clients/clients-list/clients-list.component';
import { CostsComponent } from './costs/costs.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { DashboardDetailComponent } from './dashboard/dashboard-detail/dashboard-detail.component';
import { DashboardWidgetComponent } from './dashboardwidget/dashboardwidget.component';
import { DrainComponent } from './drains/drain-detail/drain-detail.component';
import { DrainControlComponent } from './draincontrols/draincontrol-detail/draincontrol-detail.component';
import { DrainControlsComponent } from './draincontrols/draincontrols-list/draincontrols-list.component';
import { DrainsComponent } from './drains/drains-list/drains-list.component';
import { FeedComponent } from './feeds/feed-detail/feed-detail.component';
import { IndexComponent } from './indices/index-detail/index-detail.component';
import { IndexGroupComponent } from './indices/indexgroup-detail/indexgroup-detail.component';
import { IndicesComponent } from './indices/indices-list/indices-list.component';
import { ItemkwhComponent } from './itemkwh/itemkhw-detail/itemkwh-detail.component';
import { ItemskwhComponent } from './itemkwh/itemkwh-list/itemkwh-list.component';
import { JobComponent } from './jobs/job-detail/job-detail.component';
import { JobsComponent } from './jobs/jobs-list/jobs-list.component';
import { LoginComponent } from './login/login.component';
import { MeasuresComponent } from './measures/measures.component';
import { OrganizationsComponent } from './organizations/organizations-list/organizations-list.component';
import { OrganizationComponent } from './organizations/organization-detail/organization-detail.component';
import { ProfileComponent } from './profile/profile.component';
import { SynopticDashboardComponent } from './synopticdashboard/synopticdashboard.component';
import { UsersComponent } from './users/users-list/users-list.component';
import { UserComponent } from './users/user-detail/user-detail.component';
import { UserJobsComponent } from './users/user-jobs/user-jobs.component';
import { VendorListComponent } from './vendors/vendors-list/vendor-list.component';
import { VendorDetailComponent } from './vendors/vendor-detail/vendor-detail.component';

import { AdminAuthGuard } from './_guards/admin-auth.guard';
import { AuthGuard } from './_guards/auth.guard';

const routes: Routes = [
  {
    path: '',
    component: LoginComponent
  },
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: 'profile',
    component: ProfileComponent
  },
  {
    path: 'dashboard/:id',
    component: DashboardComponent,
    canActivate: [ AuthGuard ]
  },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [ AuthGuard ]
  },
  {
    path: 'dashboarddetail/:id',
    component: DashboardDetailComponent,
    canActivate: [ AuthGuard ]
  },
  {
    path: 'dashboarddetail',
    component: DashboardDetailComponent,
    canActivate: [ AuthGuard ]
  },
  {
    path: ':dashboardId/dashboardwidget/:id',
    component: DashboardWidgetComponent,
    canActivate: [ AuthGuard ]
  },
  {
    path: ':dashboardId/dashboardwidget',
    component: DashboardWidgetComponent,
    canActivate: [ AuthGuard ]
  },
  {
    path: 'synopticdashboard',
    component: SynopticDashboardComponent,
    canActivate: [ AuthGuard ]
  },
  {
    path: 'accountingdata',
    component: AccountingDataComponent,
    canActivate: [ AuthGuard ]
  },
  {
    path: 'about',
    component: AboutComponent,
    canActivate:  [ AuthGuard ]
  },
  {
    path: 'clientcategories',
    component: ClientCategoriesComponent,
    canActivate: [ AdminAuthGuard ]
  },
  {
    path: 'clientcategory/:id',
    component: ClientCategoryComponent,
    canActivate: [ AdminAuthGuard ]
  },
  {
    path: 'clientcategory',
    component: ClientCategoryComponent,
    canActivate: [ AdminAuthGuard ]
  },
  {
    path: 'clients',
    component: OrganizationsComponent,
    canActivate: [ AuthGuard ]
  },
  {
    path: 'client',
    component: ClientComponent,
    canActivate: [ AuthGuard ]
  },
  {
    path: 'costs',
    component: CostsComponent,
    canActivate: [ AuthGuard ]
  },
  {
    path: 'draincontrols',
    component: DrainControlsComponent,
    canActivate: [ AuthGuard ]
  },
  {
    path: 'draincontrol/:id',
    component: DrainControlComponent,
    canActivate: [ AuthGuard ]
  },
  {
    path: 'draincontrol',
    component: DrainControlComponent,
    canActivate: [ AuthGuard ]
  },
  {
    path: 'indices',
    component: IndicesComponent,
    canActivate: [ AuthGuard ]
  },
  {
    path: 'indexgroup/:id',
    component: IndexGroupComponent,
    canActivate: [ AuthGuard ]
  },
  {
    path: 'indexgroup',
    component: IndexGroupComponent,
    canActivate: [ AuthGuard ]
  },
  {
    path: 'index/:id',
    component: IndexComponent,
    canActivate: [ AuthGuard ]
  },
  {
    path: 'index',
    component: IndexComponent,
    canActivate: [ AuthGuard ]
  },
  {
    path: 'itemskwh',
    component: ItemskwhComponent,
    canActivate: [ AdminAuthGuard ]
  },
  {
    path: 'itemkwh',
    component: ItemkwhComponent,
    canActivate: [ AdminAuthGuard ]
  },
  {
    path: 'itemkwh/:id',
    component: ItemkwhComponent,
    canActivate: [ AdminAuthGuard ]
  },
  {
    path: 'itemkwh/:id/:operation',
    component: ItemkwhComponent,
    canActivate: [ AdminAuthGuard ]
  },
  {
    path: 'jobs',
    component: JobsComponent,
    canActivate: [ AdminAuthGuard ]
  },
  {
    path: 'job/:id',
    component: JobComponent,
    canActivate: [ AdminAuthGuard ]
  },
  {
    path: 'job',
    component: JobComponent,
    canActivate: [ AdminAuthGuard ]
  },
  {
    path: 'measures',
    component: MeasuresComponent,
    canActivate: [ AuthGuard ]
  },
  {
    path: 'organizations',
    component: OrganizationsComponent,
    canActivate: [ AuthGuard ]
  },
  {
    path: 'organization',
    component: OrganizationComponent,
    canActivate: [ AuthGuard ]
  },
  {
    path: 'organization/:id',
    component: OrganizationComponent,
    canActivate: [ AuthGuard ]
  },
  {
    path: 'organization/:orgId/clients',
    component: ClientsComponent,
    canActivate: [ AuthGuard ]
  },
  {
    path: 'organization/:orgId/client',
    component: ClientComponent,
    canActivate: [ AuthGuard ]
  },
  {
    path: 'organization/:orgId/client/:id',
    component: ClientComponent,
    canActivate: [ AuthGuard ]
  },
  {
    path: 'organization/:orgId/client/:clientId/feed',
    component: FeedComponent,
    canActivate: [ AuthGuard ]
  },
  {
    path: 'organization/:orgId/client/:clientId/feed/:id',
    component: FeedComponent,
    canActivate: [ AuthGuard ]
  },
  {
    path: 'organization/:orgId/client/:clientId/drains',
    component: DrainsComponent,
    canActivate: [ AuthGuard ]
  },
  {
    path: 'organization/:orgId/client/:clientId/drain',
    component: DrainComponent,
    canActivate: [ AuthGuard ]
  },
  {
    path: 'organization/:orgId/client/:clientId/drain/:id',
    component: DrainComponent,
    canActivate: [ AuthGuard ]
  },
  {
    path: 'users',
    component: UsersComponent,
    canActivate: [ AdminAuthGuard ]
  },
  {
    path: 'user/:id',
    component: UserComponent,
    canActivate: [ AdminAuthGuard ]
  },
  {
    path: 'user/:userId/jobs',
    component: UserJobsComponent,
    canActivate: [ AdminAuthGuard ]
  },
  {
    path: 'user',
    component: UserComponent,
    canActivate: [ AdminAuthGuard ]
  },
  {
    path: 'vendors',
    component: VendorListComponent,
    canActivate: [ AdminAuthGuard ]
  },
  {
    path: 'vendor',
    component: VendorDetailComponent,
    canActivate: [ AdminAuthGuard ]
  },
  {
    path: 'vendor/:id',
    component: VendorDetailComponent,
    canActivate: [ AdminAuthGuard ]
  },
  {
    path: '**',
    redirectTo: ''
  }
];

@NgModule({
  imports: [ RouterModule.forRoot(routes, { useHash: true }) ],
  exports: [ RouterModule ]
})
export class AppRoutingModule {}
