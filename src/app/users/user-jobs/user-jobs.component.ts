import { Location } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { forkJoin } from 'rxjs';

import { Job } from '../../_models/job';
import { Organization } from '../../_models/organization';
import { User } from '../../_models/user';

import { JobsService } from '../../_services/jobs.service';
import { OrganizationsService } from '../../_services/organizations.service';
import { UsersService } from '../../_services/users.service';

import { HttpUtils } from '../../_utils/http.utils';

@Component({
  templateUrl: './user-jobs.component.html',
  styleUrls: ['./user-jobs.component.scss']
})
export class UserJobsComponent implements OnInit {

  isLoading: boolean = true;
  isSaving: boolean = false;
  isDeleting: boolean = false;
  allOrgs: Organization[];
  allJobs: Job[];
  user: User = new User();
  userJobs: any[] = [];
  userJobsForm: FormGroup;
  jobs: any[] = [];
  backRoute: string = 'users';

  constructor(private usersService: UsersService, private orgsService: OrganizationsService, private jobsService: JobsService, private route: ActivatedRoute, private router: Router, private location: Location, private httpUtils: HttpUtils, private translate: TranslateService) {}

  ngOnInit(): void {
    this.createForm();
    this.route.paramMap.subscribe((params: any) => {
      var userId = params.get('userId');
      if (userId) {
        forkJoin(this.orgsService.getOrganizations(), this.jobsService.getJobs(), this.usersService.getUser(userId)).subscribe(
          (results: any) => {
            this.allOrgs = results[0];
            this.allJobs = results[1];
            this.user = results[2];
            this.allJobs.forEach(j => {
              let orgName = this.allOrgs.filter(o => (o.id === j.org_id))[0].name;
              this.jobs.push({ id: j.id, name: orgName + ' - ' + j.name });
            });
            if (this.user.job_ids) {
              this.user.job_ids.forEach(jobId => {
                let job = this.allJobs.filter(j => (j.id === jobId))[0];
                let orgName = this.allOrgs.filter(o => (o.id === job.org_id))[0].name;
                this.userJobs.push({ id: jobId, name: orgName + ' - ' + job.name });
                this.jobs = this.jobs.filter(j => (j.id !== jobId));
              });
            }
            this.isLoading = false;
          },
          (error: any) => {
            const dialogRef = this.httpUtils.errorDialog(error);
            dialogRef.afterClosed().subscribe((_value: any) => {
              this.router.navigate([this.backRoute]);
            });
          }
        );
      } else {
        this.isLoading = false;
      }
    });
  }

  get newJob() { return this.userJobsForm.get('newJob'); }

  createForm() {
    this.userJobsForm = new FormGroup({
      'newJob': new FormControl(undefined, [ Validators.required ])
    });
  }

  compareObjects(o1: any, o2: any): boolean {
    return (o2 != null) && (o1.id === o2.id);
  }

  addJob(): void {
    let jobId = this.newJob.value.id;
    if (jobId) {
      this.usersService.addJobToUser(this.user.id, jobId).subscribe(
        (_response: any) => {
          let job = this.allJobs.filter(j => (j.id === jobId))[0];
          let orgName = this.allOrgs.filter(o => (o.id === job.org_id))[0].name;
          this.userJobs.push({ id: jobId, name: orgName + ' - ' + job.name });
          this.jobs = this.jobs.filter(j => (j.id !== jobId));
          this.httpUtils.successSnackbar(this.translate.instant('USER.JOBADDED'));
        },
        (error: any) => {
          this.httpUtils.errorDialog(error);
        }
      );
    }
  }

  removeJob(jobId: number): void {
    this.usersService.removeJobFromUser(this.user.id, jobId).subscribe(
      (_response: any) => {
        let job = this.allJobs.filter(j => (j.id === jobId))[0];
        let orgName = this.allOrgs.filter(o => (o.id === job.org_id))[0].name;
        this.userJobs = this.userJobs.filter(j => (j.id !== jobId));
        this.jobs.push({ id: jobId, name: orgName + ' - ' + job.name });
        this.httpUtils.successSnackbar(this.translate.instant('USER.JOBREMOVED'));
      },
      (error: any) => {
        this.httpUtils.errorDialog(error);
      }
    );
  }

  goBack(): void {
    this.location.back();
  }
}
