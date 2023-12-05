import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

import { TreeUtils } from './tree.utils';

import { Client } from '../../_models/client';
import { TreeItemNode } from '../../_models/treenode';

@Injectable({
  providedIn: 'root',
})
export class ClientsTree {

  dataChange = new BehaviorSubject<TreeItemNode[]>([]);
  treeData: any[];
  get data(): TreeItemNode[] { return this.dataChange.value; }

  constructor(private treeUtils: TreeUtils) {}

  initialize(clients: Client[], controllerView: boolean) {
    let clientsTree = this;
    let clientNodes: TreeItemNode[] = [];
    let parentClients = clients.filter(client => controllerView ? ((client.controller_id === undefined) || (client.controller_id === null)) : ((client.parent_id === undefined) || (client.parent_id === null)));
    parentClients.sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0);
    parentClients.forEach(function (client) {
      let clientNode = new TreeItemNode();
      clientNode.id = client.id;
      clientNode.item = client.name;
      clientNode.type = 'client';
      clientNode.code = '0.' + client.id;
      clientNode.default_drain_ids = client.default_drain_ids;
      clientNode.formula_ids = client.formula_ids;
      clientNode.alert = client.alert;
      clientNode.alarm = client.alarm;
      clientNode.warning = client.warning;
      clientNodes.push(clientNode);
      clientNodes = clientsTree.createChildrenTree(clientsTree, clients, clientNodes, clientNode, client, controllerView);
    });
    this.treeData = clientNodes;
    const data = this.treeUtils.buildTree(clientNodes, '0');
    this.dataChange.next(data);
  }

  public filterClients(filterText: string, type: string): boolean {
    let filteredTreeData = this.treeData;
    let expandAll = false;
    if (filterText) {
      filteredTreeData = this.treeUtils.filter(filterText, type, this.treeData);
      expandAll = true;
    }

    const data = this.treeUtils.buildTree(filteredTreeData, '0');
    this.dataChange.next(data);

    return expandAll;
  }

  public createChildrenTree(clientsTree: ClientsTree, clients: Client[], clientNodes: TreeItemNode[], fatherNode: TreeItemNode, parentClient: Client, controllerView: boolean): TreeItemNode[] {
    let childrenClients = clients.filter(c => (c.parent_id == parentClient.id));
    if (controllerView)
      childrenClients = clients.filter(c => (c.controller_id == parentClient.id));
    childrenClients.sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0);
    childrenClients.forEach(function (child) {
      let childNode = new TreeItemNode();
      childNode.id = child.id;
      childNode.item = child.name;
      childNode.type = 'client';
      childNode.code = (fatherNode.code ? fatherNode.code : '0') + '.' + child.id;
      childNode.default_drain_ids = child.default_drain_ids;
      childNode.formula_ids = child.formula_ids;
      childNode.alert = child.alert;
      childNode.alarm = child.alarm;
      childNode.warning = child.warning;
      clientNodes.push(childNode);
      clientNodes = clientsTree.createChildrenTree(clientsTree, clients, clientNodes, childNode, child, controllerView);
    });

    return clientNodes;
  }
}
