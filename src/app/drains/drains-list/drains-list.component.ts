import { FlatTreeControl } from '@angular/cdk/tree';
import { Location } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatTreeFlatDataSource, MatTreeFlattener } from '@angular/material/tree';
import { ActivatedRoute, Router } from '@angular/router';

import { Client } from '../../_models/client';
import { Organization } from '../../_models/organization';
import { TreeItemFlatNode, TreeItemNode } from '../../_models/treenode';

import { ClientsService } from '../../_services/clients.service';
import { OrganizationsService } from '../../_services/organizations.service';

import { DrainsTree } from '../../_utils/tree/drains-tree';
import { HttpUtils } from '../../_utils/http.utils';

@Component({
  templateUrl: './drains-list.component.html',
  styleUrls: ['./drains-list.component.scss']
})
export class DrainsComponent implements OnInit {

  isLoading: boolean = true;
  org: Organization = new Organization();
  client: Client = new Client();
  isFiltering: boolean = false;

  flatNodeMap = new Map<TreeItemFlatNode, TreeItemNode>();
  nestedNodeMap = new Map<TreeItemNode, TreeItemFlatNode>();
  treeControl: FlatTreeControl<TreeItemFlatNode>;
  treeFlattener: MatTreeFlattener<TreeItemNode, TreeItemFlatNode>;
  dataSource: MatTreeFlatDataSource<TreeItemNode, TreeItemFlatNode>;

  constructor(private orgsService: OrganizationsService, private clientsService: ClientsService, private route: ActivatedRoute, private router: Router, private location: Location, private httpUtils: HttpUtils, private drainsTree: DrainsTree) {}

  ngOnInit(): void {
    this.treeFlattener = new MatTreeFlattener(this.transformer, this.getLevel, this.isExpandable, this.getChildren);
    this.treeControl = new FlatTreeControl<TreeItemFlatNode>(this.getLevel, this.isExpandable);
    this.dataSource = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener);

    this.route.paramMap.subscribe((params: any) => {
      var orgId = +params.get('orgId');
      if (orgId) {
        this.orgsService.getOrganization(orgId).subscribe({
          next: (org: Organization) => {
            this.org = org;
            var clientId = +params.get('clientId');
            if (clientId) {
              this.clientsService.getClient(clientId).subscribe({
                next: (client: Client) => {
                  this.client = client;
                  this.drainsTree.initialize(this.client);
                  this.drainsTree.dataChange.subscribe((data: any) => {
                    this.dataSource.data = data;
                  });
                  this.isLoading = false;
                },
                error: (error: any) => {
                  if (error.status !== 401)
                    this.httpUtils.errorDialog(error);
                }
              });
            } else {
              this.isLoading = false;
            }
          },
          error: (error: any) => {
            if (error.status !== 401)
              this.httpUtils.errorDialog(error);
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
    flatNode.client_default_drain = node.client_default_drain;
    flatNode.alert = node.alert;
    flatNode.alarm = node.alarm;
    flatNode.warning = node.warning;
    flatNode.expandable = node.children && node.children.length > 0;
    this.flatNodeMap.set(flatNode, node);
    this.nestedNodeMap.set(node, flatNode);
    if (level === 0)
      this.treeControl.expand(flatNode);
    return flatNode;
  }

  filterChanged(filterText: string, type: string) {
    this.isFiltering = true;
    this.isLoading = true;
    if (this.drainsTree.filterDrains(filterText, type))
      this.treeControl.expandAll();
    this.isLoading = false;
  }

  show(id: number): void {
    this.router.navigate(['measures/' + id]);
    if (id)
      this.router.navigate(['measures'], { queryParams: { drainIds: 'd_' + id.toString() } });
  }

  edit(type: string, id: number): void {
    this.router.navigate(['organization/' + this.org.id + '/client/' + this.client.id + '/' + type + '/' + id]);
  }

  goBack(): void {
    this.location.back();
  }
}
