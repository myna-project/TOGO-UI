import { FlatTreeControl } from '@angular/cdk/tree';
import { Component, Input, OnInit } from '@angular/core';
import { MatTreeFlatDataSource, MatTreeFlattener } from '@angular/material/tree';
import { TranslateService } from '@ngx-translate/core';

import { Client } from '../../_models/client';
import { Drain } from '../../_models/drain';
import { Feed } from '../../_models/feed';
import { Formula } from '../../_models/formula';
import { Index } from "../../_models";
import { IndexGroup } from "../../_models/indexgroup";
import { Organization } from '../../_models/organization';
import { TreeItemFlatNode, TreeItemNode } from '../../_models/treenode';

import { AuthenticationService } from '../../_services/authentication.service';
import { FormulasService } from '../../_services/formulas.service';

import { HttpUtils } from '../../_utils/http.utils';
import { OrganizationsTree } from '../../_utils/tree/organizations-tree';

import { MeasuresComponent } from '../../measures/measures.component';

export interface DrainsTreeSidenavData {
  orgs: Organization[];
  clients: Client[];
  feeds: Feed[];
  drains: Drain[];
  formulas: Formula[];
  indices: Index[];
  indexGroups: IndexGroup[];
  showDetails: boolean;
  parentComponent: MeasuresComponent;
}

@Component({
  selector: 'app-drains-tree-sidenav',
  templateUrl: './drains-tree-sidenav.component.html'
})
export class DrainsTreeSidenavComponent implements OnInit {

  @Input() data: DrainsTreeSidenavData;

  isClickable: boolean = true;
  isDarkTheme: boolean;
  isFiltering: boolean = false;
  isLoading: boolean = true;
  parentComponent: MeasuresComponent;
  removing: boolean;
  showDetails: boolean = false;
  filterTextValue: string;
  typeValue: string;
  depthTree: string;
  searchType: string;

  flatNodeMap = new Map<TreeItemFlatNode, TreeItemNode>();
  nestedNodeMap = new Map<TreeItemNode, TreeItemFlatNode>();
  treeControl: FlatTreeControl<TreeItemFlatNode>;
  treeFlattener: MatTreeFlattener<TreeItemNode, TreeItemFlatNode>;
  dataSource: MatTreeFlatDataSource<TreeItemNode, TreeItemFlatNode>;

  constructor(private authService: AuthenticationService, private organizationsTree: OrganizationsTree, private httpUtils: HttpUtils, private formulasService: FormulasService, private translate: TranslateService) {}

  ngOnInit() {
    let currentUser = this.authService.getCurrentUser();
    this.depthTree = currentUser.drain_tree_depth;
    this.isDarkTheme = currentUser.dark_theme;
    console.log(currentUser);
    this.treeFlattener = new MatTreeFlattener(this.transformer, this.getLevel, this.isExpandable, this.getChildren);
    this.treeControl = new FlatTreeControl<TreeItemFlatNode>(this.getLevel, this.isExpandable);
    this.dataSource = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener);
    this.organizationsTree.dataChange.subscribe((data: any) => {
      this.dataSource.data = data;
    });
    this.organizationsTree.initialize(this.data.orgs, [], this.data.clients, this.data.feeds, this.data.drains, this.data.formulas, this.data.indexGroups, this.data.indices, [], [], this.data.showDetails, this.depthTree);

    this.parentComponent = this.data.parentComponent;
    this.showDetails = this.data.showDetails ? this.data.showDetails : false;
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
    flatNode.selected = node.selected;
    flatNode.expanded = node.expanded;

    this.flatNodeMap.set(flatNode, node);
    this.nestedNodeMap.set(node, flatNode);
    if (this.data.showDetails || node.expanded || node.view_details)
      this.treeControl.expand(flatNode);
    return flatNode;
  }

  changeSearchType(searchType: string) {
    this.searchType = (searchType !== this.searchType) ? searchType : '';
  }

  filterChanged(filterText: string, type: string) {
    this.isFiltering = true;
    if (this.organizationsTree.filterByType(filterText, type, this.showDetails))
      this.treeControl.expandAll();
    this.isFiltering = false;
    this.filterTextValue = filterText;
    this.typeValue = type;
  }

  changeViewDetails(node: TreeItemFlatNode): void {
    node.is_loading = true;
    setTimeout(() => {
      this.organizationsTree.changeViewDetails(node);
      if (this.filterTextValue && this.filterTextValue !== '')
        this.filterChanged(this.filterTextValue, this.typeValue);
      node.is_loading = false;
    }, 500);
  }

  selectNode(node: TreeItemNode, readd: boolean, remove: boolean): void {
    if (this.isClickable && ((node.type == 'drain') || (node.type == 'formula') || (node.type == 'index'))) {
      this.isClickable = false;
      if (remove || ((node.type === 'index') && node.selected)) {
        this.parentComponent.removeNode(node);
        this.isClickable = true;
      } else if (!node.selected || readd) {
        this.isClickable = false;
        this.parentComponent.addNode(node, true, true);
      } else {
        this.isClickable = true;
      }
    }
  }

  editNode(id: number, type: string, selected: boolean) {
    let node = this.treeControl.dataNodes.find(node => ((node.id === id) && (node.type === type)));
    if (node)
      node.selected = selected;
  }

  endLoadingMeasure(): void {
    this.isClickable = true;
  }

  deleteFormula(node: TreeItemNode): void {
    const dialogRef = this.httpUtils.confirmDelete(this.translate.instant('FORMULASTREE.DELETECONFIRM'));
    dialogRef.afterClosed().subscribe((dialogResult: any) => {
      if (dialogResult) {
        this.formulasService.deleteFormula(node.id).subscribe({
          next: (_response: any) => {
            this.httpUtils.successSnackbar(this.translate.instant('FORMULASTREE.DELETEFORMULA'));
            window.location.reload();
          },
          error: (error: any) => {
            this.httpUtils.errorDialog(error);
          }
        });
      }
    });
  }
}
