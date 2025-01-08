import { Location } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { forkJoin } from 'rxjs';

import { Client } from '../../_models/client';
import { Drain } from '../../_models/drain';
import { Feed } from '../../_models/feed';
import { InvoiceItem } from '../../_models/invoiceitem';
import { Organization } from '../../_models/organization';
import { Vendor } from '../../_models/vendor';

import { ClientsService } from '../../_services/clients.service';
import { DrainsService } from '../../_services/drains.service';
import { FeedsService } from '../../_services/feeds.service';
import { ItemskWhService } from '../../_services/itemskwh.service';
import { OrganizationsService } from '../../_services/organizations.service';
import { VendorsService } from '../../_services/vendors.service';

import { DrainsTreeDialogComponent } from '../../_utils/drains-tree-dialog/drains-tree-dialog.component';
import { HttpUtils } from '../../_utils/http.utils';
import { OrganizationsTree } from '../../_utils/tree/organizations-tree';

@Component({
  templateUrl: './itemkwh-detail.component.html',
  styleUrls: ['./itemkwh-detail.component.scss'],
  providers: [OrganizationsTree]
})
export class ItemkwhComponent implements OnInit {

  isLoading: boolean = true;
  isSaving: boolean = false;
  isDeleting: boolean = false;
  org: Organization = new Organization();
  client: Client = new Client();
  feed: Feed = new Feed();
  drain: Drain = new Drain();
  allOrgs: Organization[] = [];
  energyClients: Client[] = [];
  allFeeds: Feed[] = [];
  allDrains: Drain[] = [];
  allVendors: Vendor[] = [];
  invoiceItemkWh: InvoiceItem = new InvoiceItem();
  costsOrgs: Organization[] = [];
  costsClients: Client[] = [];
  costsFeeds: Feed[] = [];
  costsDrains: Drain[] = [];
  costsDrain: any;
  itemkwhForm: FormGroup;
  backRoute: string = 'itemskwh';

  constructor(private orgsService: OrganizationsService, private clientsService: ClientsService, private feedsService: FeedsService, private drainsService: DrainsService, private itemskWhService: ItemskWhService, private vendorsService: VendorsService, private dialog: MatDialog, private httpUtils: HttpUtils, private organizationsTree: OrganizationsTree, private router: Router, private route: ActivatedRoute, private location: Location, private translate: TranslateService) {}

  ngOnInit(): void {
    this.createForm();
    this.route.paramMap.subscribe((params: any) => {
      forkJoin([this.orgsService.getOrganizations(), this.clientsService.getClients(), this.feedsService.getFeeds(), this.drainsService.getDrains(), this.vendorsService.getVendors()]).subscribe({
        next: (results: any) => {
          this.allOrgs = results[0];
          this.energyClients = results[1].filter((c: Client) => c.energy_client);
          this.allFeeds = results[2];
          this.allDrains = results[3];
          this.allVendors = results[4];
          this.costsDrains = this.allDrains.filter(d => (d.measure_unit && d.measure_unit.includes('€/')));
          let data = { orgs: [], clients: [], feeds: [], drains: [] };
          this.costsDrains.forEach((drain: Drain) => {
            this.organizationsTree.selectDrain(data, this.allOrgs, this.energyClients, this.allFeeds, this.allDrains, drain.id);
          });
          this.costsOrgs = data.orgs;
          this.costsFeeds = data.feeds;
          this.costsClients = data.clients;
          let itemkWh_id = params.get('id');
          let duplicateItem = params.get('operation');
          if (itemkWh_id) {
            this.itemskWhService.getInvoiceItem(itemkWh_id).subscribe((item: InvoiceItem) => {
              this.invoiceItemkWh = item;
              if (duplicateItem && duplicateItem === 'duplicate') {
                this.invoiceItemkWh.id = undefined;
                this.invoiceItemkWh.month = undefined;
              }
              let vendor = this.allVendors.find(v => v.id === this.invoiceItemkWh.vendor_id);
              if (vendor)
                this.invoiceItemkWh.vendor_name = vendor.name;
              this.drain = this.allDrains.find(d => d.id === this.invoiceItemkWh.drain_id);
              if (this.drain)
                this.setCostDrain(this.drain, true);
              this.createForm();
              this.isLoading = false;
            });
          } else {
            if (this.costsDrains.length === 1)
              this.setCostDrain(this.costsDrains[0], false);
            this.isLoading = false;
          }
        },
        error: (error: any) => {
          if (error.status !==401) {
            const dialogRef = this.httpUtils.errorDialog(error);
            dialogRef.afterClosed().subscribe((_value: any) => {
              this.router.navigate([this.backRoute]);
            });
          }
        }
      });
    });
  }

