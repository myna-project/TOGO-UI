import { MediaMatcher } from '@angular/cdk/layout';
import { ChangeDetectorRef, Component, HostListener, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { NgxMatDateAdapter } from '@angular-material-components/datetime-picker';
import { DateAdapter } from '@angular/material/core';
import { MatSidenavContent } from '@angular/material/sidenav';
import { DomSanitizer } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { forkJoin } from 'rxjs';

import * as HighChart from 'highcharts';
import * as HighStock from 'highcharts/highstock';

import HighchartsMore from "highcharts/highcharts-more";
import HighchartsExporting from "highcharts/modules/exporting";

HighchartsMore(HighChart);
HighchartsExporting(HighChart);

HighchartsMore(HighStock);
HighchartsExporting(HighStock);

import { Dashboard } from './_models/dashboard';
import { Organization } from './_models/organization';
import { User } from './_models/user';

import { AuthenticationService } from './_services/authentication.service';
import { DashboardService } from './_services/dashboard.service';
import { OrganizationsService } from './_services/organizations.service';

import { HttpUtils } from './_utils/http.utils';

import { environment } from './../environments/environment';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {

  @ViewChild('snav', { static : false }) snav: any;
  @ViewChild('content') content: MatSidenavContent;

  isLoading: boolean = false;
  isReturnToTopShow: boolean;
  topPosToStartShowing: number = 100;
  style: string = 'purple';
  mobileQuery: MediaQueryList;
  opened: boolean;
  orgs: Organization[] = [];
  dashboards: Dashboard[] = [];
  langName: {[key: string]: string} = {
    en: 'English',
    it: 'Italiano'
  };
  selectedLang: string;
  currentUser: User;
  user_avatar: any;
  accountingData: boolean = environment.accountingData;
  synopticDashboard: boolean = environment.synopticDashboard;

  @HostListener('window:scroll')
  checkScroll() {
    this.isReturnToTopShow = (window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0) >= this.topPosToStartShowing ? true : false;
  }

  _mobileQueryListener: () => void;

  constructor(private dateAdapter: DateAdapter<any>, private ngxMatDateAdapter: NgxMatDateAdapter<any>, private router: Router, private authService: AuthenticationService, private dashboardsService: DashboardService, private orgsService: OrganizationsService, private changeDetectorRef: ChangeDetectorRef, private media: MediaMatcher, private sanitizer: DomSanitizer, private httpUtils: HttpUtils, public translate: TranslateService) {
    this.translate.addLangs(['en', 'it']);

    const browserLang = this.translate.getBrowserLang();
    this.selectedLang = browserLang.match(/en|it/) ? browserLang : 'en';
    this.translate.use(this.selectedLang);
    this.dateAdapter.setLocale(this.selectedLang);
    this.ngxMatDateAdapter.setLocale(this.selectedLang);
    this.changeChartLanguage();
    this.mobileQuery = this.media.matchMedia('(max-width: 600px)');
    this._mobileQueryListener = () => this.changeDetectorRef.detectChanges();
    this.mobileQuery.addEventListener('change', this._mobileQueryListener);
  }

  ngOnInit() {
    this.currentUser = this.authService.getCurrentUser();
    if (this.currentUser === null) {
      this.router.navigate(['/login']);
      return;
    }

    this.style = this.currentUser.style;
    if (this.currentUser.lang) {
      this.selectedLang = this.currentUser.lang;
      this.translate.use(this.selectedLang);
      this.dateAdapter.setLocale(this.selectedLang);
      this.ngxMatDateAdapter.setLocale(this.selectedLang);
    }
    this.user_avatar = this.sanitizer.bypassSecurityTrustUrl('data:image/jpg;base64,' + this.currentUser.avatar);
    this.updateDashboardsList();
  }

  ngOnDestroy() {
    this.mobileQuery.removeEventListener('change', this._mobileQueryListener);
  }

  closeSideNav() {
    if (this.snav._mode == 'over' || this.snav._mode == 'push') {
      this.snav.close();
    }
  }

  changeLanguage(lang: string) {
    this.translate.use(lang);
    this.selectedLang = lang;
    this.currentUser.lang = lang;
    localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
    this.dateAdapter.setLocale(lang);
    this.ngxMatDateAdapter.setLocale(lang);
    this.changeChartLanguage();
  }

  changeChartLanguage() {
    this.translate.get('MONTH.JANUARY').subscribe((january: string) => {
      this.translate.get('MONTH.FEBRUARY').subscribe((february: string) => {
        this.translate.get('MONTH.MARCH').subscribe((march: string) => {
          this.translate.get('MONTH.APRIL').subscribe((april: string) => {
            this.translate.get('MONTH.MAY').subscribe((may: string) => {
              this.translate.get('MONTH.JUNE').subscribe((june: string) => {
                this.translate.get('MONTH.JULY').subscribe((july: string) => {
                  this.translate.get('MONTH.AUGUST').subscribe((august: string) => {
                    this.translate.get('MONTH.SEPTEMBER').subscribe((september: string) => {
                      this.translate.get('MONTH.OCTOBER').subscribe((october: string) => {
                        this.translate.get('MONTH.NOVEMBER').subscribe((november: string) => {
                          this.translate.get('MONTH.DECEMBER').subscribe((december: string) => {
                            this.translate.get('DAY.SUNDAY').subscribe((sunday: string) => {
                              this.translate.get('DAY.MONDAY').subscribe((monday: string) => {
                                this.translate.get('DAY.TUESDAY').subscribe((tuesday: string) => {
                                  this.translate.get('DAY.WEDNESDAY').subscribe((wednesday: string) => {
                                    this.translate.get('DAY.THURSDAY').subscribe((thursday: string) => {
                                      this.translate.get('DAY.FRIDAY').subscribe((friday: string) => {
                                        this.translate.get('DAY.SATURDAY').subscribe((saturday: string) => {
                                          this.translate.get('CHART.CONTEXTTITLE').subscribe((contextTitle: string) => {
                                            this.translate.get('CHART.DOWNLOADCSV').subscribe((csv: string) => {
                                              this.translate.get('CHART.DOWNLOADJPEG').subscribe((jpeg: string) => {
                                                this.translate.get('CHART.DOWNLOADPDF').subscribe((pdf: string) => {
                                                  this.translate.get('CHART.DOWNLOADPNG').subscribe((png: string) => {
                                                    this.translate.get('CHART.DOWNLOADSVG').subscribe((svg: string) => {
                                                      this.translate.get('CHART.VIEWFULLSCREEN').subscribe((view_full_screen: string) => {
                                                        this.translate.get('CHART.EXITFULLSCREEN').subscribe((exit_full_screen: string) => {
                                                          this.translate.get('CHART.PRINTCHART').subscribe((print_chart: string) => {
                                                            HighStock.setOptions({
                                                              lang: {
                                                                contextButtonTitle: contextTitle, 
                                                                downloadCSV: csv,
                                                                downloadJPEG: jpeg,
                                                                downloadPDF: pdf,
                                                                downloadPNG: png,
                                                                downloadSVG: svg,
                                                                exitFullscreen: exit_full_screen,
                                                                months: [ january, february, march, april, may, june, july, august, september, october, november, december ],
                                                                printChart: print_chart,
                                                                shortMonths: [ january.substring(0, 3), february.substring(0, 3), march.substring(0, 3), april.substring(0, 3), may.substring(0, 3), june.substring(0, 3), july.substring(0, 3), august.substring(0, 3), september.substring(0, 3), october.substring(0, 3), november.substring(0, 3), december.substring(0, 3) ],
                                                                viewFullscreen: view_full_screen,
                                                                weekdays: [ sunday, monday, tuesday, wednesday, thursday, friday, saturday ]
                                                              }
                                                            });
                                                            HighChart.setOptions({
                                                              lang: {
                                                                contextButtonTitle: contextTitle, 
                                                                downloadCSV: csv,
                                                                downloadJPEG: jpeg,
                                                                downloadPDF: pdf,
                                                                downloadPNG: png,
                                                                downloadSVG: svg,
                                                                exitFullscreen: exit_full_screen,
                                                                months: [ january, february, march, april, may, june, july, august, september, october, november, december ],
                                                                printChart: print_chart,
                                                                shortMonths: [ january.substring(0, 3), february.substring(0, 3), march.substring(0, 3), april.substring(0, 3), may.substring(0, 3), june.substring(0, 3), july.substring(0, 3), august.substring(0, 3), september.substring(0, 3), october.substring(0, 3), november.substring(0, 3), december.substring(0, 3) ],
                                                                viewFullscreen: view_full_screen,
                                                                weekdays: [ sunday, monday, tuesday, wednesday, thursday, friday, saturday ]
                                                              }
                                                            });
                                                          });
                                                        });
                                                      });
                                                    });
                                                  });
                                                });
                                              });
                                            });
                                          });
                                        });
                                      });
                                    });
                                  });
                                });
                              });
                            });
                          });
                        });
                      });
                    });
                  });
                });
              });
            });
          });
        });
      });
    });
  }

  changeAvatar(avatar: string) {
    this.user_avatar = this.sanitizer.bypassSecurityTrustUrl('data:image/jpg;base64,' + avatar);
    this.currentUser.avatar = avatar;
    localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
  }

  changeStyle(newStyle: string) {
    this.style = newStyle;
    this.currentUser.style = newStyle;
    localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
  }

  addDashboard(): void {
    this.closeSideNav();
    this.router.navigate(["dashboarddetail"]);
  }

  showDashboard(id: number): void {
    this.closeSideNav();
    this.router.navigate(["dashboard/" + id]);
  }

  scrollToTop() {
    window.scroll({ top: 0, behavior: 'smooth' });
  }

  logout() {
    const dialogRef = this.httpUtils.confirmDelete(this.translate.instant('USER.CONFIRMLOGOUT'));
    dialogRef.afterClosed().subscribe((dialogResult: any) => {
      if (dialogResult) {
        this.snav.close();
        this.authService.logout();
        this.currentUser = this.authService.getCurrentUser();
        const browserLang = this.translate.getBrowserLang();
        this.selectedLang = browserLang.match(/en|it/) ? browserLang : 'en';
        this.translate.use(this.selectedLang);
        this.router.navigate(['/login']);
      }
    });
  }

  onActivate(_event: any) {
    this.snav.close();
    if (this.currentUser === null) {
      this.router.navigate(['/login']);
      return;
    }
    this.style = this.currentUser.style;
    if (this.currentUser.lang) {
      this.selectedLang = this.currentUser.lang;
      this.translate.use(this.selectedLang);
      this.dateAdapter.setLocale(this.selectedLang);
      this.ngxMatDateAdapter.setLocale(this.selectedLang);
      this.changeChartLanguage();
    }
    this.user_avatar = this.sanitizer.bypassSecurityTrustUrl('data:image/jpg;base64,' + this.currentUser.avatar);
    window.scrollTo(0, 0);
  }

  updateDashboardsList() {
    this.dashboards = [];
    this.orgs = [];
    forkJoin(this.orgsService.getOrganizations(), this.dashboardsService.getDashboards()).subscribe(
      (results: any) => {
        this.orgs = results[0];
        results[1].forEach((dashboard: Dashboard) => {
          if (this.currentUser.dashboard_ids.includes(dashboard.id))
            this.dashboards.push(dashboard);
        });
      },
      (error: any) => {
        this.httpUtils.errorDialog(error);
      }
    );
  }

  updateDefaultDashboardId(id: number) {
    this.currentUser.default_dashboard_id = id;
    localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
  }

  initializeDashboardId(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.updateDashboardsList();
  }

  updateDashboardIds(dashboardId: number): void {
    this.currentUser = this.authService.getCurrentUser();
    this.currentUser.dashboard_ids.push(dashboardId)
    localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
    this.updateDashboardsList();
  }

  deleteDashboardIds(dashboardId: number): void {
    this.currentUser = this.authService.getCurrentUser();
    const index = this.currentUser.dashboard_ids.indexOf(dashboardId);
    this.currentUser.dashboard_ids.splice(index,1);
    localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
    this.updateDashboardsList();
  }

  dashboardLoading(): void {
    this.isLoading = !this.isLoading;
  }
}
