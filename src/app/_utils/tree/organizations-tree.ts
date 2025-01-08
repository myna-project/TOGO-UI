import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

import { TreeUtils } from './tree.utils';

import { Client } from '../../_models/client';
import { Drain } from '../../_models/drain';
import { DrainControl } from '../../_models/draincontrol';
import { Feed } from '../../_models/feed';
import { Formula } from '../../_models/formula';
import { Index } from '../../_models/index';
import { IndexGroup } from '../../_models/indexgroup';
import { InvoiceItem } from '../../_models/invoiceitem';
import { Job } from '../../_models/job';
import { Organization } from '../../_models/organization';
import { TreeItemFlatNode, TreeItemNode } from '../../_models/treenode';
import { TranslateService } from "@ngx-translate/core";

@Injectable()
export class OrganizationsTree {

  allOrgs: Organization[] = [];
  allJobs: Job[] = [];
  allClients: Client[] = [];
  allFeeds: Feed[] = [];
  allDrains: Drain[] = [];
  allFormulas: Formula[] = [];
  allIndices: Index[] = [];
  allIndexGroups: IndexGroup[] = [];
  allDrainControls: DrainControl[] = [];
  allInvoiceItemkWh: InvoiceItem[] = [];
  showDetails: boolean = false;
  orgNodes: TreeItemNode[] = [];
  dataChange = new BehaviorSubject<TreeItemNode[]>([]);
  treeData: any[];
  depthTree: string;

  get data(): TreeItemNode[] {
    return this.dataChange.value;
  }

  constructor(private treeUtils: TreeUtils, private translate: TranslateService) {}