  get vendor() { return this.itemkwhForm.get('vendor'); }
  get year() { return this.itemkwhForm.get('year'); }
  get month() { return this.itemkwhForm.get('month'); }
  get f1_energy() { return this.itemkwhForm.get('f1_energy'); }
  get f2_energy() { return this.itemkwhForm.get('f2_energy'); }
  get f3_energy() { return this.itemkwhForm.get('f3_energy'); }
  get interruptibility_remuneration() { return this.itemkwhForm.get('interruptibility_remuneration'); }
  get production_capacity_availability() { return this.itemkwhForm.get('production_capacity_availability'); }
  get grtn_operating_costs() { return this.itemkwhForm.get('grtn_operating_costs'); }
  get procurement_dispatching_resources() { return this.itemkwhForm.get('procurement_dispatching_resources'); }
  get reintegration_temporary_safeguard() { return this.itemkwhForm.get('reintegration_temporary_safeguard'); }
  get f1_unit_safety_costs() { return this.itemkwhForm.get('f1_unit_safety_costs'); }
  get f2_unit_safety_costs() { return this.itemkwhForm.get('f2_unit_safety_costs'); }
  get f3_unit_safety_costs() { return this.itemkwhForm.get('f3_unit_safety_costs'); }
  get transport_energy() { return this.itemkwhForm.get('transport_energy'); }
  get transport_energy_equalization() { return this.itemkwhForm.get('transport_energy_equalization'); }
  get system_charges_energy() { return this.itemkwhForm.get('system_charges_energy'); }
  get duty_excise_1() { return this.itemkwhForm.get('duty_excise_1'); }
  get duty_excise_2() { return this.itemkwhForm.get('duty_excise_2'); }
  get f1_reactive_energy_33() { return this.itemkwhForm.get('f1_reactive_energy_33'); }
  get f2_reactive_energy_33() { return this.itemkwhForm.get('f2_reactive_energy_33'); }
  get f3_reactive_energy_33() { return this.itemkwhForm.get('f3_reactive_energy_33'); }
  get f1_reactive_energy_75() { return this.itemkwhForm.get('f1_reactive_energy_75'); }
  get f2_reactive_energy_75() { return this.itemkwhForm.get('f2_reactive_energy_75'); }
  get f3_reactive_energy_75() { return this.itemkwhForm.get('f3_reactive_energy_75'); }
  get loss_perc_rate() { return this.itemkwhForm.get('loss_perc_rate'); }
  get vat_perc_rate() { return this.itemkwhForm.get('vat_perc_rate'); }

