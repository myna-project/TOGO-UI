import { FlatTreeControl } from '@angular/cdk/tree';
import { Location } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatButtonToggleChange } from '@angular/material/button-toggle';
import { MatDialog } from '@angular/material/dialog';
import { MatTreeFlatDataSource, MatTreeFlattener } from '@angular/material/tree';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';

import { Client } from '../../_models/client';
import { ClientCategory } from '../../_models/clientcategory';
import { Organization } from '../../_models/organization';
import { TreeItemFlatNode, TreeItemNode } from './../../_models/treenode';

import { ClientsService } from '../../_services/clients.service';
import { ClientCategoriesService } from '../../_services/clientcategories.service';
import { OrganizationsService } from '../../_services/organizations.service';

import { ChartDialogComponent } from '../../_utils/chart-dialog/chart-dialog.component';
import { HttpUtils } from '../../_utils/http.utils';
import { ClientsTree } from '../../_utils/tree/clients-tree';
import { MitchTreeGraph } from '../../_utils/tree/mitch-tree';

@Component({
  templateUrl: './clients-list.component.html',
  styleUrls: ['./clients-list.component.scss']
})
export class ClientsComponent implements OnInit {

  isLoading: boolean = true;
  org: Organization = new Organization();
  allCategories: ClientCategory[] = [];
  allClients: Client[] = [];
  clientsForView: Client[] = [];
  filteredClientsForView: Client[] = [];
  clientsForTree: Client[] = [];
  selectedView: string = localStorage.getItem('clientsView') ? localStorage.getItem('clientsView') : 'vertical';
  controllerView: boolean = (localStorage.getItem('controllerView') && localStorage.getItem('controllerView') === 'true') ? true : false;
  isFiltering: boolean = false;
  client_mitch_graph_id: string = 'client-mitch-graph';
  backRoute: string = 'clients';

  flatNodeMap = new Map<TreeItemFlatNode, TreeItemNode>();
  nestedNodeMap = new Map<TreeItemNode, TreeItemFlatNode>();
  treeControl: FlatTreeControl<TreeItemFlatNode>;
  treeFlattener: MatTreeFlattener<TreeItemNode, TreeItemFlatNode>;
  dataSource: MatTreeFlatDataSource<TreeItemNode, TreeItemFlatNode>;

  constructor(private orgsService: OrganizationsService, private clientCategoriesService: ClientCategoriesService, private clientsService: ClientsService, private route: ActivatedRoute, private router: Router, private location: Location, private tree : MitchTreeGraph, private clientsTree: ClientsTree, private dialog: MatDialog, private httpUtils: HttpUtils) {}

  ngOnInit(): void {
    this.treeFlattener = new MatTreeFlattener(this.transformer, this.getLevel, this.isExpandable, this.getChildren);
    this.treeControl = new FlatTreeControl<TreeItemFlatNode>(this.getLevel, this.isExpandable);
    this.dataSource = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener);

