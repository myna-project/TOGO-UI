import { FlatTreeControl } from '@angular/cdk/tree';
import { Component, OnInit } from '@angular/core';
import { MatTreeFlatDataSource, MatTreeFlattener } from '@angular/material/tree';
import { Router } from '@angular/router';

import { Organization } from '../../_models/organization';
import { TreeItemFlatNode, TreeItemNode } from '../../_models/treenode';

import { OrganizationsService } from '../../_services/organizations.service';

import { HttpUtils } from '../../_utils/http.utils';
import { OrganizationsTree } from '../../_utils/tree/organizations-tree';

@Component({
  templateUrl: './organizations-list.component.html',
  styleUrls: ['./organizations-list.component.scss'],
  providers: [OrganizationsTree]
})
export class OrganizationsComponent implements OnInit {

  isLoading: boolean = true;
  orgsForClients: boolean = false;
  allOrgs: Organization[];
  isFiltering: boolean = false;

  flatNodeMap = new Map<TreeItemFlatNode, TreeItemNode>();
  nestedNodeMap = new Map<TreeItemNode, TreeItemFlatNode>();
  treeControl: FlatTreeControl<TreeItemFlatNode>;
  treeFlattener: MatTreeFlattener<TreeItemNode, TreeItemFlatNode>;
  dataSource: MatTreeFlatDataSource<TreeItemNode, TreeItemFlatNode>;

  constructor(private orgsService: OrganizationsService, private router: Router, private httpUtils: HttpUtils, private organizationsTree: OrganizationsTree) {}

  ngOnInit(): void {
    this.treeFlattener = new MatTreeFlattener(this.transformer, this.getLevel, this.isExpandable, this.getChildren);
    this.treeControl = new FlatTreeControl<TreeItemFlatNode>(this.getLevel, this.isExpandable);
    this.dataSource = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener);

    this.orgsService.getOrganizations().subscribe({
      next: (orgs: Organization[]) => {
        this.allOrgs = orgs;
        if (this.router.url === '/clients') {
          if (this.allOrgs.length === 1)
            this.router.navigate(['organization/' + this.allOrgs[0].id + '/clients']);
          this.orgsForClients = true;
        }
        this.organizationsTree.initialize(this.allOrgs, [], [], [], [], [], [], [], [], [], true, 'org');
        this.organizationsTree.dataChange.subscribe((data: any) => {
          this.dataSource.data = data;
        });
        this.isLoading = false;
      },
      error: (error: any) => {
        if (error.status !== 401)
          this.httpUtils.errorDialog(error);
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
    if (this.organizationsTree.filterByType(filterText, type, true))
      this.treeControl.expandAll();
    this.isLoading = false;
  }

  edit(id: number): void {
    this.router.navigate(['organization/' + id]);
  }

  showClients(id: number): void {
    this.router.navigate(['organization/' + id + '/clients']);
  }
}
