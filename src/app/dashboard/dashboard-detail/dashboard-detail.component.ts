import { Location } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { forkJoin } from 'rxjs';

import { Dashboard } from '../../_models/dashboard';
import { Job } from '../../_models/job';
import { Organization } from '../../_models/organization';
import { User } from '../../_models/user';

import { AuthenticationService } from '../../_services/authentication.service';
import { DashboardService } from '../../_services/dashboard.service';
import { JobsService } from '../../_services/jobs.service';
import { OrganizationsService } from '../../_services/organizations.service';
import { UsersService } from '../../_services/users.service';

import { AppComponent } from '../../app.component';

import { HttpUtils } from '../../_utils/http.utils';

@Component({
  templateUrl: './dashboard-detail.component.html',
  styleUrls: ['./dashboard-detail.component.scss']
})
export class DashboardDetailComponent implements OnInit {

  isLoading: boolean;
  isSaving: boolean = false;
  isDeleting: boolean = false;
  dashboard: Dashboard = new Dashboard();
  allOrgs: Organization[];
  allUsers: User[];
  otherUsers: User[];
  allJobs: Job[];
  dashboardUsersList: number[] = [];
  dashboardForm: FormGroup;
  groupForm: any = {};
  currentUser: User;
  userList: User[] = [];
  userOrganizationList: any[] = [];
  backRoute: string = 'dashboard';