    this.route.paramMap.subscribe((params: any) => {
      let orgId = params.get('orgId');
      if (orgId) {
        forkJoin([this.orgsService.getOrganization(orgId), this.clientsService.getClients(), this.clientCategoriesService.getClientCategories()]).subscribe({
          next: (results: any) => {
            this.org = results[0];
            this.allClients = results[1];
            this.allCategories = results[2];
            if (this.allClients.length > 0) {
              this.allClients.sort((a, b) => a.name < b.name ? -1 : (a.name > b.name) ? 1 : 0);
              this.clientsTree.dataChange.subscribe((data: any) => {
                this.dataSource.data = data;
              });
              let i: number = 0;
              this.allClients.forEach(client => {
                let category = this.allCategories.find(c => c.id === client.category_id);
                if (category)
                  client.image = category.image;
                this.clientsService.getClientImage(client.id).subscribe(
                  (response: any) => {
                    i++;
                    if (response && response.image)
                      client.image = response.image;
                    if (i === this.allClients.length) {
                      this.initClient();
                      if (this.selectedView === 'list') {
                        this.clientsTree.initialize(this.clientsForView, this.controllerView);
                      } else {
                        this.createClientsTree();
                        if (this.clientsForTree.length > 0)
                          this.tree.buildMitchTree(this.clientsForTree, this.client_mitch_graph_id, screen.width, this.selectedView, this.controllerView);
                      }
                      this.isLoading = false;
                    }
                  }
                );
              });
            } else {
              this.isLoading = false;
            }
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
    flatNode.default_drain_ids = node.default_drain_ids;
    flatNode.formula_ids = node.formula_ids;
    flatNode.alert = node.alert;
    flatNode.alarm = node.alarm;
    flatNode.warning = node.warning;
    flatNode.expandable = node.children && node.children.length > 0;
    this.flatNodeMap.set(flatNode, node);
    this.nestedNodeMap.set(node, flatNode);
    this.treeControl.expand(flatNode);
    return flatNode;
  }

  createClientsTree() {
    this.clientsForTree = [];
    let rootClients = this.clientsForView.filter(client => (this.controllerView ? !this.clientsForView.find(c => c.id === client.controller_id) : !this.clientsForView.find(c => c.id === client.parent_id)));
    if (rootClients && (rootClients.length > 1)) {
      let fakeClient: Client = new Client();
      rootClients.forEach(root => {
        if (this.controllerView)
          this.clientsForView.find(c => c.id == root.id).controller_id = -1;
        else
          this.clientsForView.find(c => c.id == root.id).parent_id = -1;
        if (!fakeClient.alert)
          fakeClient.alert = root.alert;
        if (!fakeClient.alarm)
          fakeClient.alarm = root.alarm;
        if (!fakeClient.warning)
          fakeClient.warning = root.warning;
      });
      fakeClient.id = -1;
      fakeClient.name = 'Root';
      if (this.controllerView)
        fakeClient.controlled_ids = [ -1 ];
      else
        fakeClient.child_ids = [ -1 ];
      this.createClientChildrenTree(fakeClient);
    } else {
      rootClients.forEach(root => {
        this.createClientChildrenTree(root);
      });
    }
  }

  createClientChildrenTree(root: Client) {
    this.clientsForTree.push(root);
    let children = this.clientsForView.filter(client => (this.controllerView ? client.controller_id == root.id : client.parent_id == root.id));
    children.forEach((child: Client) => {
      this.createClientChildrenTree(child);
    });
  }

  initClient() {
    this.clientsForView = [];
    this.allClients.filter(client => ((client.org_id === this.org.id) && ((this.controllerView && client.computer_client) || (!this.controllerView && client.energy_client)))).forEach(client => {
      this.clientsForView.push(Object.assign({}, client));
    });
    this.clientsForView.forEach(client => {
      if (client.controller_id === -1)
        client.controller_id = null;
      if (client.parent_id === -1)
        client.parent_id = null;
      this.setClientAlerts(client);
    });
    this.filteredClientsForView = this.clientsForView;
  }

  setClientAlerts(client: Client) {
    let parentClientId = this.controllerView ? client.controller_id : client.parent_id;
    if (parentClientId) {
      let father = this.clientsForView.find(c => (c.id == parentClientId));
      if (father) {
        if (client.alert)
          father.alert = true;
        if (client.alarm)
          father.alarm = true;
        if (client.warning)
          father.warning = true;
        this.setClientAlerts(father);
      }
    }
  }

  onResize(event: any) {
    if (this.clientsForTree.length > 0)
      this.tree.buildMitchTree(this.clientsForTree, this.client_mitch_graph_id, event.target.innerWidth, this.selectedView, this.controllerView);
  }

  toggleChange(change: MatButtonToggleChange) {
    this.selectedView = change.value;
    localStorage.setItem('clientsView', this.selectedView);
    this.reloadClients();
  }

  slideChange() {
    this.controllerView = !this.controllerView;
    localStorage.setItem('controllerView', this.controllerView ? 'true' : 'false');
    this.reloadClients();
  }

  reloadClients() {
    this.initClient();
    if (this.selectedView === 'list') {
      this.clientsTree.initialize(this.clientsForView, this.controllerView);
    } else {
      this.createClientsTree();
      if (this.clientsForTree.length > 0)
        this.tree.buildMitchTree(this.clientsForTree, this.client_mitch_graph_id, screen.width, this.selectedView, this.controllerView);
    }
  }

  filterChanged(filterText: string, type: string) {
    this.isFiltering = true;
    this.isLoading = true;
    if (this.clientsTree.filterClients(filterText, type))
      this.treeControl.expandAll();
    this.isLoading = false;
  }

  edit(id: number): void {
    this.router.navigate(['organization/' + this.org.id + '/client/' + id]);
  }

  drains(id: number): void {
    this.router.navigate(['organization/' + this.org.id + '/client/' + id + '/drains']);
  }

  measures(node: TreeItemFlatNode): void {
    let drains: string[] = [];
    if (node.default_drain_ids && node.default_drain_ids.length > 0)
      node.default_drain_ids.forEach(drain_id => drains.push('d_' + drain_id));
    if (node.formula_ids && node.formula_ids.length > 0)
      node.formula_ids.forEach(formula_id => drains.push('f_' + formula_id));
    this.dialog.open(ChartDialogComponent, { width: '75%', data: { drains: drains } });
  }

  goBack(): void {
    this.location.back();
  }
}
