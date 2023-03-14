import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { Vendor } from '../../_models/vendor';

import { VendorsService } from '../../_services/vendors.service';

import { HttpUtils } from '../../_utils/http.utils';

@Component({
  templateUrl: './vendor-list.component.html',
  styleUrls: ['./vendor-list.component.scss']
})
export class VendorListComponent implements OnInit {

  isLoading = true;
  vendors: Vendor[] = [];
  filteredVendors: Vendor[] = [];

  constructor(private vendorsService: VendorsService, private router: Router, private httpUtils: HttpUtils) {}

  ngOnInit(): void {
    this.vendorsService.getVendors().subscribe(
      (vendors: Vendor[]) => {
        this.vendors = vendors;
        this.filteredVendors = vendors;
        this.isLoading = false;
      },
      (error: any) => {
        this.httpUtils.errorDialog(error);
      }
    );
  }

  search(term: string): void {
    this.isLoading = true;
    this.filteredVendors = this.vendors.filter(vendor => {
      return (vendor.name.toLowerCase().indexOf(term.toLowerCase()) >= 0);
    });
    this.isLoading = false;
  }

  edit(id: string): void {
    this.router.navigate(['/vendor/' + id]);
  }
}
