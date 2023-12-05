import { Injectable } from '@angular/core';

import { TreeItemNode } from '../../_models/treenode';

@Injectable({
  providedIn: 'root',
})
export class TreeUtils {

  constructor() {}

  public buildTree(obj: any[], level: string): TreeItemNode[] {
    return obj.filter(o => (<string>o.code).startsWith(level + '.') && (o.code.match(/\./g) || []).length === (level.match(/\./g) || []).length + 1)
      .map(o => {
        const node = new TreeItemNode();
        node.id = o.id;
        node.item = o.item;
        node.full_name = o.full_name;
        node.type = o.type;
        node.subtype = o.subtype;
        node.code = o.code;
        node.client_default_drain = o.client_default_drain;
        node.default_drain_ids = o.default_drain_ids;
        node.formula_ids = o.formula_ids;
        node.alert = o.alert;
        node.alarm = o.alarm;
        node.warning = o.warning;
        node.has_details = o.has_details;
        node.view_details = o.view_details;
        node.expanded = o.expanded;
        const children = obj.filter(so => (<string>so.code).startsWith(level + '.'));
        if (children && children.length > 0)
          node.children = this.buildTree(children, o.code);
        return node;
      });
  }

  public filter(filterText: string, type: string, data: any[]): any[] {
    let filteredTreeData: any[];
    if (filterText) {
      filteredTreeData = data.filter(d => ((d.item.toLocaleLowerCase().indexOf(filterText.toLocaleLowerCase()) > -1) && (d.type == type)));
      Object.assign([], filteredTreeData).forEach(ftd => {
        let str = (<string>ftd.code);
        while (str.lastIndexOf('.') > -1) {
          const index = str.lastIndexOf('.');
          str = str.substring(0, index);
          if (filteredTreeData.findIndex(t => t.code === str) === -1) {
            const obj = data.find(d => d.code === str);
            if (obj) {
              if (obj.type === 'client')
                obj.has_details = false;
              filteredTreeData.push(obj);
            }
          }
        }
        const objs = data.filter(d => d.code.indexOf(ftd.code + '.') !== -1);
        objs.forEach(obj => {
          if (!filteredTreeData.find(o => o.code === obj.code))
            filteredTreeData.push(obj);
        });
      });
    } else {
      filteredTreeData = data;
    }

    return filteredTreeData;
  }
}
