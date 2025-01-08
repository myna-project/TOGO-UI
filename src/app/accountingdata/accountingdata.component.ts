import { FlatTreeControl } from '@angular/cdk/tree';
import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatTreeFlatDataSource, MatTreeFlattener } from '@angular/material/tree';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { forkJoin } from 'rxjs';

import { Client } from '../_models/client';
import { Drain } from '../_models/drain';
import { Feed } from '../_models/feed';
import { Organization } from '../_models/organization';
import { TreeItemFlatNode, TreeItemNode } from '../_models/treenode';

import { ClientsService } from '../_services/clients.service';
import { DrainsService } from '../_services/drains.service';
import { FeedsService } from '../_services/feeds.service';
import { OrganizationsService } from '../_services/organizations.service';
import { MeasuresService } from '../_services/measures.service';

import { DrainsTreeDialogComponent } from '../_utils/drains-tree-dialog/drains-tree-dialog.component';
import { HttpUtils } from '../_utils/http.utils';
import { OrganizationsTree } from '../_utils/tree/organizations-tree';

import { environment } from '../../environments/environment';

@Component({
  templateUrl: './accountingdata.component.html',
  styleUrls: ['./accountingdata.component.scss'],
  providers: [OrganizationsTree]
})
export class AccountingDataComponent implements OnInit {

  isLoading: boolean = true;
  isSaving: boolean = false;
  yearData: number = (new Date()).getFullYear();
  monthData: number = (new Date()).getMonth() + 1;
  allOrgs: Organization[] = [];
  energyClients: Client[] = [];
  allFeeds: Feed[] = [];
  allDrains: Drain[] = [];
  selectedOrgs: Organization[] = [];
  selectedFeeds: Feed[] = [];
  selectedClients: Client[] = [];
  selectedDrains: Drain[] = [];
  drains: any[] = [];
  accountingdataForm: FormGroup;
  group: any = {};
  backRoute: string = 'dashboard';

  flatNodeMap = new Map<TreeItemFlatNode, TreeItemNode>();
  nestedNodeMap = new Map<TreeItemNode, TreeItemFlatNode>();
  treeControl: FlatTreeControl<TreeItemFlatNode>;
  treeFlattener: MatTreeFlattener<TreeItemNode, TreeItemFlatNode>;
  dataSource: MatTreeFlatDataSource<TreeItemNode, TreeItemFlatNode>;

  constructor(private orgsService: OrganizationsService, private clientsService: ClientsService, private feedsService: FeedsService, private drainsService: DrainsService, private measuresService: MeasuresService, private organizationsTree: OrganizationsTree, private dialog: MatDialog, private router: Router, private httpUtils: HttpUtils, private translate: TranslateService) {}