  initialize(orgs: Organization[], jobs: Job[], clients: Client[], feeds: Feed[], drains: Drain[], formulas: Formula[], indexgroups: IndexGroup[], indices: Index[], controls: DrainControl[], invoiceitemskWh: InvoiceItem[], showDetails: boolean, depthTree: string) {
    let orgsTree = this;
    orgsTree.allOrgs = orgs;
    orgsTree.allJobs = jobs;
    orgsTree.allClients = clients;
    orgsTree.allFeeds = feeds;
    orgsTree.allDrains = drains;
    orgsTree.allFormulas = formulas;
    orgsTree.allIndexGroups = indexgroups;
    orgsTree.allIndices = indices;
    orgsTree.allDrainControls = controls;
    orgsTree.allInvoiceItemkWh = invoiceitemskWh;
    orgsTree.showDetails = showDetails;
    orgsTree.depthTree = depthTree;
    orgsTree.orgNodes = [];
    orgsTree.treeData = [];
    orgsTree.dataChange.next(orgsTree.treeUtils.buildTree(orgsTree.orgNodes, '0'));
    let parentOrgs = orgsTree.allOrgs.filter(org => ((org.parent_id === undefined) || (org.parent_id === null)));
    if (parentOrgs.length === 0) {
      this.allOrgs.forEach(function(org) {
        let checkParent = orgsTree.allOrgs.filter(o => (o.id === org.parent_id));
        if (checkParent.length === 0)
          parentOrgs.push(org);
      });
    }
    parentOrgs.sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0);
    parentOrgs.forEach(function(org) {
      let orgNode = new TreeItemNode();
      orgNode.id = org.id;
      orgNode.item = org.name;
      orgNode.full_name = org.name;
      orgNode.type = 'organization';
      orgNode.code = '0.' + org.id;
      orgNode.expanded = (orgsTree.depthTree !== 'org') || (orgsTree.allOrgs.filter(o => (o.parent_id == org.id)).length > 0 && orgsTree.depthTree === 'org' );
      orgsTree.orgNodes.push(orgNode);
      orgsTree.createChildrenTree(orgsTree, orgNode, org);
    });
    orgsTree.treeData = orgsTree.orgNodes;
    orgsTree.dataChange.next(orgsTree.treeUtils.buildTree(orgsTree.orgNodes, '0'));
  }

  getTreeData(orgs: Organization[], jobs: Job[], clients: Client[], feeds: Feed[], drains: Drain[], formulas: Formula[], indexgroups: IndexGroup[], indices: Index[], controls: DrainControl[], invoiceItemskWh: InvoiceItem[]): TreeItemNode[] {
    this.initialize(orgs, jobs, clients, feeds, drains, formulas, indexgroups, indices, controls, invoiceItemskWh, true, "feed");
    return this.treeUtils.buildTree(this.orgNodes, '0');
  }

  createChildrenTree(orgsTree: OrganizationsTree, fatherNode: TreeItemNode, parentOrg: Organization): void {
    orgsTree.createJobsTree(orgsTree, fatherNode, parentOrg);
    orgsTree.createClientsTree(orgsTree, fatherNode, parentOrg);
    orgsTree.createFormulasTree(orgsTree, fatherNode, parentOrg, null);
    orgsTree.createIndicesTree(orgsTree, fatherNode, parentOrg);
    orgsTree.createDrainControlsTree(orgsTree, fatherNode, parentOrg);
    let childrenOrgs = orgsTree.allOrgs.filter(org => (org.parent_id == parentOrg.id));
    childrenOrgs.sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0);
    childrenOrgs.forEach(function(child) {
      let childNode = new TreeItemNode();
      childNode.id = child.id;
      childNode.item = child.name;
      childNode.full_name = child.name;
      childNode.type = 'organization';
      childNode.code = (fatherNode.code ? fatherNode.code : '0') + '.' + child.id;
      childNode.expanded = ((orgsTree.depthTree === 'feed') || (orgsTree.depthTree === 'clientChild') || (orgsTree.depthTree === 'clientFather') || (orgsTree.depthTree === 'drain'));
      orgsTree.orgNodes.push(childNode);
      orgsTree.createChildrenTree(orgsTree, childNode, child);
      if (childNode.expanded)
        fatherNode.expanded = true;
    });
  }

  createClientsTree(orgsTree: OrganizationsTree, fatherNode: TreeItemNode, org: Organization): void {
    if (orgsTree.allClients.length > 0) {
      let orgClients = orgsTree.allClients.filter(client => (client.org_id == org.id));
      orgClients.sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0);
      let parentClients = orgClients.filter(client => ((client.parent_id === undefined) || (client.parent_id === null)));
      parentClients.sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0);
      parentClients.forEach(function(client) {
        let clientNode = new TreeItemNode();
        clientNode.id = client.id;
        clientNode.item = client.name;
        clientNode.full_name = ((orgsTree.allOrgs.length > 1) ? org.name + ' - ' : '') + client.name;
        clientNode.type = 'client';
        clientNode.code = (fatherNode.code ? fatherNode.code : '0') + '.c' + client.id;
        clientNode.default_drain_ids = client.default_drain_ids;
        clientNode.formula_ids = client.formula_ids;
        clientNode.has_details = (client.feed_ids && (client.feed_ids.length > 0));
        clientNode.view_details = orgsTree.showDetails || client.view_details;
        clientNode.expanded = ((orgsTree.depthTree === 'feed') || (orgsTree.depthTree === 'clientChild') || (orgsTree.depthTree === 'drain'));
        orgsTree.orgNodes.push(clientNode);
        orgsTree.createChildrenClientsTree(orgsTree, clientNode, client, org);
        if (clientNode.view_details || clientNode.expanded)
          fatherNode.expanded = true;
      });
    }
  }

  createChildrenClientsTree(orgsTree: OrganizationsTree, fatherNode: TreeItemNode, parentClient: Client, org: Organization): void {
    if (orgsTree.allFeeds.length > 0)
      orgsTree.createFeedsTree(orgsTree, fatherNode, parentClient, org);
    if (orgsTree.allFormulas.length > 0)
      orgsTree.createFormulasTree(orgsTree, fatherNode, org, parentClient);
    let childrenClients = orgsTree.allClients.filter(client => (client.parent_id == parentClient.id));
    childrenClients.sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0);
    childrenClients.forEach(function(child) {
      let childNode = new TreeItemNode();
      childNode.id = child.id;
      childNode.item = child.name;
      childNode.full_name = ((orgsTree.allOrgs.length > 1) ? org.name + ' - ' : '') + child.name;
      childNode.type = 'client';
      childNode.code = (fatherNode.code ? fatherNode.code : '0') + '.c' + child.id;
      childNode.default_drain_ids = child.default_drain_ids;
      childNode.formula_ids = child.formula_ids;
      childNode.has_details = (child.feed_ids && (child.feed_ids.length > 0));
      childNode.view_details = orgsTree.showDetails || child.view_details;
      childNode.expanded = ((orgsTree.depthTree === 'feed') || (orgsTree.depthTree === 'drain'));
      orgsTree.orgNodes.push(childNode);
      orgsTree.createChildrenClientsTree(orgsTree, childNode, child, org);
      if (childNode.view_details || childNode.expanded)
        fatherNode.expanded = (childNode.view_details || childNode.expanded);
    });
  }

  createFeedsTree(orgsTree: OrganizationsTree, fatherNode: TreeItemNode, client: Client, org: Organization): void {
    let clientFeeds = orgsTree.allFeeds.filter(f => (f.client_ids.indexOf(client.id) > -1));
    clientFeeds.sort((a, b) => a.description < b.description ? -1 : a.description > b.description ? 1 : 0);
    clientFeeds.forEach(function(feed) {
      let feedNode = new TreeItemNode();
      feedNode.id = feed.id;
      feedNode.item = feed.description;
      feedNode.full_name = ((orgsTree.allOrgs.length > 1) ? org.name + ' - ' : '') + client.name + ' - ' + feed.description;
      feedNode.type = 'feed';
      feedNode.code = (fatherNode.code ? fatherNode.code : '0') + '.f' + feed.id;
      feedNode.expanded = (orgsTree.depthTree === 'drain');
      let defaultDrains = false;
      if (orgsTree.allDrains.length > 0) {
        let feedDrains = orgsTree.allDrains.filter(d => (d.feed_id == feed.id) && (orgsTree.showDetails || fatherNode.view_details || d.client_default_drain));
        feedDrains.sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0);
        feedDrains.forEach(function(drain) {
          let drainNode = new TreeItemNode();
          drainNode.id = drain.id;
          drainNode.item = drain.name + (drain.measure_unit ? ' (' + drain.measure_unit + ')' : '');
          drainNode.full_name = ((orgsTree.allOrgs.length > 1) ? org.name + ' - ' : '') + client.name + ' - ' + feedNode.item + ' - ' + drain.name + (drain.measure_unit ? ' (' + drain.measure_unit + ')' : '');
          drainNode.type = 'drain';
          drainNode.code = (feedNode.code ? feedNode.code : '0') + '.d' + drain.id;
          drainNode.client_default_drain = drain.client_default_drain;
          drainNode.selected = drain.selected;
          orgsTree.orgNodes.push(drainNode);
          if (drain.client_default_drain)
            defaultDrains = true;
          if (orgsTree.allInvoiceItemkWh.length > 0) {
            let drainInvoiceItemskWhYear: InvoiceItem[] = [];
            let years = [];
            orgsTree.allInvoiceItemkWh.forEach(i => {
              if (i.drain_id === drain.id) {
                drainInvoiceItemskWhYear.push(i);
                if (years.length === 0) {
                  years.push(i.year);
                } else {
                  if (!years.find(y => y === i.year))
                    years.push(i.year);
                }
              }
            });
            years.sort((a, b) => a < b ? 1 : a > b ? -1 : 0);
            years.forEach(year => {
              let yearNode = new TreeItemNode();
              yearNode.id = drain.id;
              yearNode.item = year.toString();
              yearNode.full_name = drain.id + '-' + year;
              yearNode.type = 'invoiceItemkWhYear';
              yearNode.code = (drainNode.code ? drainNode.code : '0') + '.y' + year;
              orgsTree.orgNodes.push(yearNode);
              let drainInvoiceItemskWh = drainInvoiceItemskWhYear.filter(item => item.year === year);
              drainInvoiceItemskWh.sort((a: InvoiceItem, b: InvoiceItem) => +a.month > +b.month ? -1 : +a.month < +b.month ? 1 : 0);
              drainInvoiceItemskWh.forEach(item => {
                let invoiceItemkWhNode = new TreeItemNode();
                invoiceItemkWhNode.id = item.id;
                invoiceItemkWhNode.item = item.vendor_name + ' - ' + item.month_name;
                invoiceItemkWhNode.full_name = ((orgsTree.allOrgs.length > 1) ? org.name + ' - ' : '') + client.name + ' - ' + feedNode.item + ' - ' + drain.name + (drain.measure_unit ? ' (' + drain.measure_unit + ')' : '' + item.month + ' ' + item.year);
                invoiceItemkWhNode.type = 'invoiceItemkWh';
                invoiceItemkWhNode.code = (yearNode.code ? yearNode.code : '0') + '.i' + item.id;
                orgsTree.orgNodes.push(invoiceItemkWhNode);
              });
            });
          }
        });
      }
      if (orgsTree.showDetails || fatherNode.view_details || defaultDrains)
        orgsTree.orgNodes.push(feedNode);
    });
  }

  createJobsTree(orgsTree: OrganizationsTree, fatherNode: TreeItemNode, org: Organization): void {
    if (orgsTree.allJobs.length > 0) {
      let jobOrgs = orgsTree.allJobs.filter(job => (job.org_id == org.id));
      jobOrgs.sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0);
      jobOrgs.forEach(function(job) {
        let jobNode = new TreeItemNode();
        jobNode.id = job.id;
        jobNode.item = job.name;
        jobNode.type = 'job';
        jobNode.code = (fatherNode.code ? fatherNode.code : '0') + '.j' + job.id;
        orgsTree.orgNodes.push(jobNode);
      });
    }
  }

  createFormulasTree(orgsTree: OrganizationsTree, fatherNode: TreeItemNode, org: Organization, client: Client): void {
    if (orgsTree.allFormulas.length > 0) {
      let formulaOrgs = orgsTree.allFormulas.filter(formula => client ? (formula.client_id === client.id) : ((formula.org_id === org.id) && !formula.client_id));
      if (formulaOrgs.length > 0) {
        let formulasNode = new TreeItemNode();
        formulasNode.id = -1;
        formulasNode.item = this.translate.instant('FORMULASTREE.ITEM');
        formulasNode.full_name = org.name + (client ? ' ' + client.name : '');
        formulasNode.type = 'formulas';
        formulasNode.code = (fatherNode.code ? fatherNode.code : '0') + '.fs';
        orgsTree.orgNodes.push(formulasNode);
        formulaOrgs.sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0);
        formulaOrgs.forEach(function(formula) {
          let formulaNode = new TreeItemNode();
          formulaNode.id = formula.id;
          formulaNode.item = formula.name;
          formulaNode.type = 'formula';
          formulaNode.code = (formulasNode.code ? formulasNode.code : '0') + '.f' + formula.id;
          formulaNode.selected = formula.selected;
          orgsTree.orgNodes.push(formulaNode);
        });
      }
    }
  }

  createIndicesTree(orgsTree: OrganizationsTree, fatherNode: TreeItemNode, org: Organization): void {
      let indexOrgs = orgsTree.allIndices.filter(index =>  index.org_id === org.id);
     if (indexOrgs.length > 0) {
      let indicesNode = new TreeItemNode();
      indicesNode.id = -1;
      indicesNode.item = this.translate.instant('INDEX.ITEM');
      indicesNode.full_name = org.name + (org ? ' ' + org.name : '');
      indicesNode.type = 'indexes';
      indicesNode.code = (fatherNode.code ? fatherNode.code : '0') + '.ix';
      orgsTree.orgNodes.push(indicesNode);
      if (orgsTree.allIndexGroups && orgsTree.allIndexGroups.length > 0) {
        let indexGroupOrgs = orgsTree.allIndexGroups.filter(group => (group.org_id == org.id));
        indexGroupOrgs.sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0);
        indexGroupOrgs.forEach(function (group) {
          let groupNode = new TreeItemNode();
          groupNode.id = group.id;
          groupNode.item = group.name;
          groupNode.type = 'indexgroup';
          groupNode.code = (indicesNode.code ? indicesNode.code : '0') + '.g' + group.id;
          orgsTree.orgNodes.push(groupNode);
          if (orgsTree.allIndices.length > 0) {
            let indicesGroup = orgsTree.allIndices.filter(index => (index.group && (index.group.id == group.id)));
            indicesGroup.sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0);
            indicesGroup.forEach(function (index) {
              let indexNode = new TreeItemNode();
              indexNode.id = index.id;
              indexNode.item = index.name;
              indexNode.type = 'index';
              indexNode.code = (groupNode.code ? groupNode.code : '0') + '.i' + index.id;
              indexNode.selected = index.selected;
              orgsTree.orgNodes.push(indexNode);
            });
          }
        });
      }
      if (orgsTree.allIndices && orgsTree.allIndices.length > 0) {
        let indicesNoGroup = orgsTree.allIndices.filter(index => ((index.group === undefined) && (index.org_id == org.id)));
        indicesNoGroup.sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0);
        indicesNoGroup.forEach(function (index) {
          let indexNode = new TreeItemNode();
          indexNode.id = index.id;
          indexNode.item = index.name;
          indexNode.type = 'index';
          indexNode.code = (indicesNode.code ? indicesNode.code : '0') + '.i' + index.id;
          indexNode.selected = index.selected;
          orgsTree.orgNodes.push(indexNode);
        });
      }
    }
  }

  createDrainControlsTree(orgsTree: OrganizationsTree, fatherNode: TreeItemNode, org: Organization): void {
    if (orgsTree.allDrainControls.length > 0) {
      let controlOrgs = orgsTree.allDrainControls.filter(control => (control.org_id == org.id));
      controlOrgs.sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0);
      controlOrgs.forEach(function(control) {
        let controlNode = new TreeItemNode();
        controlNode.id = control.id;
        controlNode.item = control.name;
        controlNode.type = 'draincontrol';
        controlNode.code = (fatherNode.code ? fatherNode.code : '0') + '.dc' + control.id;
        orgsTree.orgNodes.push(controlNode);
      });
    }
  }

  filterByType(filterText: string, type: string, showDetails: boolean): boolean {
    this.initialize(this.allOrgs, this.allJobs, this.allClients, this.allFeeds, this.allDrains, this.allFormulas, this.allIndexGroups, this.allIndices, this.allDrainControls, this.allInvoiceItemkWh, (showDetails || (filterText && (type !== 'client'))) ? true : false, this.depthTree);

    if (filterText) {
      this.dataChange.next(this.treeUtils.buildTree(this.treeUtils.filter(filterText, type, this.treeData), '0'));
      return true;
    }

    return false;
  }

  changeViewDetails(node: TreeItemFlatNode) {
    this.allClients.forEach((c: Client) => {
      c.view_details = (c.id === node.id) ? !c.view_details : false;
    });
    this.initialize(this.allOrgs, this.allJobs, this.allClients, this.allFeeds, this.allDrains, this.allFormulas, this.allIndexGroups, this.allIndices, this.allDrainControls, this.allInvoiceItemkWh, false, this.depthTree);
  }

  selectFormula(data: any, orgs: Organization[], clients: Client[], formulas: Formula[], formula_id: number) {
    let formula = formulas.find((f: Formula) => f.id === formula_id);
    if (formula) {
      if (data.formulas.find((f: Formula) => f.id === formula.id) === undefined) {
        data.formulas.push(formula);
        if (formula.client_id) {
          let client = clients.find(o => o.id === formula.client_id);
          if (client) {
            this.selectClientAndFathers(data, clients, client);
            let org = orgs.find((o: Organization) => o.id === client.org_id);
            this.selectOrgAndFathers(data, orgs, org);
          }
        } else {
          let org = orgs.find(o => o.id === formula.org_id);
          if (org)
            this.selectOrgAndFathers(data, orgs, org);
        }
      }
    }
  }

  selectDrain(data: any, orgs: Organization[], clients: Client[], feeds: Feed[], drains: Drain[], drain_id: number) {
    let drain = drains.find((d: Drain) => d.id === drain_id);
    if (drain) {
      if (data.drains.find((d: Drain) => d.id === drain.id) === undefined) {
        data.drains.push(drain);
        let feed = feeds.find((f: Feed) => f.id === drain.feed_id);
        if (feed) {
          if (data.feeds.find((f: Feed) => f.id === feed.id) === undefined) {
            data.feeds.push(feed);
            let client = clients.find((c: Client) => (feed.client_ids.indexOf(c.id) > -1));
            if (client) {
              this.selectClientAndFathers(data, clients, client);
              let org = orgs.find((o: Organization) => o.id === client.org_id);
              this.selectOrgAndFathers(data, orgs, org);
            }
          }
        }
      }
    }
  }

  selectOrgAndFathers(data: any, orgs: Organization[], org: Organization) {
    if (data.orgs.find((o: Organization) => o.id === org.id) === undefined) {
      data.orgs.push(org);
      if ((org.parent_id !== undefined) && (org.parent_id !== null)) {
        let father = orgs.find((o: Organization) => o.id === org.parent_id);
        if (father)
          if (data.orgs.find((o: Organization) => o.id === father.id) === undefined)
            this.selectOrgAndFathers(data, orgs, father);
      }
    }
  }

  selectClientAndFathers(data: any, clients: Client[], client: Client) {
    if (data.clients.find((c: Client) => c.id === client.id) === undefined) {
      data.clients.push(client);
      if ((client.parent_id !== undefined) && (client.parent_id !== null)) {
        let father = clients.find((c: Client) => c.id === client.parent_id);
        if (father)
          if (data.clients.find((c: Client) => c.id === father.id) === undefined)
            this.selectClientAndFathers(data, clients, father);
      }
    }
  }

  removeFormula(data: any, formula_id: number) {
    let formula = data.formulas.find((f: Formula) => f.id === formula_id);
    if (formula) {
      data.formulas = data.formulas.filter((f: Formula) => f.id !== formula.id);
      if (formula.client_id) {
        let client = data.clients.find((c: Client) => c.id === formula.client_id);
        if (client) {
          this.removeClientAndFather(data, client);
          let org = data.orgs.find((o: Organization) => o.id === client.org_id);
          if (org)
            this.removeOrgAndFather(data, org);
        }
      } else {
        let org = data.orgs.find((o: Organization) => o.id === formula.org_id);
        if (org)
          this.removeOrgAndFather(data, org);
      }
    }
  }

  removeDrain(data: any, drain_id: number) {
    let drain = data.drains.find((d: Drain) => d.id === drain_id);
    if (drain) {
      data.drains = data.drains.filter((d: Drain) => d.id !== drain.id);
      let drainsForFeed = data.drains.filter((d: Drain) => d.feed_id === drain.feed_id);
      if (drainsForFeed.length === 0) {
        let feed = data.feeds.find((f: Feed) => f.id === drain.feed_id);
        if (feed) {
          data.feeds = data.feeds.filter((f: Feed) => f.id !== drain.feed_id);
          let client = data.clients.find((c: Client) => (feed.client_ids.indexOf(c.id) > -1));
          if (client) {
            this.removeClientAndFather(data, client);
            let org = data.orgs.find((o: Organization) => o.id === client.org_id);
            if (org)
              this.removeOrgAndFather(data, org);
          }
        }
      }
    }
  }

  removeClientAndFather(data: any, client: Client) {
    let childrenForClient = data.clients.filter((c: Client) => c.parent_id === client.id);
    let feedsForClient = data.feeds.filter((f: Feed) => (f.client_ids.indexOf(client.id) > -1));
    let formulasForClient = data.formulas.filter((f: Formula) => f.client_id === client.id);
    if ((feedsForClient.length === 0) && (childrenForClient.length === 0) && (formulasForClient.length === 0)) {
      data.clients = data.clients.filter((c: Client) => c.id !== client.id);
      let father: Client = data.clients.find((c: Client) => c.id === client.parent_id);
      if (father)
        this.removeClientAndFather(data, father);
    }
  }

  removeOrgAndFather(data: any, org: Organization) {
    let clientsForOrg = data.clients.filter((c: Client) => c.org_id === org.id);
    let formulasForOrg = data.formulas.filter((f: Formula) => f.org_id === org.id);
    let childrenForOrg = data.orgs.filter((o: Organization) => o.parent_id === org.id);
    if ((clientsForOrg.length === 0) && (formulasForOrg.length === 0) && (childrenForOrg).length === 0) {
      data.orgs = data.orgs.filter((o: Organization) => o.id !== org.id);
      let father: Organization = data.orgs.find((o: Organization) => o.id === org.parent_id);
      if (father)
        this.removeOrgAndFather(data, father);
    }
  }
}
