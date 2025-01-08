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

import { OrganizationsTree } from '../../_utils/tree/organizations-tree';

export interface DrainControlDetailsTreeDialogData {
  orgs: Organization[];
  clients: Client[];
  feeds: Feed[];
  drains: Drain[];
  formulas: Formula[];
}

@Component({
  templateUrl: './draincontroldetails-tree-dialog.component.html',
  providers: [OrganizationsTree]
})
export class DrainControlDetailsTreeDialogComponent implements OnInit {

  isLoading: boolean = true;

  flatNodeMap = new Map<TreeItemFlatNode, TreeItemNode>();
  nestedNodeMap = new Map<TreeItemNode, TreeItemFlatNode>();
  treeControl: FlatTreeControl<TreeItemFlatNode>;
  treeFlattener: MatTreeFlattener<TreeItemNode, TreeItemFlatNode>;
  dataSource: MatTreeFlatDataSource<TreeItemNode, TreeItemFlatNode>;

  constructor(public dialogRef: MatDialogRef<DrainControlDetailsTreeDialogComponent>, private organizationsTree: OrganizationsTree, @Inject(MAT_DIALOG_DATA) private data: DrainControlDetailsTreeDialogData) {}

  ngOnInit() {
    this.treeFlattener = new MatTreeFlattener(this.transformer, this.getLevel, this.isExpandable, this.getChildren);
    this.treeControl = new FlatTreeControl<TreeItemFlatNode>(this.getLevel, this.isExpandable);
    this.dataSource = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener);
    this.organizationsTree.dataChange.subscribe((data: any) => {
      this.dataSource.data = data;
    });

    this.organizationsTree.initialize(this.data.orgs, [], this.data.clients, this.data.feeds, this.data.drains, this.data.formulas, [], [], [], [], false, 'feed');
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
    this.treeControl.expand(flatNode);
    return flatNode;
  }
}