  ngOnInit(): void {
    this.createForm();
    this.treeFlattener = new MatTreeFlattener(this.transformer, this.getLevel, this.isExpandable, this.getChildren);
    this.treeControl = new FlatTreeControl<TreeItemFlatNode>(this.getLevel, this.isExpandable);
    this.dataSource = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener);
    if (environment.accountingDrains && (environment.accountingDrains.length > 0)) {
      forkJoin([this.orgsService.getOrganizations(), this.clientsService.getClients(), this.feedsService.getFeeds(), this.drainsService.getDrains()]).subscribe({
        next: (results: any) => {
          this.allOrgs = results[0];
          this.energyClients = results[1].filter((c: Client) => c.energy_client);
          this.allFeeds = results[2];
          this.allDrains = results[3];
          environment.accountingDrains.forEach(drainId => {
            this.createDrainControls(drainId);
          });
          this.buildDetailTree();
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
    flatNode.full_name = node.full_name;
    flatNode.level = level;
    flatNode.code = node.code;
    flatNode.expandable = node.children && node.children.length > 0;
    this.flatNodeMap.set(flatNode, node);
    this.nestedNodeMap.set(node, flatNode);
    this.treeControl.expand(flatNode);
    return flatNode;
  }

  buildDetailTree() {
    this.dataSource.data = this.organizationsTree.getTreeData(this.selectedOrgs, [], this.selectedClients, this.selectedFeeds, this.selectedDrains, [], [], [], [], []);
  }

  get year() { return this.accountingdataForm.get('year'); }
  get month() { return this.accountingdataForm.get('month'); }

  createForm() {
    let patterns = this.httpUtils.getPatterns();
    this.group['year'] = new FormControl(this.yearData, [ Validators.required, Validators.pattern(patterns.positiveInteger) ]);
    this.group['month'] = new FormControl(this.monthData, [ Validators.required ]);
    this.accountingdataForm = new FormGroup(this.group);
  }

  createDrainControls(drainId: number): void {
    let patterns = this.httpUtils.getPatterns();
    let drain = this.allDrains.find(d => d.id === drainId);
    if (drain) {
      let feed = this.allFeeds.find(f => f.id === drain.feed_id);
      if (feed) {
        let client = this.energyClients.find(c => (c.device_id && (feed.client_ids.indexOf(c.id) > -1)));
        if (client) {
          let org = this.allOrgs.find(o => o.id === client.org_id);
          if (org) {
            this.group['value_' + drainId] = new FormControl(undefined, [ Validators.pattern(patterns.positiveNegativeFloat) ]);
            this.accountingdataForm.get('value_' + drainId).valueChanges.subscribe((_value: any) => {
              this.accountingdataForm.updateValueAndValidity();
            });
            this.organizationsTree.selectDrain({ orgs: this.selectedOrgs, clients: this.selectedClients, feeds: this.selectedFeeds, drains: this.selectedDrains }, this.allOrgs, this.energyClients, this.allFeeds, this.allDrains, drain.id);
            this.drains.push({ id: drain.id, client_id: client.id, device_id: client.device_id, measure_id: drain.measure_id, full_name: ((this.allOrgs.length > 1) ? org.name + ' - ' : '') + client.name + ' - ' + feed.description + ' - ' + drain.name + (drain.measure_unit ? ' (' + drain.measure_unit + ')' : '') });
          }
        }
      }
    }
  }

  compareObjects(o1: any, o2: any): boolean {
    return (o2 != null) && (o1.id === o2.id);
  }

  addDrains(): void {
    const dialogRef = this.dialog.open(DrainsTreeDialogComponent, { width: '75%', data: { orgs: this.allOrgs, clients: this.energyClients, feeds: this.allFeeds, drains: this.allDrains.filter(d => ((d.measure_type !== 'C') && (d.measure_type !== 's'))), formulas: [] } });
    dialogRef.afterClosed().subscribe((result: any[]) => {
      if (result) {
        let component = this;
        result.forEach(function (drain: any) {
          component.createDrainControls(drain.id);
        });
        this.buildDetailTree();
      }
    });
  }

  save(): void {
    this.isSaving = true;
    let measures = [];
    let date = new Date(this.year.value, this.month.value - 1, 1, 0, 0, 0);
    this.drains.forEach((drain: any) => {
      if (this.accountingdataForm.get('value_' + drain.id).value)
        measures.push({ at: this.httpUtils.getDateTimeForUrl(date, false), client_id: drain.client_id, device_id: drain.device_id, measures: [{ measure_id: drain.measure_id, value: this.accountingdataForm.get('value_' + drain.id).value }] });
    });
    if (measures.length > 0) {
      this.measuresService.updateMeasuresMatrix(measures).subscribe({
        next: (_response: any) => {
          this.isSaving = false;
          this.httpUtils.successSnackbar(this.translate.instant('ACCOUNTINGDATA.SAVED'));
          this.router.navigate([this.backRoute]);
        },
        error: (error: any) => {
          if (error.status !== 401)
            this.httpUtils.errorDialog(error);
          this.isSaving = false;
        }
      });
    }
  }
}
