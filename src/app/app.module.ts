import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule, HttpClient, HTTP_INTERCEPTORS } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { DateAdapter, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatDialogModule } from '@angular/material/dialog';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatSliderModule } from '@angular/material/slider';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSortModule } from '@angular/material/sort';
import { MatStepperModule } from '@angular/material/stepper';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTreeModule } from '@angular/material/tree';
import { MatMomentDateModule, MomentDateAdapter } from '@angular/material-moment-adapter';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MAT_COLOR_FORMATS, NgxMatColorPickerModule, NGX_MAT_COLOR_FORMATS } from '@angular-material-components/color-picker';
import { NgxMatDateAdapter, NgxMatDatetimePickerModule, NgxMatTimepickerModule } from '@angular-material-components/datetime-picker';
import { NgxMatFileInputModule } from '@angular-material-components/file-input';
import { NgxMatMomentModule, NgxMatMomentAdapter } from '@angular-material-components/moment-adapter';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { GridsterModule } from 'angular-gridster2';
import { ChartModule, HIGHCHARTS_MODULES } from 'angular-highcharts';

import * as more from 'highcharts/highcharts-more.src';
import * as heatMap from 'highcharts/modules/heatmap.src';
import * as highstock from 'highcharts/modules/stock.src';
import * as solidGauge from 'highcharts/modules/solid-gauge.src';
import * as pie from 'highcharts/highcharts-3d';

import * as highchartsBoost  from 'highcharts/modules/boost';

import { AppRoutingModule } from './app-routing.module';

import { AppComponent } from './app.component';
import { AboutComponent } from './about/about.component';
import { AccountingDataComponent } from './accountingdata/accountingdata.component';
import { ClientCategoriesComponent } from './clientcategories/clientcategories-list/clientcategories-list.component';
import { ClientCategoryComponent } from './clientcategories/clientcategory-detail/clientcategory-detail.component';
import { ClientComponent } from './clients/client-detail/client-detail.component';
import { ClientsComponent } from './clients/clients-list/clients-list.component';
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
import { OrganizationComponent } from './organizations/organization-detail/organization-detail.component';
import { OrganizationsComponent } from './organizations/organizations-list/organizations-list.component';
import { ProfileComponent } from './profile/profile.component';
import { SynopticDashboardComponent } from './synopticdashboard/synopticdashboard.component';
import { UsersComponent } from './users/users-list/users-list.component';
import { UserComponent } from './users/user-detail/user-detail.component';
import { UserJobsComponent } from './users/user-jobs/user-jobs.component';
import { VendorDetailComponent } from './vendors/vendor-detail/vendor-detail.component';
import { VendorListComponent } from './vendors/vendors-list/vendor-list.component';

import { ChartDialogComponent } from './_utils/chart-dialog/chart-dialog.component';
import { ConfirmDialogComponent } from './_utils/confirm-dialog/confirm-dialog.component';
import { DrainControlDetailsTreeDialogComponent } from './_utils/draincontroldetails-tree-dialog/draincontroldetails-tree-dialog.component';
import { DrainControlsTreeDialogComponent } from './_utils/draincontrols-tree-dialog/draincontrols-tree-dialog.component';
import { DrainsTreeDialogComponent } from './_utils/drains-tree-dialog/drains-tree-dialog.component';
import { DrainsTreeSidenavComponent } from './_utils/drains-tree-sidenav/drains-tree-sidenav.component';
import { FormulaDetailsDialogComponent } from './_utils/formula-details-dialog/formula-details-dialog.component';
import { FormulasTreeDialogComponent } from './_utils/formulas-tree-dialog/formulas-tree-dialog.component';
import { IndicesTreeDialogComponent } from './_utils/indices-tree-dialog/indices-tree-dialog.component';
import { MessageDialogComponent } from './_utils/message-dialog/message-dialog.component';

import { CustomHttpInterceptor } from './_utils/http.interceptor';
import { DragDropModule } from '@angular/cdk/drag-drop';

export function HttpLoaderFactory(httpClient: HttpClient) {
  return new TranslateHttpLoader(httpClient, './assets/i18n/', '.json');
}

@NgModule({
  declarations: [
    AppComponent,
    AboutComponent,
    AccountingDataComponent,
    ChartDialogComponent,
    ClientCategoriesComponent,
    ClientCategoryComponent,
    ClientComponent,
    ClientsComponent,
    ConfirmDialogComponent,
    DashboardComponent,
    DashboardDetailComponent,
    DashboardWidgetComponent,
    DrainComponent,
    DrainControlComponent,
    DrainControlDetailsTreeDialogComponent,
    DrainControlsComponent,
    DrainControlsTreeDialogComponent,
    DrainsComponent,
    DrainsTreeDialogComponent,
    DrainsTreeSidenavComponent,
    FeedComponent,
    FormulaDetailsDialogComponent,
    FormulasTreeDialogComponent,
    IndexComponent,
    IndexGroupComponent,
    IndicesComponent,
    IndicesTreeDialogComponent,
    ItemkwhComponent,
    ItemskwhComponent,
    JobComponent,
    JobsComponent,
    LoginComponent,
    MeasuresComponent,
    MessageDialogComponent,
    OrganizationComponent,
    OrganizationsComponent,
    ProfileComponent,
    SynopticDashboardComponent,
    UsersComponent,
    UserComponent,
    UserJobsComponent,
    VendorDetailComponent,
    VendorListComponent
  ],
  imports: [
    AppRoutingModule,
    BrowserAnimationsModule,
    BrowserModule,
    ChartModule,
    CommonModule,
    DragDropModule,
    FormsModule,
    GridsterModule,
    HttpClientModule,
    MatAutocompleteModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatCardModule,
    MatCheckboxModule,
    MatChipsModule,
    MatDialogModule,
    MatDatepickerModule,
    MatExpansionModule,
    MatFormFieldModule,
    MatGridListModule,
    MatIconModule,
    MatInputModule,
    MatListModule,
    MatMenuModule,
    MatMomentDateModule,
    MatPaginatorModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatRadioModule,
    MatSelectModule,
    MatSidenavModule,
    MatSliderModule,
    MatSlideToggleModule,
    MatSnackBarModule,
    MatSortModule,
    MatStepperModule,
    MatTableModule,
    MatTabsModule,
    MatToolbarModule,
    MatTooltipModule,
    MatTreeModule,
    NgxMatColorPickerModule,
    NgxMatDatetimePickerModule,
    NgxMatFileInputModule,
    NgxMatMomentModule,
    NgxMatTimepickerModule,
    ReactiveFormsModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient]
      }
    }),
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: CustomHttpInterceptor, multi: true },
    { provide: MAT_COLOR_FORMATS, useValue: NGX_MAT_COLOR_FORMATS },
    { provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE] },
    { provide: NgxMatDateAdapter, useClass: NgxMatMomentAdapter },
    { provide: HIGHCHARTS_MODULES, useFactory: () => [ heatMap, highstock, more, solidGauge, highchartsBoost, pie ] }
  ],
  bootstrap: [
    AppComponent
  ]
})
export class AppModule {}
