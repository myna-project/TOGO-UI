import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { ClientCategory } from '../../_models/clientcategory';

import { ClientCategoriesService } from '../../_services/clientcategories.service';

import { HttpUtils } from '../../_utils/http.utils';

@Component({
  templateUrl: './clientcategories-list.component.html',
  styleUrls: ['./clientcategories-list.component.scss']
})
export class ClientCategoriesComponent implements OnInit {

  isLoading: boolean = true;
  categories: ClientCategory[];
  filteredCategories: ClientCategory[];
  isFiltering: boolean = false;

  constructor(private clientCategoriesService: ClientCategoriesService, private router: Router, private httpUtils: HttpUtils) {}

  ngOnInit(): void {
    this.clientCategoriesService.getClientCategories().subscribe({
      next: (categories: ClientCategory[]) => {
        categories.sort((a, b) => a.description < b.description ? -1 : a.description > b.description ? 1 : 0);
        this.categories = categories;
        this.filteredCategories = categories;
        this.isLoading = false;
      },
      error: (error: any) => {
        if (error.status !== 401)
          this.httpUtils.errorDialog(error);
      }
    });
  }

  search(term: string): void {
    this.isLoading = true;
    this.filteredCategories = this.categories.filter(function(category: ClientCategory) {
      return (category.description.toLowerCase().indexOf(term.toLowerCase()) >= 0);
    });
    this.isLoading = false;
  }

  edit(id: number): void {
    this.router.navigate(['clientcategory/' + id]);
  }
}
