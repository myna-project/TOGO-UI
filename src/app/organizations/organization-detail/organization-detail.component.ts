import { Location } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';

import { Organization } from '../../_models/organization';

import { OrganizationsService } from '../../_services/organizations.service';

import { HttpUtils } from '../../_utils/http.utils';

@Component({
  templateUrl: './organization-detail.component.html',
  styleUrls: ['./organization-detail.component.scss']
})
export class OrganizationComponent implements OnInit {

  isLoading: boolean = true;
  isSaving: boolean = false;
  isDeleting: boolean = false;
  organization: Organization = new Organization();
  parentOrgs: Organization[];
  orgForm: FormGroup;
  backRoute: string = 'organizations';

  constructor(private orgsService: OrganizationsService, private route: ActivatedRoute, private router: Router, private location: Location, private httpUtils: HttpUtils, private translate: TranslateService) {}

  ngOnInit() {
    this.createForm();
    this.route.paramMap.subscribe((params: any) => {
      this.orgsService.getOrganizations().subscribe(
        (orgs: Organization[]) => {
          this.parentOrgs = orgs;
          var orgId = params.get('id');
          if (orgId) {
            this.organization = this.parentOrgs.find(org => (org.id === +orgId));
            this.parentOrgs = this.parentOrgs.filter(org => (org.id != this.organization.id));
            this.createForm();
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
    });
    this.isLoading = false;
  }

  get name() { return this.orgForm.get('name'); }
  get parent() { return this.orgForm.get('parent'); }

  createForm() {
    this.orgForm = new FormGroup({
      'name': new FormControl(this.organization.name, [ Validators.required ]),
      'parent': new FormControl(this.organization.parent_id ? this.parentOrgs.filter(org => (org.id === this.organization.parent_id))[0] : '', [])
    });
  }

  compareObjects(o1: any, o2: any): boolean {
    return (o2 != null) && (o1.id === o2.id);
  }

  save(): void {
    this.isSaving = true;
    let newOrg: Organization = new Organization();
    newOrg.name = this.name.value;
    newOrg.parent_id = this.parent.value ? this.parent.value.id : undefined;
    if (this.organization.id !== undefined) {
      newOrg.id = this.organization.id;
      this.orgsService.updateOrganization(newOrg).subscribe(
        (_response: Organization) => {
          this.isSaving = false;
          this.httpUtils.successSnackbar(this.translate.instant('ORG.SAVED'));
          this.router.navigate([this.backRoute]);
        },
        (error: any) => {
          this.isSaving = false;
          this.httpUtils.errorDialog(error);
        }
      );
    } else {
      this.orgsService.createOrganization(newOrg).subscribe(
        (_response: Organization) => {
          this.isSaving = false;
          this.httpUtils.successSnackbar(this.translate.instant('ORG.SAVED'));
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
    const dialogRef = this.httpUtils.confirmDelete(this.translate.instant('ORG.DELETECONFIRM'));
    dialogRef.afterClosed().subscribe((dialogResult: any) => {
      if (dialogResult) {
        this.isDeleting = true;
        this.orgsService.deleteOrganization(this.organization).subscribe(
          (_response: any) => {
            this.isDeleting = false;
            this.httpUtils.successSnackbar(this.translate.instant('ORG.DELETED'));
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
