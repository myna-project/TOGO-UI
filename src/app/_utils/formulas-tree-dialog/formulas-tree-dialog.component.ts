import { FlatTreeControl } from '@angular/cdk/tree';
import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatTreeFlatDataSource, MatTreeFlattener } from '@angular/material/tree';
import { TranslateService } from '@ngx-translate/core';

import { Client } from '../../_models/client';
import { Formula } from '../../_models/formula';
import { Organization } from '../../_models/organization';
import { TreeItemFlatNode, TreeItemNode } from '../../_models/treenode';

import { FormulasService } from '../../_services/formulas.service';

import { HttpUtils } from '../../_utils/http.utils';
import { OrganizationsTree } from '../../_utils/tree/organizations-tree';

export interface FormulasTreeDialogData {
  orgs: Organization[];
  clients: Client[];
  formulas: Formula[];
}

@Component({
  templateUrl: './formulas-tree-dialog.component.html'
})
export class FormulasTreeDialogComponent implements OnInit {

  allFormulas: Formula[] = [];
  selectedFormulas: Formula[] = [];
  isLoading: boolean = true;
  isFiltering: boolean = false;

  flatNodeMap = new Map<TreeItemFlatNode, TreeItemNode>();
  nestedNodeMap = new Map<TreeItemNode, TreeItemFlatNode>();
  treeControl: FlatTreeControl<TreeItemFlatNode>;
  treeFlattener: MatTreeFlattener<TreeItemNode, TreeItemFlatNode>;
  dataSource: MatTreeFlatDataSource<TreeItemNode, TreeItemFlatNode>;

  constructor(public dialogRef: MatDialogRef<FormulasTreeDialogComponent>, private formulasService: FormulasService, private organizationsTree: OrganizationsTree, private httpUtils: HttpUtils, private translate: TranslateService, @Inject(MAT_DIALOG_DATA) private data: FormulasTreeDialogData) {}

  ngOnInit() {
    this.treeFlattener = new MatTreeFlattener(this.transformer, this.getLevel, this.isExpandable, this.getChildren);
    this.treeControl = new FlatTreeControl<TreeItemFlatNode>(this.getLevel, this.isExpandable);
    this.dataSource = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener);
    this.organizationsTree.dataChange.subscribe((data: any) => {
      this.dataSource.data = data;
    });

    this.allFormulas = this.data.formulas;
    this.organizationsTree.initialize(this.data.orgs, [], this.data.clients, [], [], this.data.formulas, [], [], [], []);
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
    if ((node.type === 'organization') || (node.type === 'client') || (node.type === 'formulas'))
      this.treeControl.expand(flatNode);
    return flatNode;
  }

  checkSelectedFormula(node: TreeItemNode): boolean {
    return (this.selectedFormulas.filter(f => f.id === node.id).length > 0);
  }

  filterChanged(filterText: string, type: string) {
    this.isFiltering = true;
    if (this.organizationsTree.filterOrgs(filterText, type))
      this.treeControl.expandAll();
    this.isFiltering = false;
  }

  selectFormula(node: TreeItemNode): void {
    if (node.type === 'formula') {
      let formula = this.allFormulas.filter(f => (f.id === node.id))[0];
      if (formula) {
        let i: number = this.selectedFormulas.indexOf(formula);
        if (i > -1)
          this.selectedFormulas.splice(i, 1);
        else
          this.selectedFormulas.push(formula);
      }
    }
  }

  deleteFormula(node: TreeItemNode): void {
    const dialogRef = this.httpUtils.confirmDelete(this.translate.instant('FORMULASTREE.DELETECONFIRM'));
    dialogRef.afterClosed().subscribe((dialogResult: any) => {
      if (dialogResult) {
        this.formulasService.deleteFormula(node.id).subscribe(
          (_response: any) => {
            this.httpUtils.successSnackbar(this.translate.instant('FORMULASTREE.DELETEFORMULA'));
            window.location.reload();
          },
          (error: any) => {
            this.httpUtils.errorDialog(error);
          }
        );
      }
    });
  }
}
