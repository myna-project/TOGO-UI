import { FlatTreeControl } from '@angular/cdk/tree';
import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatTreeFlatDataSource, MatTreeFlattener } from '@angular/material/tree';

import { Index } from '../../_models/index';
import { IndexGroup } from '../../_models/indexgroup';
import { Organization } from '../../_models/organization';
import { TreeItemFlatNode, TreeItemNode } from '../../_models/treenode';

import { IndexGroupsService } from '../../_services/indexgroups.service';
import { IndicesService } from '../../_services/indices.service';

import { HttpUtils } from '../../_utils/http.utils';
import { OrganizationsTree } from '../../_utils/tree/organizations-tree';

export interface IndicesTreeDialogData {
  orgs: Organization[];
  indices: Index[];
}

@Component({
  templateUrl: './indices-tree-dialog.component.html'
})
export class IndicesTreeDialogComponent implements OnInit {

  allGroups: IndexGroup[];
  allIndices: Index[];
  selectedIndices: Index[] = [];
  isLoading: boolean = true;
  isFiltering: boolean = false;

  flatNodeMap = new Map<TreeItemFlatNode, TreeItemNode>();
  nestedNodeMap = new Map<TreeItemNode, TreeItemFlatNode>();
  treeControl: FlatTreeControl<TreeItemFlatNode>;
  treeFlattener: MatTreeFlattener<TreeItemNode, TreeItemFlatNode>;
  dataSource: MatTreeFlatDataSource<TreeItemNode, TreeItemFlatNode>;

  constructor(public dialogRef: MatDialogRef<IndicesTreeDialogComponent>, private indexGroupsService: IndexGroupsService, private indicesService: IndicesService, private organizationsTree: OrganizationsTree, private httpUtils: HttpUtils, @Inject(MAT_DIALOG_DATA) private data: IndicesTreeDialogData) {}

  ngOnInit() {
    this.treeFlattener = new MatTreeFlattener(this.transformer, this.getLevel, this.isExpandable, this.getChildren);
    this.treeControl = new FlatTreeControl<TreeItemFlatNode>(this.getLevel, this.isExpandable);
    this.dataSource = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener);
    this.organizationsTree.dataChange.subscribe((data: any) => {
      this.dataSource.data = data;
    });

    this.indexGroupsService.getIndexGroups().subscribe(
      (groups: IndexGroup[]) => {
        this.allGroups = groups;
        if (!this.data.indices) {
          this.indicesService.getIndices().subscribe(
            (indices: Index[]) => {
              this.allIndices = indices;
              this.organizationsTree.initialize(this.data.orgs, [], [], [], [], [], this.allGroups, this.allIndices, [], []);
              this.isLoading = false;
            },
            (error: any) => {
              this.httpUtils.errorDialog(error);
            }
          );
        } else {
          this.allIndices = this.data.indices;
          this.organizationsTree.initialize(this.data.orgs, [], [], [], [], [], this.allGroups, this.allIndices, [], []);
          this.isLoading = false;
        }
      },
      (error: any) => {
        this.httpUtils.errorDialog(error);
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
    flatNode.full_name = node.full_name;
    flatNode.level = level;
    flatNode.code = node.code;
    flatNode.expandable = node.children && node.children.length > 0;
    this.flatNodeMap.set(flatNode, node);
    this.nestedNodeMap.set(node, flatNode);
    if ((node.type === 'organization') || (node.type === 'indexgroup'))
      this.treeControl.expand(flatNode);
    return flatNode;
  }

  checkSelectedIndices(node: TreeItemNode): boolean {
    return (this.selectedIndices.filter(i => i.id === node.id).length > 0);
  }

  filterChanged(filterText: string, type: string) {
    this.isFiltering = true;
    if (this.organizationsTree.filterOrgs(filterText, type))
      this.treeControl.expandAll();
    this.isFiltering = false;
  }

  selectIndex(node: TreeItemNode): void {
    if (node.type === 'index') {
      let index = this.allIndices.find(i => (i.id === node.id));
      let i: number = this.selectedIndices.indexOf(index);
      if (i > -1) {
        this.selectedIndices.splice(i, 1);
      } else {
        this.selectedIndices.push(index);
      }
    }
  }
}
