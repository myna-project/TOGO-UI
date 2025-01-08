import { FlatTreeControl } from '@angular/cdk/tree';
import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatTreeFlatDataSource, MatTreeFlattener } from '@angular/material/tree';

import { Client } from '../../_models/client';
import { Drain } from '../../_models/drain';
import { Feed } from '../../_models/feed';
import { Formula } from '../../_models/formula';
import { Organization } from '../../_models/organization';
import { TreeItemFlatNode, TreeItemNode } from '../../_models/treenode';

import { AuthenticationService } from '../../_services/authentication.service';

import { OrganizationsTree } from '../../_utils/tree/organizations-tree';

export interface DrainsTreeDialogData {
  orgs: Organization[];
  clients: Client[];
  feeds: Feed[];
  drains: Drain[];
  formulas: Formula[];
  showDetails: boolean;
  singleDrain: boolean;
}

@Component({
  templateUrl: './drains-tree-dialog.component.html',
  providers: [OrganizationsTree]
})
export class DrainsTreeDialogComponent implements OnInit {

  selectedDrains = [];
  selectedDrain: TreeItemNode = new TreeItemNode();
  showDetails: boolean = false;
  singleDrain: boolean = false;
  filterTextValue: string;
  typeValue: string;
  isFiltering: boolean = false;
  isLoading: boolean = true;
  depthTree: string;

  flatNodeMap = new Map<TreeItemFlatNode, TreeItemNode>();
  nestedNodeMap = new Map<TreeItemNode, TreeItemFlatNode>();
  treeControl: FlatTreeControl<TreeItemFlatNode>;
  treeFlattener: MatTreeFlattener<TreeItemNode, TreeItemFlatNode>;
  dataSource: MatTreeFlatDataSource<TreeItemNode, TreeItemFlatNode>;

  constructor(public dialogRef: MatDialogRef<DrainsTreeDialogComponent>, private authService: AuthenticationService, private organizationsTree: OrganizationsTree, @Inject(MAT_DIALOG_DATA) private data: DrainsTreeDialogData) {}

  ngOnInit() {
    let currentUser = this.authService.getCurrentUser();
    this.depthTree = currentUser.drain_tree_depth;
    this.treeFlattener = new MatTreeFlattener(this.transformer, this.getLevel, this.isExpandable, this.getChildren);
    this.treeControl = new FlatTreeControl<TreeItemFlatNode>(this.getLevel, this.isExpandable);
    this.dataSource = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener);
    this.organizationsTree.dataChange.subscribe((data: any) => {
      this.dataSource.data = data;
    });
    this.organizationsTree.initialize(this.data.orgs, [], this.data.clients, this.data.feeds, this.data.drains, this.data.formulas, [], [], [], [], this.data.showDetails, this.depthTree);

    this.showDetails = this.data.showDetails ? this.data.showDetails : false;
    this.singleDrain = this.data.singleDrain ? this.data.singleDrain : false;

    this.isLoading = false;
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
    flatNode.has_details = node.has_details;
    flatNode.view_details = node.view_details;
    flatNode.expandable = node.children && node.children.length > 0;
    if (node.type == 'drain')
      flatNode.client_default_drain = node.client_default_drain;
    if (node.type == 'client')
      flatNode.default_drain_ids = node.default_drain_ids;
    flatNode.expanded = node.expanded;

    this.flatNodeMap.set(flatNode, node);
    this.nestedNodeMap.set(node, flatNode);
    if (this.data.showDetails || node.expanded || node.view_details)
      this.treeControl.expand(flatNode);
    return flatNode;
  }

  checkSelectedDrain(node: TreeItemNode): boolean {
    return (this.selectedDrains.filter(d => ((d.id === node.id) && (d.type === node.type))).length > 0) || (this.selectedDrain && (this.selectedDrain.id === node.id));
  }

  filterChanged(filterText: string, type: string) {
    this.isFiltering = true;
    if (this.organizationsTree.filterByType(filterText, type, this.showDetails))
      this.treeControl.expandAll();
    this.isFiltering = false;
    this.filterTextValue = filterText;
    this.typeValue = type;
  }

  selectDrain(node: TreeItemNode): void {
    if ((node.type === 'drain') || (node.type === 'formula')) {
      if (this.data.singleDrain) {
        this.selectedDrain = (this.selectedDrain && (this.selectedDrain.id === node.id)) ? null : node;
      } else {
        let i: number = this.selectedDrains.indexOf(node);
        if (i > -1)
          this.selectedDrains.splice(i, 1);
        else
          this.selectedDrains.push(node);
      }
    }
  }

  detailsDrainButton(node: TreeItemFlatNode): void {
    node.is_loading = true;
    setTimeout(() => {
      this.organizationsTree.changeViewDetails(node);
      if (this.filterTextValue && this.filterTextValue !== '')
        this.filterChanged(this.filterTextValue, this.typeValue);
      node.is_loading = false;
    }, 500);
  }
}
