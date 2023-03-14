import { Location } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';

import { IndexGroup } from '../../_models/indexgroup';
import { Organization } from '../../_models/organization';

import { IndexGroupsService } from '../../_services/indexgroups.service';
import { OrganizationsService } from '../../_services/organizations.service';

import { HttpUtils } from '../../_utils/http.utils';

@Component({
  templateUrl: './indexgroup-detail.component.html',
  styleUrls: ['./indexgroup-detail.component.scss']
})
export class IndexGroupComponent implements OnInit {

  isLoading: boolean = true;
  isSaving: boolean = false;
  isDeleting: boolean = false;
  indexgroup: IndexGroup = new IndexGroup();
  org: Organization = new Organization();
  allOrgs: Organization[];
  indexgroupForm: FormGroup;
  backRoute: string = 'indices';

  constructor(private indexGroupsService: IndexGroupsService, private orgsService: OrganizationsService, private route: ActivatedRoute, private router: Router, private location: Location, private httpUtils: HttpUtils, private translate: TranslateService) {}

  ngOnInit() {
    this.createForm();
    this.route.paramMap.subscribe((params: any) => {
      var indexgroupId = +params.get('id');
      this.orgsService.getOrganizations().subscribe(
        (orgs: Organization[]) => {
          this.allOrgs = orgs;
          if (indexgroupId) {
            this.indexGroupsService.getIndexGroup(indexgroupId).subscribe(
              (indexgroup: IndexGroup) => {
                this.indexgroup = indexgroup;
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
          } else {
            this.isLoading = false;
          }
        },
        (error: any) => {
          const dialogRef = this.httpUtils.errorDialog(error);
          dialogRef.afterClosed().subscribe((_value: any) => {
            this.router.navigate([this.backRoute]);
          });
        }
      );
    });
  }

  get name() { return this.indexgroupForm.get('name'); }
  get organization() { return this.indexgroupForm.get('organization'); }

  createForm() {
    this.indexgroupForm = new FormGroup({
      'name': new FormControl(this.indexgroup.name, [ Validators.required ]),
      'organization': new FormControl(this.indexgroup.org_id ? this.allOrgs.filter(org => (org.id === this.indexgroup.org_id))[0] : undefined, [ Validators.required ])
    });
  }

  compareObjects(o1: any, o2: any): boolean {
    return (o2 != null) && (o1.id === o2.id);
  }

  save(): void {
    this.isSaving = true;
    let newIndexGroup: IndexGroup = new IndexGroup();
    newIndexGroup.name = this.name.value;
    newIndexGroup.org_id = this.organization.value ? this.organization.value.id : undefined;
    if (this.indexgroup.id !== undefined) {
      newIndexGroup.id = this.indexgroup.id;
      this.indexGroupsService.updateIndexGroup(newIndexGroup).subscribe(
        (_response: IndexGroup) => {
          this.isSaving = false;
          this.httpUtils.successSnackbar(this.translate.instant('INDEXGROUP.SAVED'));
          this.router.navigate([this.backRoute]);
        },
        (error: any) => {
          this.isSaving = false;
          this.httpUtils.errorDialog(error);
        }
      );
    } else {
      this.indexGroupsService.createIndexGroup(newIndexGroup).subscribe(
        (_response: IndexGroup) => {
          this.isSaving = false;
          this.httpUtils.successSnackbar(this.translate.instant('INDEXGROUP.SAVED'));
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
    const dialogRef = this.httpUtils.confirmDelete(this.translate.instant('INDEXGROUP.DELETECONFIRM'));
    dialogRef.afterClosed().subscribe((dialogResult: any) => {
      if (dialogResult) {
        this.isDeleting = true;
        this.indexGroupsService.deleteIndexGroup(this.indexgroup).subscribe(
          (_response: any) => {
            this.isDeleting = false;
            this.httpUtils.successSnackbar(this.translate.instant('INDEXGROUP.DELETED'));
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
