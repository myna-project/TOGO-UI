import { FlatTreeControl } from '@angular/cdk/tree';
import { Component, OnInit } from '@angular/core';
import { MatTreeFlatDataSource, MatTreeFlattener } from '@angular/material/tree';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { forkJoin } from 'rxjs';

import { Client } from '../../_models/client';
import { Drain } from '../../_models/drain';
import { Feed } from '../../_models/feed';
import { InvoiceItem } from '../../_models/invoiceitem';
import { Organization } from '../../_models/organization';
import { TreeItemFlatNode, TreeItemNode } from '../../_models/treenode';
import { Vendor } from '../../_models/vendor';

import { ClientsService } from '../../_services/clients.service';
import { DrainsService } from '../../_services/drains.service';
import { FeedsService } from '../../_services/feeds.service';
import { ItemskWhService } from '../../_services/itemskwh.service';
import { OrganizationsService } from '../../_services/organizations.service';
import { VendorsService } from '../../_services/vendors.service';

import { HttpUtils } from '../../_utils/http.utils';
import { OrganizationsTree } from '../../_utils/tree/organizations-tree';

@Component({
  templateUrl: './itemkwh-list.component.html',
  styleUrls: ['./itemkwh-list.component.scss']
})
export class ItemskwhComponent implements OnInit {

  isLoading: boolean = true;
  allOrgs: Organization[] = [];
  energyClients: Client[] = [];
  allFeeds: Feed[] = [];
  allDrains: Drain[] = [];
  allInvoiceItems: InvoiceItem[] = [];
  allVendors: Vendor[] = [];
  costsOrgs: Organization[] = [];
  costsClients: Client[] = [];
  costsFeeds: Feed[] = [];
  costsDrains: Drain[] = [];
  months: string[] = [];
  isFiltering: boolean = false;
  backRoute: string = 'dashboard';

  flatNodeMap = new Map<TreeItemFlatNode, TreeItemNode>();
  nestedNodeMap = new Map<TreeItemNode, TreeItemFlatNode>();
  treeControl: FlatTreeControl<TreeItemFlatNode>;
  treeFlattener: MatTreeFlattener<TreeItemNode, TreeItemFlatNode>;
  dataSource: MatTreeFlatDataSource<TreeItemNode, TreeItemFlatNode>;

  constructor(private orgsService: OrganizationsService, private clientsService: ClientsService, private feedsService: FeedsService, private drainsService: DrainsService, private vendorsService: VendorsService, private itemskWhService: ItemskWhService, private organizationsTree: OrganizationsTree, private httpUtils: HttpUtils, private router: Router, public translate: TranslateService) {}

  ngOnInit(): void {
    this.translate.get('MONTH.JANUARY').subscribe((january: string) => {
      this.months.push(january);
      this.translate.get('MONTH.FEBRUARY').subscribe((february: string) => {
        this.months.push(february);
        this.translate.get('MONTH.MARCH').subscribe((march: string) => {
          this.months.push(march);
          this.translate.get('MONTH.APRIL').subscribe((april: string) => {
            this.months.push(april);
            this.translate.get('MONTH.MAY').subscribe((may: string) => {
              this.months.push(may);
              this.translate.get('MONTH.JUNE').subscribe((june: string) => {
                this.months.push(june);
                this.translate.get('MONTH.JULY').subscribe((july: string) => {
                  this.months.push(july);
                  this.translate.get('MONTH.AUGUST').subscribe((august: string) => {
                    this.months.push(august);
                    this.translate.get('MONTH.SEPTEMBER').subscribe((september: string) => {
                      this.months.push(september);
                      this.translate.get('MONTH.OCTOBER').subscribe((october: string) => {
                        this.months.push(october);
                        this.translate.get('MONTH.NOVEMBER').subscribe((november: string) => {
                          this.months.push(november);
                          this.translate.get('MONTH.DECEMBER').subscribe((december: string) => {
                            this.months.push(december);
                          });
                        });
                      });
                    });
                  });
                });
              });
            });
          });
        });
      });
    });

    this.treeFlattener = new MatTreeFlattener(this.transformer, this.getLevel, this.isExpandable, this.getChildren);
    this.treeControl = new FlatTreeControl<TreeItemFlatNode>(this.getLevel, this.isExpandable);
    this.dataSource = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener);

    forkJoin(this.orgsService.getOrganizations(), this.clientsService.getClients(), this.feedsService.getFeeds(), this.drainsService.getDrains(), this.vendorsService.getVendors(), this.itemskWhService.getInvoiceItems()).subscribe(
      (results: any) => {
        this.allOrgs = results[0];
        this.energyClients = results[1].filter((c: Client) => c.energy_client);
        this.allFeeds = results[2];
        this.allDrains = results[3];
        this.allVendors = results[4];
        this.allInvoiceItems = results[5];
        this.costsDrains = this.allDrains.filter(d => (d.measure_unit && d.measure_unit.includes('€/')));
        let data = { orgs: [], clients: [], feeds: [], drains: [] };
        this.costsDrains.forEach((drain: Drain) => {
          this.organizationsTree.selectDrain(data, this.allOrgs, this.energyClients, this.allFeeds, this.allDrains, drain.id);
        });
        this.costsOrgs = data.orgs;
        this.costsFeeds = data.feeds;
        this.costsClients = data.clients;
        this.allInvoiceItems.forEach(item => {
          let vendor = this.allVendors.find(v => v.id === item.vendor_id);
          if (vendor)
            item.vendor_name = vendor.name;
          item.month_name = this.months[item.month - 1];
        });
        this.organizationsTree.initialize(this.costsOrgs, [], this.costsClients, this.costsFeeds, this.costsDrains, [], [], [], [], this.allInvoiceItems);
        this.organizationsTree.dataChange.subscribe((data: any) => {
          this.dataSource.data = data;
        });
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

  getLevel = (node: TreeItemFlatNode) => node.level;

  isExpandable = (node: TreeItemFlatNode) => node.expandable;

  getChildren = (node: TreeItemNode): TreeItemNode[] => node.children;

  hasChild = (_: number, _nodeData: TreeItemFlatNode) => _nodeData.expandable;

  transformer = (node: TreeItemNode, level: number) => {
    const existingNode = this.nestedNodeMap.get(node);
    const flatNode = existingNode && existingNode.item === node.item ? existingNode : new TreeItemFlatNode();
    flatNode.id = node.id;
    flatNode.type = node.type;
    flatNode.item = node.item;
    flatNode.level = level;
    flatNode.code = node.code;
    flatNode.client_default_drain = node.client_default_drain;
    flatNode.alert = node.alert;
    flatNode.alarm = node.alarm;
    flatNode.warning = node.warning;
    flatNode.expandable = node.children && node.children.length > 0;
    this.flatNodeMap.set(flatNode, node);
    this.nestedNodeMap.set(node, flatNode);
    this.treeControl.expand(flatNode);
    return flatNode;
  };

  edit(id: number): void {
    this.router.navigate(['/itemkwh/' + id]);
  }

  duplicate(id: number): void {
    this.router.navigate(['/itemkwh/' + id + '/' + 'duplicate']);
  }

  filterChanged(filterText: string, type: string) {
    this.isFiltering = true;
    this.isLoading = true;
    if (this.organizationsTree.filterOrgs(filterText, type)) {
      this.treeControl.expandAll();
    }
    this.isLoading = false;
  }
}
