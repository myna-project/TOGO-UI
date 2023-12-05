import { Location } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { DomSanitizer } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';

import { ClientCategory } from '../../_models/clientcategory';

import { ClientCategoriesService } from '../../_services/clientcategories.service';

import { HttpUtils } from '../../_utils/http.utils';

@Component({
  templateUrl: './clientcategory-detail.component.html',
  styleUrls: ['./clientcategory-detail.component.scss']
})
export class ClientCategoryComponent implements OnInit {

  isLoading: boolean = true;
  isSaving: boolean = false;
  isDeleting: boolean = false;
  category: ClientCategory = new ClientCategory();
  category_image: any;
  category_image_show: any;
  categoryForm: FormGroup;
  backRoute: string = 'clientcategories';

  constructor(private clientCategoriesService: ClientCategoriesService, private route: ActivatedRoute, private router: Router, private location: Location, private sanitizer: DomSanitizer, private httpUtils: HttpUtils, private translate: TranslateService) {}

  ngOnInit() {
    this.createForm();
    this.route.paramMap.subscribe((params: any) => {
      var categoryId = +params.get('id');
      if (categoryId) {
        this.clientCategoriesService.getClientCategory(categoryId).subscribe({
          next: (response: ClientCategory) => {
            this.category = response;
            if (this.category.image)
              this.category_image_show = this.sanitizer.bypassSecurityTrustUrl('data:image/jpg;base64,' + this.category.image);
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
    });
  }

  get description() { return this.categoryForm.get('description'); }

  createForm() {
    this.categoryForm = new FormGroup({
      'description': new FormControl(this.category.description, [ Validators.required ])
    });
  }

  onSelectImage(event: any) {
    if (event.target.files && event.target.files[0]) {
      var reader = new FileReader();

      reader.onload = (event) => {
        this.category_image_show = event.target.result;
      }

      reader.onloadend = (_e) => {
        this.category_image = reader.result;
        this.category_image = this.category_image.substring(this.category_image.lastIndexOf(",") + 1);
      }

      reader.readAsDataURL(event.target.files[0]);
    }
  }

  save(): void {
    this.isSaving = true;
    let newCategory: ClientCategory = new ClientCategory();
    newCategory.description = this.description.value;
    newCategory.image = this.category_image;
    if (this.category.id !== undefined) {
      newCategory.id = this.category.id;
      this.clientCategoriesService.updateClientCategory(newCategory).subscribe({
        next: (_response: ClientCategory) => {
          this.isSaving = false;
          this.httpUtils.successSnackbar(this.translate.instant('CLIENTCATEGORY.SAVED'));
          this.router.navigate([this.backRoute]);
        },
        error: (error: any) => {
          this.isSaving = false;
          if (error.status !== 401)
            this.httpUtils.errorDialog(error);
        }
      });
    } else {
      this.clientCategoriesService.createClientCategory(newCategory).subscribe({
        next: (_response: ClientCategory) => {
          this.isSaving = false;
          this.httpUtils.successSnackbar(this.translate.instant('CLIENTCATEGORY.SAVED'));
          this.router.navigate([this.backRoute]);
        },
        error: (error: any) => {
          this.isSaving = false;
          this.httpUtils.errorDialog(error);
        }
      });
    }
  }

  delete(): void {
    const dialogRef = this.httpUtils.confirmDelete(this.translate.instant('CLIENTCATEGORY.DELETECONFIRM'));
    dialogRef.afterClosed().subscribe((dialogResult: any) => {
      if (dialogResult) {
        this.isDeleting = true;
        this.clientCategoriesService.deleteClientCategory(this.category).subscribe({
          next:(_response: any) => {
            this.isDeleting = false;
            this.httpUtils.successSnackbar(this.translate.instant('CLIENTCATEGORY.DELETED'));
            this.router.navigate([this.backRoute]);
          },
          error: (error: any) => {
            this.isDeleting = false;
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
