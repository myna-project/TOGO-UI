import { FlatTreeControl } from '@angular/cdk/tree';
import { Location } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatTreeFlatDataSource, MatTreeFlattener } from '@angular/material/tree';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';

import { DrainControl } from '../../_models/draincontrol';
import { Organization } from '../../_models/organization';
import { TreeItemFlatNode, TreeItemNode } from './../../_models/treenode';

import { DrainControlsService } from '../../_services/draincontrols.service';
import { OrganizationsService } from '../../_services/organizations.service';

import { HttpUtils } from '../../_utils/http.utils';
import { OrganizationsTree } from '../../_utils/tree/organizations-tree';

@Component({
  templateUrl: './draincontrols-list.component.html',
  styleUrls: ['./draincontrols-list.component.scss'],
  providers: [OrganizationsTree]
})
export class DrainControlsComponent implements OnInit {

  isLoading: boolean = true;
  allOrgs: Organization[];
  allControls: DrainControl[];
  isFiltering: boolean = false;
  backRoute: string = 'drainControls';

  flatNodeMap = new Map<TreeItemFlatNode, TreeItemNode>();
  nestedNodeMap = new Map<TreeItemNode, TreeItemFlatNode>();
  treeControl: FlatTreeControl<TreeItemFlatNode>;
  treeFlattener: MatTreeFlattener<TreeItemNode, TreeItemFlatNode>;
  dataSource: MatTreeFlatDataSource<TreeItemNode, TreeItemFlatNode>;

  constructor(private orgsService: OrganizationsService, private drainControlsService: DrainControlsService, private router: Router, private location: Location, private organizationsTree: OrganizationsTree, private httpUtils: HttpUtils) {}

  ngOnInit(): void {
    this.treeFlattener = new MatTreeFlattener(this.transformer, this.getLevel, this.isExpandable, this.getChildren);
    this.treeControl = new FlatTreeControl<TreeItemFlatNode>(this.getLevel, this.isExpandable);
    this.dataSource = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener);

    forkJoin([this.orgsService.getOrganizations(), this.drainControlsService.getDrainControls()]).subscribe({
      next: (results: any) => {
        this.allOrgs = results[0];
        this.allControls = results[1];
        this.organizationsTree.initialize(this.allOrgs, [], [], [], [], [], [], [], this.allControls, [], true, 'feed');
        this.organizationsTree.dataChange.subscribe((data: any) => {
          this.dataSource.data = data;
        });
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
    this.router.navigate(['draincontrol/' + id]);
  }

  goBack(): void {
    this.location.back();
  }
}
