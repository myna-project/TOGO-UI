import { Location } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';

import { Vendor } from '../../_models/vendor';

import { VendorsService } from '../../_services/vendors.service';

import { HttpUtils } from '../../_utils/http.utils';

@Component({
  templateUrl: './vendor-detail.component.html',
  styleUrls: ['./vendor-detail.component.scss']
})
export class VendorDetailComponent implements OnInit {

  isLoading:boolean = true;
  isSaving:boolean = false;
  isDeleting:boolean = false;
  vendor: Vendor = new Vendor();
  vendorForm: FormGroup;
  backRoute = 'vendors';

  constructor(private vendorsService: VendorsService, private route: ActivatedRoute, private router: Router, private httpUtils: HttpUtils, private location: Location, private translate: TranslateService) {}

  ngOnInit(): void {
    this.createForm();
    this.route.paramMap.subscribe((params: any) => {
      let vendorId = params.get('id');
      if (vendorId) {
        this.vendorsService.getVendor(vendorId).subscribe(
          (vendor: Vendor) => {
            this.vendor = vendor;
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
    });
  }

  get name() { return this.vendorForm.get('name'); };

  createForm() {
    this.vendorForm = new FormGroup({
      'name': new FormControl(this.vendor.name, [ Validators.required, Validators.minLength(2) ])
    });
  };

  save(): void {
    this.isSaving = true;
    let newVendor = new Vendor();
    newVendor.name = this.name.value;
    if (this.vendor.id !== undefined) {
      newVendor.id = this.vendor.id;
      this.vendorsService.updateVendor(newVendor).subscribe(
        (_response: Vendor) => {
          this.isSaving = false;
          this.httpUtils.successSnackbar(this.translate.instant('VENDOR.SAVED'));
          this.router.navigate([this.backRoute]);
        },
        (error: any) => {
          this.isSaving = false;
          this.httpUtils.errorDialog(error);
        }
      );
    } else {
      this.vendorsService.createVendor(newVendor).subscribe(
        (_response: Vendor) => {
          this.isSaving = false;
          this.httpUtils.successSnackbar(this.translate.instant('VENDOR.SAVED'));
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
    const dialogRef = this.httpUtils.confirmDelete(this.translate.instant('VENDOR.DELETECONFIRM'));
    dialogRef.afterClosed().subscribe((dialogResult: any) => {
      if (dialogResult) {
        this.isDeleting = true;
        this.vendorsService.deleteVendor(this.vendor.id).subscribe(
          (_response: any) => {
            this.isDeleting = false;
            this.httpUtils.successSnackbar(this.translate.instant('VENDOR.DELETED'));
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