  createForm(): void {
    let patterns = this.httpUtils.getPatterns();
    this.itemkwhForm = new FormGroup({
      'vendor': new FormControl(this.invoiceItemkWh.vendor_id ? this.allVendors.find(v => v.id === this.invoiceItemkWh.vendor_id) : undefined, [ Validators.required ]),
      'year': new FormControl(this.invoiceItemkWh.year, [ Validators.required, Validators.minLength(4), Validators.maxLength(4), Validators.pattern(patterns.positiveInteger) ]),
      'month': new FormControl(this.invoiceItemkWh.month, [ Validators.required ]),
      'f1_energy': new FormControl(this.invoiceItemkWh.f1_energy, [ Validators.required, Validators.pattern(patterns.positiveFloat) ]),
      'f2_energy': new FormControl(this.invoiceItemkWh.f2_energy, [ Validators.required, Validators.pattern(patterns.positiveFloat) ]),
      'f3_energy': new FormControl(this.invoiceItemkWh.f3_energy, [ Validators.required, Validators.pattern(patterns.positiveFloat) ]),
      'interruptibility_remuneration': new FormControl(this.invoiceItemkWh.interruptibility_remuneration, [ Validators.pattern(patterns.positiveFloat) ]),
      'production_capacity_availability': new FormControl(this.invoiceItemkWh.production_capacity_availability, [ Validators.pattern(patterns.positiveFloat) ]),
      'grtn_operating_costs': new FormControl(this.invoiceItemkWh.grtn_operating_costs, [ Validators.pattern(patterns.positiveFloat) ]),
      'procurement_dispatching_resources': new FormControl(this.invoiceItemkWh.procurement_dispatching_resources, [ Validators.pattern(patterns.positiveFloat) ]),
      'reintegration_temporary_safeguard': new FormControl(this.invoiceItemkWh.reintegration_temporary_safeguard, [ Validators.pattern(patterns.positiveFloat) ]),
      'f1_unit_safety_costs': new FormControl(this.invoiceItemkWh.f1_unit_safety_costs, [ Validators.pattern(patterns.positiveFloat) ]),
      'f2_unit_safety_costs': new FormControl(this.invoiceItemkWh.f2_unit_safety_costs, [ Validators.pattern(patterns.positiveFloat) ]),
      'f3_unit_safety_costs': new FormControl(this.invoiceItemkWh.f3_unit_safety_costs, [ Validators.pattern(patterns.positiveFloat) ]),
      'transport_energy': new FormControl(this.invoiceItemkWh.transport_energy, [ Validators.pattern(patterns.positiveFloat) ]),
      'transport_energy_equalization': new FormControl(this.invoiceItemkWh.transport_energy_equalization, [ Validators.pattern(patterns.positiveFloat) ]),
      'system_charges_energy': new FormControl(this.invoiceItemkWh.system_charges_energy, [ Validators.pattern(patterns.positiveFloat) ]),
      'duty_excise_1': new FormControl(this.invoiceItemkWh.duty_excise_1, [ Validators.pattern(patterns.positiveFloat) ]),
      'duty_excise_2': new FormControl(this.invoiceItemkWh.duty_excise_2, [ Validators.pattern(patterns.positiveFloat) ]),
      'f1_reactive_energy_33': new FormControl(this.invoiceItemkWh.f1_reactive_energy_33, [ Validators.pattern(patterns.positiveFloat) ]),
      'f2_reactive_energy_33': new FormControl(this.invoiceItemkWh.f2_reactive_energy_33, [ Validators.pattern(patterns.positiveFloat) ]),
      'f3_reactive_energy_33': new FormControl(this.invoiceItemkWh.f3_reactive_energy_33, [ Validators.pattern(patterns.positiveFloat) ]),
      'f1_reactive_energy_75': new FormControl(this.invoiceItemkWh.f1_reactive_energy_75, [ Validators.pattern(patterns.positiveFloat) ]),
      'f2_reactive_energy_75': new FormControl(this.invoiceItemkWh.f2_reactive_energy_75, [ Validators.pattern(patterns.positiveFloat) ]),
      'f3_reactive_energy_75': new FormControl(this.invoiceItemkWh.f3_reactive_energy_75, [ Validators.pattern(patterns.positiveFloat) ]),
      'loss_perc_rate': new FormControl(this.invoiceItemkWh.loss_perc_rate, [ Validators.pattern(patterns.positiveFloat) ]),
      'vat_perc_rate': new FormControl(this.invoiceItemkWh.vat_perc_rate, [ Validators.pattern(patterns.positiveFloat) ])
    });
  }

  compareObjects(o1: any, o2: any): boolean {
    return (o2 != null) && (o1.id === o2.id);
  }

  setCostDrain(drain: Drain, update: boolean): void {
    let feed = this.allFeeds.find(f => f.id === drain.feed_id);
    if (feed) {
      if (update)
        this.feed = feed;
      let client = this.energyClients.find(c => feed.client_ids.indexOf(c.id) > -1);
      if (client) {
        if (update)
          this.client = client;
        let org = this.allOrgs.find(o => o.id === client.org_id);
        if (org) {
          if (update)
            this.org = org;
          this.costsDrain = { id: drain.id, full_name: ((this.allOrgs.length > 1) ? org.name + ' - ' : '') + client.name + ' - ' + feed.description + ' - ' + drain.name + (drain.measure_unit ? ' (' + drain.measure_unit + ')' : '') }
        }
      }
    }
  }