  constructor(public myapp: AppComponent, private authService: AuthenticationService, private dashboardService: DashboardService, private orgsService: OrganizationsService, private jobService: JobsService, private usersService: UsersService, private route: ActivatedRoute, private router: Router, private location: Location, private httpUtils: HttpUtils, private translate: TranslateService) { }

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.isLoading = true;
    this.createForm();
    this.route.paramMap.subscribe((params: any) => {
      let dashboardId: number = +params.get("id");
      forkJoin([this.orgsService.getOrganizations(),this.usersService.getUsers(), this.jobService.getJobs()]).subscribe({
        next: (results: any) => {
          this.allOrgs = results[0];
          this.allUsers = results[1];
          this.otherUsers = this.allUsers.filter((user: User) => user.username !== this.currentUser.username);
          this.allJobs = results[2];
          this.otherUsers.forEach((user: User) => {
            let userOrganization = { user: user, orgIds: [] };
            if (user.job_ids) {
              user.job_ids.forEach(id => {
                let job = this.allJobs.find((job: Job) => job.id === id);
                if (job)
                  userOrganization.orgIds.push(job.org_id);
              });
              this.userOrganizationList.push(userOrganization);
            }
          });
          if (this.allOrgs.length === 1)
            this.organization.setValue(this.allOrgs[0]);
          if (dashboardId) {
            this.dashboardService.getDasboard(dashboardId).subscribe({
              next: (dashboard: Dashboard) => {
                this.dashboard = dashboard;
                this.dashboard.default = this.currentUser.default_dashboard_id === this.dashboard.id;
                this.dashboardUsersList = dashboard.user_ids;
                if (this.dashboard.org_id)
                  this.updateUserList(this.allOrgs.find((org: Organization) => org.id === this.dashboard.org_id));
                this.createForm();
                this.isLoading = false;
              },
              error: (error: any) => {
                if (error.status !== 401) {
                  const dialogRef = this.httpUtils.errorDialog(error);
                  dialogRef.afterClosed().subscribe((_value: any) => {
                    this.router.navigate([this.backRoute]);
                  });
                }
              }
            });
          } else {
            this.isLoading = false;
          }
        },
        error: (error: any) => {
          if (error.status !== 401) {
            const dialogRef = this.httpUtils.errorDialog(error);
            dialogRef.afterClosed().subscribe((_value: any) => {
              this.router.navigate([this.backRoute]);
            });
          }
        }
      });
    });
  }

  get name() { return this.dashboardForm.get('name'); }
  get organization() { return this.dashboardForm.get('org'); }
  get selectedUser() { return this.dashboardForm.get('selectedUser'); }
  get default() { return this.dashboardForm.get('default'); }

  createForm(): void {
    this.groupForm['name'] = new FormControl(this.dashboard.name, [ Validators.required ]);
    this.groupForm['org'] = new FormControl(this.dashboard.org_id ? this.allOrgs.find(org => org.id === this.dashboard.org_id) : ((this.allOrgs && (this.allOrgs.length === 1)) ? this.allOrgs[0].id : undefined), [ Validators.required ]);
    this.groupForm['selectedUser'] = new FormControl(this.dashboardUsersList);
    this.groupForm['default'] = new FormControl((this.dashboard.id && this.dashboard.id === this.currentUser.default_dashboard_id) ? true : false);
    this.dashboardForm = new FormGroup(this.groupForm);
    this.dashboardForm.get('org').valueChanges.subscribe((org: Organization) => {
      this.updateUserList(org);
    });
  }

  compareObjects(o1: any, o2: any): boolean {
    return (o2 != null) && (o1.id === o2.id);
  }

  updateUserList(org: Organization) {
    this.userList = [];
    if (org) {
      this.userOrganizationList.forEach(userOrg => {
        if (userOrg.orgIds.includes(org.id))
          this.userList.push(userOrg.user);
      });
    }
  }

  save(duplicate: boolean): void {
    this.isSaving = true;
    let dashboardToSave = new Dashboard();
    dashboardToSave.name = this.name.value;
    dashboardToSave.org_id = this.organization.value ? this.organization.value.id : undefined;
    dashboardToSave.user_ids = this.selectedUser.touched ? this.selectedUser.value : this.dashboardUsersList;
    dashboardToSave.default = this.default.value;
    let userId = this.allUsers.find((user: User) => user.username === this.currentUser.username).id;
    if (!dashboardToSave.user_ids.includes(userId))
      dashboardToSave.user_ids.push(userId);
    if (this.dashboard.id && !duplicate) {
      dashboardToSave.id = this.dashboard.id
      this.dashboardService.updateDashboard(this.dashboard.id, dashboardToSave).subscribe({
        next: (response: Dashboard) => {
          this.isSaving = false;
          this.httpUtils.successSnackbar(this.translate.instant('DASHBOARD.SAVED'));
          if (dashboardToSave.default)
            this.myapp.updateDefaultDashboardId(response.id);
          this.myapp.updateDashboardsList();
          this.router.navigate([this.backRoute + '/' + this.dashboard.id]);
        },
        error: (error: any) => {
          this.isSaving = false;
          if (error.status !== 401)
            this.httpUtils.errorDialog(error);
        }
      });
    } else {
      dashboardToSave.duplicate_dashboard_id = duplicate ? this.dashboard.id : null;
      this.dashboardService.createDashboard(dashboardToSave).subscribe({
        next: (response: Dashboard) => {
          this.isSaving = false;
          this.myapp.updateDashboardIds(response.id);
          if (dashboardToSave.default)
            this.myapp.updateDefaultDashboardId(response.id);
          this.httpUtils.successSnackbar(this.translate.instant('DASHBOARD.SAVED'));
          this.router.navigate([this.backRoute + '/' + response.id]);
        },
        error: (error: any) => {
          this.isSaving = false;
          if (error.status !== 401)
            this.httpUtils.errorDialog(error);
        }
      });
    }
  }

  delete(): void {
    const dialogRef = this.httpUtils.confirmDelete(this.translate.instant('DASHBOARD.DELETEDASHBOARDCONFIRM'));
    dialogRef.afterClosed().subscribe((dialogResult: any) => {
      if (dialogResult) {
        this.isDeleting = true;
        this.dashboardService.deleteDashboard(this.dashboard.id).subscribe({
          next: (_response: any) => {
            this.isDeleting = false;
            this.myapp.deleteDashboardIds(this.dashboard.id);
            this.httpUtils.successSnackbar(this.translate.instant('DASHBOARD.DELETEDDASHBOARD'));
            this.router.navigate([this.backRoute]);
          },
          error: (error: any) => {
            this.isDeleting = false;
            if (error.status !== 401)
              this.httpUtils.errorDialog(error);
          }
        });
      }
    });
  }

  goBack(): void {
    this.location.back();
  }
}
