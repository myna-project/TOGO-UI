import { Location } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';

import { Job } from '../../_models/job';
import { Organization } from '../../_models/organization';

import { JobsService } from '../../_services/jobs.service';
import { OrganizationsService } from '../../_services/organizations.service';

import { HttpUtils } from '../../_utils/http.utils';

@Component({
  templateUrl: './job-detail.component.html',
  styleUrls: ['./job-detail.component.scss']
})
export class JobComponent implements OnInit {

  isLoading: boolean = true;
  isSaving: boolean = false;
  isDeleting: boolean = false;
  job: Job = new Job();
  allOrgs: Organization[];
  jobForm: FormGroup;
  backRoute: string = 'jobs';

  constructor(private orgsService: OrganizationsService, private jobsService: JobsService, private route: ActivatedRoute, private router: Router, private location: Location, private httpUtils: HttpUtils, private translate: TranslateService) {}

  ngOnInit(): void {
    this.createForm();
    this.orgsService.getOrganizations().subscribe(
      (orgs: Organization[]) => {
        this.allOrgs = orgs;
        this.route.paramMap.subscribe((params: any) => {
          var jobId = params.get('id');
          if (jobId) {
            this.jobsService.getJob(jobId).subscribe(
              (job: Job) => {
                this.job = job;
                this.createForm();
                this.isLoading = false;
              },
              (error: any) => {
                const dialogRef = this.httpUtils.errorDialog(error);
                dialogRef.afterClosed().subscribe((_value: any) => {
                  this.router.navigate([this.backRoute]);
                });
              }
            );
          }
        });
      },
      (error: any) => {
        const dialogRef = this.httpUtils.errorDialog(error);
        dialogRef.afterClosed().subscribe((_value: any) => {
          this.router.navigate([this.backRoute]);
        });
      }
    );
    this.isLoading = false;
  }

  get name() { return this.jobForm.get('name'); }
  get description() { return this.jobForm.get('description'); }
  get organization() { return this.jobForm.get('organization'); }

  createForm() {
    this.jobForm = new FormGroup({
      'name': new FormControl(this.job.name, [ Validators.required ]),
      'description': new FormControl(this.job.description, [ Validators.required ]),
      'organization': new FormControl(this.job.org_id ? this.allOrgs.filter(org => (org.id === this.job.org_id))[0] : undefined, [])
    });
  }

  compareObjects(o1: any, o2: any): boolean {
    return (o2 != null) && (o1.id === o2.id);
  }

  save(): void {
    this.isSaving = true;
    let newJob: Job = new Job();
    newJob.name = this.name.value;
    newJob.description = this.description.value;
    newJob.org_id = this.organization.value ? this.organization.value.id : undefined;
    if (this.job.id !== undefined) {
      newJob.id = this.job.id;
      this.jobsService.updateJob(newJob).subscribe(
        (_response: Job) => {
          this.isSaving = false;
          this.httpUtils.successSnackbar(this.translate.instant('JOB.SAVED'));
          this.router.navigate([this.backRoute]);
        },
        (error: any) => {
          this.isSaving = false;
          this.httpUtils.errorDialog(error);
        }
      );
    } else {
      this.jobsService.createJob(newJob).subscribe(
        (_response: Job) => {
          this.isSaving = false;
          this.httpUtils.successSnackbar(this.translate.instant('JOB.SAVED'));
          this.router.navigate([this.backRoute]);
        },
        (error: any) => {
          this.isSaving = false;
          this.httpUtils.errorDialog(error);
        }
      );
    }
  }

  delete(): void {
    const dialogRef = this.httpUtils.confirmDelete(this.translate.instant('JOB.DELETECONFIRM'));
    dialogRef.afterClosed().subscribe((dialogResult: any) => {
      if (dialogResult) {
        this.isDeleting = true;
        this.jobsService.deleteJob(this.job).subscribe(
          (_response: any) => {
            this.isDeleting = false;
            this.httpUtils.successSnackbar(this.translate.instant('JOB.DELETED'));
            this.router.navigate([this.backRoute]);
          },
          (error: any) => {
            this.isDeleting = false;
            this.httpUtils.errorDialog(error);
          }
        );
      }
    });
  }

  goBack(): void {
    this.location.back();
  }
}
