import { FlatTreeControl } from '@angular/cdk/tree';
import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatTreeFlatDataSource, MatTreeFlattener } from '@angular/material/tree';

import { Client } from '../../_models/client';
import { Drain } from '../../_models/drain';
import { Feed } from '../../_models/feed';
import { Organization } from '../../_models/organization';
import { TreeItemFlatNode, TreeItemNode } from '../../_models/treenode';

import { OrganizationsTree } from '../../_utils/tree/organizations-tree';

export interface DrainsTreeDialogData {
  orgs: Organization[];
  clients: Client[];
  feeds: Feed[];
  drains: Drain[];
  singleDrain: boolean;
}

@Component({
  templateUrl: './drains-tree-dialog.component.html'
})
export class DrainsTreeDialogComponent implements OnInit {

  selectedDrains = [];
  selectedDrain: TreeItemNode = new TreeItemNode();
  singleDrain: boolean = false;
  isLoading: boolean = true;
  isFiltering: boolean = false;

  flatNodeMap = new Map<TreeItemFlatNode, TreeItemNode>();
  nestedNodeMap = new Map<TreeItemNode, TreeItemFlatNode>();
  treeControl: FlatTreeControl<TreeItemFlatNode>;
  treeFlattener: MatTreeFlattener<TreeItemNode, TreeItemFlatNode>;
  dataSource: MatTreeFlatDataSource<TreeItemNode, TreeItemFlatNode>;

  constructor(public dialogRef: MatDialogRef<DrainsTreeDialogComponent>, private organizationsTree: OrganizationsTree, @Inject(MAT_DIALOG_DATA) private data: DrainsTreeDialogData) {}

  ngOnInit() {
    this.treeFlattener = new MatTreeFlattener(this.transformer, this.getLevel, this.isExpandable, this.getChildren);
    this.treeControl = new FlatTreeControl<TreeItemFlatNode>(this.getLevel, this.isExpandable);
    this.dataSource = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener);
    this.organizationsTree.dataChange.subscribe((data: any) => {
      this.dataSource.data = data;
    });

    this.organizationsTree.initialize(this.data.orgs, [], this.data.clients, this.data.feeds, this.data.drains, [], [], [], [], []);
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
    flatNode.expandable = node.children && node.children.length > 0;
    this.flatNodeMap.set(flatNode, node);
    this.nestedNodeMap.set(node, flatNode);
    if (node.type === 'organization' || node.type === 'client')
      this.treeControl.expand(flatNode);
    return flatNode;
  }

  checkSelectedDrain(node: TreeItemNode): boolean {
    return (this.selectedDrains.filter(d => d.id === node.id).length > 0) || (this.selectedDrain && (this.selectedDrain.id === node.id));
  }

  filterChanged(filterText: string, type: string) {
    this.isFiltering = true;
    if (this.organizationsTree.filterOrgs(filterText, type))
      this.treeControl.expandAll();
    this.isFiltering = false;
  }

  selectDrain(node: TreeItemNode): void {
    if (node.type === 'drain'){
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
}