  selectCostDrain(): void {
    const dialogRef = this.dialog.open(DrainsTreeDialogComponent, { width: '75%', data: { orgs: this.costsOrgs, clients: this.costsClients, feeds: this.costsFeeds, drains: this.costsDrains, formulas: [], singleDrain: true } });
    dialogRef.afterClosed().subscribe((result: any) => {
      if (result)
        this.costsDrain = { id: result.id, full_name: result.full_name };
    });
  }

  save(): void {
    this.isSaving = true;
    let newItem = new InvoiceItem();
    newItem.drain_id = this.costsDrain.id;
    newItem.vendor_id = this.vendor.value ? this.vendor.value.id : undefined;
    newItem.year = this.year.value;
    newItem.month = this.month.value;
    newItem.f1_energy = this.f1_energy.value;
    newItem.f2_energy = this.f2_energy.value;
    newItem.f3_energy = this.f3_energy.value;
    newItem.interruptibility_remuneration = this.interruptibility_remuneration.value;
    newItem.production_capacity_availability = this.production_capacity_availability.value;
    newItem.grtn_operating_costs = this.grtn_operating_costs.value;
    newItem.procurement_dispatching_resources = this.procurement_dispatching_resources.value;
    newItem.reintegration_temporary_safeguard = this.reintegration_temporary_safeguard.value;
    newItem.f1_unit_safety_costs = this.f1_unit_safety_costs.value;
    newItem.f2_unit_safety_costs = this.f2_unit_safety_costs.value;
    newItem.f3_unit_safety_costs = this.f3_unit_safety_costs.value;
    newItem.transport_energy = this.transport_energy.value;
    newItem.transport_energy_equalization = this.transport_energy_equalization.value;
    newItem.duty_excise_1 = this.duty_excise_1.value;
    newItem.duty_excise_2 = this.duty_excise_2.value;
    newItem.f1_reactive_energy_33 = this.f1_reactive_energy_33.value;
    newItem.f2_reactive_energy_33 = this.f2_reactive_energy_33.value;
    newItem.f3_reactive_energy_33 = this.f3_reactive_energy_33.value;
    newItem.f1_reactive_energy_75 = this.f1_reactive_energy_75.value;
    newItem.f2_reactive_energy_75 = this.f2_reactive_energy_75.value;
    newItem.f3_reactive_energy_75 = this.f3_reactive_energy_75.value;
    newItem.system_charges_energy = this.system_charges_energy.value;
    newItem.loss_perc_rate = this.loss_perc_rate.value;
    newItem.vat_perc_rate = this.vat_perc_rate.value;
    if (this.invoiceItemkWh.id) {
      newItem.id = this.invoiceItemkWh.id;
      this.itemskWhService.updateInvoiceItem(newItem).subscribe({
        next: (_response: InvoiceItem) => {
          this.isSaving = false;
          this.httpUtils.successSnackbar(this.translate.instant('ITEMKWH.SAVED'));
          this.router.navigate([this.backRoute]);
        },
        error: (error: any) => {
          this.isSaving = false;
          if (error.status !== 401)
            this.httpUtils.errorDialog(error);
        }
      });
    } else {
      this.itemskWhService.createInvoiceItem(newItem).subscribe({
        next: (_response: InvoiceItem) => {
          this.isSaving = false;
          this.httpUtils.successSnackbar(this.translate.instant('ITEMKWH.SAVED'));
          this.router.navigate([this.backRoute]);
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
    const dialogRef = this.httpUtils.confirmDelete(this.translate.instant('ITEMKWH.DELETECONFIRM'));
    dialogRef.afterClosed().subscribe((dialogResult: any) => {
      if (dialogResult) {
        this.isDeleting = true;
        this.itemskWhService.deleteInvoiceItem(this.invoiceItemkWh.id).subscribe({
          next: (_response: any) => {
            this.isDeleting = false;
            this.httpUtils.successSnackbar(this.translate.instant('ITEMKWH.DELETED'));
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
