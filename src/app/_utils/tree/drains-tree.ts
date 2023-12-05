import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

import { TreeUtils } from './tree.utils';

import { Client } from '../../_models/client';
import { Drain } from '../../_models/drain';
import { Feed } from '../../_models/feed';
import { TreeItemNode } from '../../_models/treenode';

import { ClientsService } from '../../_services/clients.service';
import { FeedsService } from '../../_services/feeds.service';

import { HttpUtils } from '../../_utils/http.utils';

@Injectable({
  providedIn: 'root',
})
export class DrainsTree {

  dataChange = new BehaviorSubject<TreeItemNode[]>([]);
  treeData: any[];
  get data(): TreeItemNode[] { return this.dataChange.value; }

  constructor(private clientsService: ClientsService, private feedsService: FeedsService, private treeUtils: TreeUtils, private httpUtils: HttpUtils) {}

  initialize(client: Client) {
    let feedsTree = this;
    let feedNodes: TreeItemNode[] = [];
    feedsTree.treeData = feedNodes;
    const data = feedsTree.treeUtils.buildTree(feedNodes, '0');
    feedsTree.dataChange.next(data);
    feedsTree.clientsService.getFeedsForClient(client).subscribe({
      next: (feeds: Feed[]) => {
        feeds.sort((a, b) => a.description < b.description ? -1 : a.description > b.description ? 1 : 0);
        feeds.forEach(function (feed) {
          let feedNode = new TreeItemNode();
          feedNode.id = feed.id;
          feedNode.item = feed.description;
          feedNode.type = 'feed';
          feedNode.code = '0.' + feed.id;
          feedNodes.push(feedNode);
          feedsTree.treeData = feedNodes;
          const data = feedsTree.treeUtils.buildTree(feedNodes, '0');
          feedsTree.dataChange.next(data);
          feedsTree.feedsService.getDrainsForFeed(feed).subscribe({
            next: (drains: Drain[]) => {
              drains.sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0);
              drains.forEach(function (drain: Drain) {
                let drainNode = new TreeItemNode();
                drainNode.id = drain.id;
                drainNode.item = drain.name + (drain.measure_unit ? ' (' + drain.measure_unit + ')' : '') + ' - ' + drain.measure_id;
                drainNode.type = 'drain';
                drainNode.code = feedNode.code + '.' + drain.id;
                drainNode.client_default_drain = drain.client_default_drain;
                drainNode.alarm = false;
                drainNode.warning = false;
                if (drain.controls) {
                  drain.controls.forEach(function (control) {
                    if (control.active && control.error) {
                      if (control.type === 'MISSING')
                        drainNode.alarm = true;
                      else if (control.type === 'MEASUREDIFF')
                        drainNode.warning = true;
                      else if (control.type === 'THRESHOLD')
                        drainNode.alert = true;
                    }
                  });
                }
                feedNodes.push(drainNode);
                feedsTree.treeData = feedNodes;
                const data = feedsTree.treeUtils.buildTree(feedNodes, '0');
                feedsTree.dataChange.next(data);
              });
            },
            error: (error: any) => {
              feedsTree.httpUtils.errorDialog(error);
            }
          });
        });
      },
      error: (error: any) => {
        feedsTree.httpUtils.errorDialog(error);
      }
    });
  }

  public filterDrains(filterText: string, type: string): boolean {
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
}
