import { Clipboard } from '@angular/cdk/clipboard';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Location } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Color } from '@angular-material-components/color-picker';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { forkJoin, Observable } from 'rxjs';
import { Chart } from 'highcharts/highstock';

import * as moment from 'moment';

import { Client } from '../_models/client';
import { Drain } from '../_models/drain';
import { Feed } from '../_models/feed';
import { Formula } from '../_models/formula';
import { Index } from '../_models/index';
import { IndexGroup } from "../_models/indexgroup";
import { Organization } from '../_models/organization';
import { Measure } from '../_models/measure';
import { Measures } from '../_models/measures';
import { User } from '../_models/user';

import { AuthenticationService } from '../_services/authentication.service';
import { ClientsService } from '../_services/clients.service';
import { DrainsService } from '../_services/drains.service';
import { FeedsService } from '../_services/feeds.service';
import { FormulasService } from '../_services/formulas.service';
import { IndexGroupsService } from "../_services/indexgroups.service";
import { IndicesService } from '../_services/indices.service';
import { OrganizationsService } from '../_services/organizations.service';
import { MeasuresService } from '../_services/measures.service';

import { PieChart } from '../_utils/chart/pie-chart';
import { TimeChart } from '../_utils/chart/time-chart';
import { DrainsTreeDialogComponent } from '../_utils/drains-tree-dialog/drains-tree-dialog.component';
import { DrainsTreeSidenavComponent } from '../_utils/drains-tree-sidenav/drains-tree-sidenav.component';
import { FormulaDetailsDialogComponent } from '../_utils/formula-details-dialog/formula-details-dialog.component';
import { HttpUtils } from '../_utils/http.utils';
import { OrganizationsTree } from '../_utils/tree/organizations-tree';

@Component({
  templateUrl: './measures.component.html',
  styleUrls: ['./measures.component.scss'],
  providers: [OrganizationsTree]
})
export class MeasuresComponent implements OnInit {

  @ViewChild('treeSidenav') drainsTree: DrainsTreeSidenavComponent;

  isLoading: boolean = true;
  costs: boolean = true;
  isLoadingMeasures: boolean = false;
  isChangingMeasures: boolean = false;
  isChangingOptionsMeasure: boolean = false;
  isSaving: boolean = false;
  hasMeasures: boolean = false;
  measuresLoaded: boolean = false;
  noMeasuresFound: boolean = true;
  needReloadMeasures: boolean = false;
  showDrainMenu: boolean = true;
  showDrainsOptions: boolean = false;
  optionsChanged: boolean = false;
  showHours: boolean = false;
  params: any = {};
  allOrgs: Organization[] = [];
  energyClients: Client[] = [];
  allFeeds: Feed[] = [];
  allDrains: Drain[] = [];
  allFormulas: Formula[] = [];
  allIndexGroups: IndexGroup[] = [];
  allIndices: Index[] = [];
  costsOrgs: Organization[] = [];
  costsClients: Client[] = [];
  costsFeeds: Feed[] = [];
  costsDrains: Drain[] = [];
  costsDrain: any;
  unitOrgs: Organization[] = [];
  unitClients: Client[] = [];
  unitFeeds: Feed[] = [];
  unitDrains: Drain[] = [];
  timeAggregations: any[] = [];
  costsAggregations: any[] = [];
  costsOperations: any[] = [];
  fastSettings: any[] = [];
  indices: Index[] = [];
  formulas: Formula[] = [];
  nodes: any[] = [];
  measures: Measures[];
  measuresInfo: any[] = [];
  indexResults: Index[];
  chartTypes: any[] = [];
  visibleChartTypes: any[] = [];
  isSplineChart: boolean = true;
  isPieChart: boolean = false;
  isHeatmapChart: boolean = false;
  chartOptions: boolean = false;
  chartAggregations: any[] = [];
  tableTypes: string[] = ['None', 'Time'];
  chart: any;
  chartSeries: any[] = [];
  chartLabels: any[] = [];
  unitArray: any = [];
  chartRef: Chart;
  measuresForm: FormGroup;
  group: any = {};
  formulaId: number;
  formulaClients: Client[] = [];
  visibleDrains: boolean = false;
  checkFormula: boolean = false;
  user: User = new User();
  treeData: any = {};
  backRoute: string = 'dashboard';

  constructor(private authService: AuthenticationService, private orgsService: OrganizationsService, private clientsService: ClientsService, private feedsService: FeedsService, private drainsService: DrainsService, private formulasService: FormulasService, private indicesService: IndicesService, private indexGroupsService: IndexGroupsService, private measuresService: MeasuresService, private timeChart: TimeChart, private pieChart: PieChart, private organizationsTree: OrganizationsTree, private route: ActivatedRoute, private router: Router, private location: Location, private clipboard: Clipboard, private dialog: MatDialog, private httpUtils: HttpUtils, private translate: TranslateService) {}

  ngOnInit(): void {
    this.costs = (this.router.url === '/costs');
    this.user = this.authService.getCurrentUser();
    this.chartAggregations = this.httpUtils.getChartAggregations();
    this.costsAggregations = this.httpUtils.getMeasuresAggregationsForMeasureType('f');
    this.costsOperations = this.httpUtils.getMeasuresOperationsForMeasureType('f');
    this.translate.get('CHART.SPLINE').subscribe((spline: string) => {
      this.chartTypes.push({ id: 'spline', description: spline, visible: true });
      this.translate.get('CHART.HISTOGRAM').subscribe((histogram: string) => {
        this.chartTypes.push({ id: 'column', description: histogram, visible: true });
        this.translate.get('CHART.HEATMAP').subscribe((heatmap: string) => {
          this.chartTypes.push({ id: 'heatmap', description: heatmap, visible: false });
          this.translate.get('CHART.PIE').subscribe((pie: string) => {
            this.chartTypes.push({ id: 'pie', description: pie, visible: true });
            this.translate.get('CHART.STACKED').subscribe((stacked: string) => {
              this.chartTypes.push({ id: 'stacked', description: stacked, visible: true });
            });
          });
        });
      });
    });
    this.translate.get('TIME.NONE').subscribe((none: string) => {
      if (!this.costs)
        this.timeAggregations.push({ id: 'NONE', description: none, order: 0 });
      this.translate.get('TIME.MINUTE').subscribe((minute: string) => {
        if (!this.costs)
          this.timeAggregations.push({ id: 'MINUTE', description: minute, order: 1 });
        this.translate.get('TIME.QHOUR').subscribe((qhour: string) => {
          this.timeAggregations.push({ id: 'QHOUR', description: qhour, order: 2 });
          this.translate.get('TIME.HOUR').subscribe((hour: string) => {
            this.timeAggregations.push({ id: 'HOUR', description: hour, order: 3 });
            this.translate.get('TIME.DAY').subscribe((day: string) => {
              this.timeAggregations.push({ id: 'DAY', description: day, order: 4 });
              this.translate.get('TIME.MONTH').subscribe((month: string) => {
                this.timeAggregations.push({ id: 'MONTH', description: month, order: 5 });
                this.translate.get('TIME.YEAR').subscribe((year: string) => {
                  this.timeAggregations.push({ id: 'YEAR', description: year, order: 6 });
                  this.translate.get('TIME.ALL').subscribe((all: string) => {
                    this.timeAggregations.push({ id: 'ALL', description: all, order: 7 });
                  });
                });
              });
            });
          });
        });
      });
    });
    this.translate.get('MEASURES.CURRENTHOUR').subscribe((hour: string) => {
      this.fastSettings.push({ id: 'hour',  description: hour });
      this.translate.get('MEASURES.CURRENTDAY').subscribe((day: string) => {
        this.fastSettings.push({ id: 'day',  description: day });
        this.translate.get('MEASURES.CURRENTWEEK').subscribe((week: string) => {
          this.fastSettings.push({ id: 'week',  description: week });
          this.translate.get('MEASURES.CURRENTMONTH').subscribe((month: string) => {
            this.fastSettings.push({ id: 'month',  description: month });
            if (this.user.default_start || this.user.default_end) {
              this.translate.get('MEASURES.DEFAULTDATE').subscribe((defaultdate: string) => {
                this.fastSettings.push({ id: 'defaultdate',  description: defaultdate });
              });
            }
          });
        });
      });
    });

    this.route.queryParams.subscribe((params: any) => {
      this.params = params;
      this.createMeasuresForm();
      forkJoin([this.orgsService.getOrganizations(), this.clientsService.getClients(), this.feedsService.getFeeds(), this.drainsService.getDrains(), this.formulasService.getFormulas(), this.indexGroupsService.getIndexGroups(), this.indicesService.getIndices()]).subscribe({
        next: (results: any) => {
          this.allOrgs = results[0];
          this.allOrgs.sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0);
          this.energyClients = results[1].filter((c: Client) => c.energy_client);
          this.energyClients.sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0);
          this.allFeeds = results[2];
          this.allDrains = results[3];
          if (this.costs) {
            this.costsDrains = this.allDrains.filter(d => (d.measure_unit && d.measure_unit.includes('€/')));
            if ((this.costsDrains.length === 1) || this.params.costsDrain) {
              let drain = this.params.costsDrain ? this.costsDrains.find(d => d.id === +this.params.costsDrain) : this.costsDrains[0];
              if (drain) {
                let feed = this.allFeeds.find(f => f.id === drain.feed_id);
                if (feed) {
                  let client = this.energyClients.find(c => feed.client_ids.indexOf(c.id) > -1);
                  if (client) {
                    let org = this.allOrgs.find(o => o.id === client.org_id);
                    if (org)
                      this.costsDrain = { id: drain.id, full_name: ((this.allOrgs.length > 1) ? org.name + ' - ' : '') + client.name + ' - ' + feed.description + ' - ' + drain.name + (drain.measure_unit ? ' (' + drain.measure_unit + ')' : '') }
                  }
                }
              }
            }
            this.unitDrains = this.allDrains.filter(d => (d.measure_unit && d.measure_unit.toLowerCase().includes('wh') && !d.measure_unit.toLowerCase().includes('€')));
            let unitData = { orgs: [], clients: [], feeds: [], drains: [] };
            this.addDrainsForTree(unitData, this.unitDrains);
            this.unitOrgs = unitData.orgs;
            this.unitClients = unitData.clients;
            this.unitFeeds = unitData.feeds;
            let data = { orgs: [], clients: [], feeds: [], drains: [] };
            this.addDrainsForTree(data, this.costsDrains);
            this.costsOrgs = data.orgs;
            this.costsFeeds = data.feeds;
            this.costsClients = data.clients;
          }
          this.allFormulas = results[4];
          this.allIndexGroups = results[5];
          this.allIndices = results[6];
          this.isLoading = false;
          if (this.params.indexIds || this.params.nodeIds) {
            if (this.costs && this.params.indexIds) {
              var indexIds = this.params.indexIds.split(',');
              indexIds.forEach((indexId: string) => {
                if (!this.indices.find((i: Index) => i.id === parseInt(indexId)))
                  this.addNode({ id: parseInt(indexId), type: 'index' }, false, false);
              });
            }
            if (this.params.nodeIds) {
              let nodeIds = this.params.nodeIds.split(',');
              let nodeExcludeOutliers = this.params.excludeOutliers ? this.params.excludeOutliers.split(',') : [];
              let nodePositiveNegativeValues = this.params.positiveNegativeValues ? this.params.positiveNegativeValues.split(',') : [];
              let nodeAggregations = this.params.aggregations ? this.params.aggregations.split(',') : [];
              let nodeOperations = this.params.operations ? this.params.operations.split(',') : [];
              let nodeLegends = this.params.legends ? this.params.legends.split(',') : [];
              let i: number = 0;
              let k: number = 0;
              let j: number = 0;
              nodeIds.forEach((drainId: string) => {
                if (drainId.slice(0, 1) === 'd') {
                  this.addNode({ id: parseInt(drainId.slice(2)), type: 'drain', exclude_outliers: (nodeExcludeOutliers.length > k) ? ((nodeExcludeOutliers[k] === 'true') ? true : false) : false, positive_negative_value: (nodePositiveNegativeValues.length > k) ? nodePositiveNegativeValues[k] : '', aggregation: (nodeAggregations.length > k) ? nodeAggregations[k] : 'AVG', operation: (nodeOperations.length > i) ? nodeOperations[i] : 'SEMICOLON', legend: ((nodeLegends.length > j) && (nodeOperations.length > i) && (nodeOperations[i] === 'SEMICOLON')) ? nodeLegends[j] : undefined }, false, false);
                  i++;
                  k++;
                  if ((nodeOperations.length > i) && (nodeOperations[i] === 'SEMICOLON'))
                    j++;
                } else if (drainId.slice(0, 1) === 'f') {
                  let formula = this.allFormulas.find(f => f.id === parseInt(drainId.slice(2)));
                  if (formula) {
                    let legends: string[] = [];
                    let subFormulas: number = formula.operators ? formula.operators.filter(o => o === 'SEMICOLON').length : 1;
                    for (let sf: number = 0; sf < subFormulas; sf++) {
                      legends.push((nodeLegends.length > j) ? nodeLegends[j] : undefined);
                      j++;
                    }
                    this.addNode({ id: formula.id, type: 'formula', operation: (nodeOperations.length > i) ? nodeOperations[i] : 'SEMICOLON', legend: (legends.length === 1) ? legends[0] : undefined, legends: legends }, false, false);
                    if (formula.operators.filter(o => o === 'SEMICOLON').length === 1)
                      i++;
                  }
                }
              });
              if ((nodeIds.length === 1) && (nodeIds[0].slice(0, 1) === 'f'))
                this.setFormulaData(this.allFormulas.find(f => f.id === parseInt(nodeIds[0].slice(2))));
            }
            this.setChartTypesVisible();
            this.isSplineChart = (this.params.chartType === 'spline') ? true : false;
            this.isPieChart = (this.params.chartType === 'pie') ? true : false;
            this.isHeatmapChart = (this.params.chartType === 'heatmap') ? true : false;
            this.loadMeasures(undefined, undefined, false);
          }
          this.treeData = { orgs: this.costs ? this.unitOrgs : this.allOrgs, clients: this.costs ? this.unitClients : this.energyClients, feeds: this.costs ? this.unitFeeds : this.allFeeds, drains: this.costs ? this.unitDrains.filter(d => ((d.measure_type !== 'C') && (d.measure_type !== 's'))) : this.allDrains.filter(d => ((d.measure_type !== 'C') && (d.measure_type !== 's'))), formulas: this.allFormulas, indexGroups: this.costs ? [] : this.allIndexGroups, indices: this.costs ? [] : this.allIndices, depth: this.user.drain_tree_depth, parentComponent: this };
        },
        error: (error: any) => {
          if (error.status !== 401) {
            const dialogRef = this.httpUtils.errorDialog(error);
            dialogRef.afterClosed().subscribe((_value: any) => {
              this.router.navigate([this.backRoute]);
            });
          }
        }
      });
    });
  }

  createMeasuresForm() {
    let patterns = this.httpUtils.getPatterns();
    let color1_rgb = this.params.color1 ? this.httpUtils.hexToRgb(this.params.color1.toLowerCase().replace('%23', '#')) : undefined;
    let color2_rgb = this.params.color2 ? this.httpUtils.hexToRgb(this.params.color2.toLowerCase().replace('%23', '#')) : undefined;
    let color3_rgb = this.params.color3 ? this.httpUtils.hexToRgb(this.params.color3.toLowerCase().replace('%23', '#')) : undefined;
    this.group['startTime'] = new FormControl(this.params.startTime ? new Date(this.params.startTime) : new Date(moment().add(-1, 'day').toISOString()), [ Validators.required ]);
    this.group['endTime'] = new FormControl(this.params.endTime ? new Date(this.params.endTime) : new Date(moment().toISOString()), [ Validators.required ]);
    this.group['fastSetting'] = new FormControl('', []);
    this.group['timeAggregation'] = new FormControl(this.params.timeAggregation ? this.params.timeAggregation : (this.costs ? 'QHOUR' : 'NONE'), [ Validators.required ]);
    this.group['costsAggregation'] = new FormControl(this.params.costsAggregation ? this.params.costsAggregation : 'SUM', [ Validators.required ]);
    this.group['formulaName'] = new FormControl('', []);
    this.group['organization'] = new FormControl('', []);
    this.group['client'] = new FormControl('', []);
    this.group['chartType'] = new FormControl((this.params.widgetType !== 'STACKED') ? (this.params.chartType ? this.params.chartType : 'spline') : 'stacked', [ Validators.required ]);
    this.group['showMarkers'] = new FormControl(this.params.showMarkers ? this.params.showMarkers : false, []);
    this.group['chartAggregation'] = new FormControl(this.params.chartAggregation ? this.params.chartAggregation : 'average', [ Validators.required ]);
    this.group['color1'] = new FormControl(color1_rgb ? new Color(color1_rgb.r, color1_rgb.g, color1_rgb.b) : undefined, []);
    this.group['color2'] = new FormControl(color2_rgb ? new Color(color2_rgb.r, color2_rgb.g, color2_rgb.b) : undefined, []);
    this.group['color3'] = new FormControl(color3_rgb ? new Color(color3_rgb.r, color3_rgb.g, color3_rgb.b) : undefined, []);
    this.group['warningValue'] = new FormControl(this.params.warningValue ? this.params.warningValue : '', [ Validators.pattern(patterns.positiveNegativeFloat) ]);
    this.group['alarmValue'] = new FormControl(this.params.alarmValue ? this.params.alarmValue : '', [ Validators.pattern(patterns.positiveNegativeFloat) ]);
    this.measuresForm = new FormGroup(this.group);
    this.measuresForm.get('timeAggregation').valueChanges.subscribe((_t: string) => {
      this.setChartTypesVisible();
      if ((this.nodes.filter((n: any) => n.visible).length > 0) || (this.indices.length > 0))
        this.loadMeasures(undefined, undefined, false);
    });
    this.measuresForm.get('startTime').valueChanges.subscribe((_t: string) => this.needReloadMeasures = true);
    this.measuresForm.get('endTime').valueChanges.subscribe((_t: string) => this.needReloadMeasures = true);
    this.measuresForm.get('fastSetting').valueChanges.subscribe((window) => {
      if (window === 'hour')
        this.measuresForm.patchValue({ startTime: new Date(moment().set('minute', 0).set('second', 0).toISOString()), endTime: new Date(moment().set('minute', 59).set('second', 59).toISOString()) });
      else if (window === 'day')
        this.measuresForm.patchValue({ startTime: new Date(moment().set('hour', 0).set('minute', 0).set('second', 0).toISOString()), endTime: new Date(moment().set('hour', 23).set('minute', 59).set('second', 59).toISOString()) });
      else if (window === 'week')
        this.measuresForm.patchValue({ startTime: new Date(moment().set('day', 1).set('hour', 0).set('minute', 0).set('second', 0).toISOString()), endTime: new Date(moment().set('hour', 23).set('minute', 59).set('second', 59).toISOString()) });
      else if (window === 'month')
        this.measuresForm.patchValue({ startTime: new Date(moment().set('date', 1).set('hour', 0).set('minute', 0).set('second', 0).toISOString()), endTime: new Date(moment().set('hour', 23).set('minute', 59).set('second', 59).toISOString()) });
      else if (window === 'defaultdate')
        this.measuresForm.patchValue({ startTime: new Date(this.user.default_start ? this.user.default_start : moment(this.user.default_end).add(-1, 'hour').toISOString()), endTime: new Date(this.user.default_end ? this.user.default_end : moment().toISOString()) });
      if ((this.nodes.filter((n: any) => n.visible).length > 0) || (this.indices.length > 0))
        this.loadMeasures(undefined, undefined, false);
    });
    this.measuresForm.get('chartType').valueChanges.subscribe((t: string) => {
      this.isSplineChart = (t === 'spline') ? true : false;
      this.isPieChart = (t === 'pie') ? true : false;
      this.isHeatmapChart = (t === 'heatmap') ? true : false;
      this.drawChart();
    });
    this.measuresForm.get('showMarkers').valueChanges.subscribe((_s: boolean) => {
      this.drawChart();
    });
    this.measuresForm.get('chartAggregation').valueChanges.subscribe((_a: string) => {
      this.drawChart();
    });
    this.measuresForm.get('warningValue').valueChanges.subscribe((_s: number) => {
      this.drawChart();
    });
    this.measuresForm.get('alarmValue').valueChanges.subscribe((_s: number) => {
      this.drawChart();
    });
    this.measuresForm.get('organization').valueChanges.subscribe((o: number) => {
      this.updateFormulaClient(o);
    });
  }

  createDrainControls(i: number, excludeOutliers: boolean, positiveNegativeValue: string, aggregation: string, operation: string, legend: String): void {
    this.group['excludeOutliers_' + i] = new FormControl(excludeOutliers, []);
    this.measuresForm.get('excludeOutliers_' + i).valueChanges.subscribe((ex: boolean) => {
      this.nodes[i].exclude_outliers = ex;
      this.needReloadMeasures = true;
    });
    this.group['positiveNegativeValue_' + i] = new FormControl(positiveNegativeValue, []);
    this.measuresForm.get('positiveNegativeValue_' + i).valueChanges.subscribe((pn: string) => {
      this.nodes[i].positive_negative_value = pn;
      this.needReloadMeasures = true;
    });
    this.group['aggregation_' + i] = new FormControl(aggregation ? aggregation : 'AVG', [ Validators.required ]);
    this.measuresForm.get('aggregation_' + i).valueChanges.subscribe((a: string) => {
      this.nodes[i].aggregation = a;
      this.needReloadMeasures = true;
    });
    this.group['operation_' + i] = new FormControl(operation ? operation : 'SEMICOLON', [ Validators.required ]);
    this.measuresForm.get('operation_' + i).valueChanges.subscribe((o: string) => {
      this.nodes[i].operation = o;
      if (o === 'SEMICOLON') {
        if (this.nodes.length > (i + 1)) {
          let k = 0;
          for (let node of this.nodes) {
            if (k > i) {
              if (node.visible) {
                this.measuresForm.get('legend_' + k).setValue(node.full_name);
                this.nodes[k].legend = node.full_name;
                break;
              }
            }
            k++;
          }
        }
      }
      this.setChartTypesVisible();
      this.needReloadMeasures = true;
    });
    this.group['legend_' + i] = new FormControl(legend, []);
    this.measuresForm.get('legend_' + i).valueChanges.subscribe((legend: string) => {
      if (this.measuresForm.get('operation_' + i).value === 'SEMICOLON') {
        this.nodes[i].legend = legend;
        let measureInfo = this.measuresInfo.find((info: any) => info.position === i);
        if (measureInfo)
          measureInfo.info[0].name = legend;
      }
    });
  }

  compareObjects(o1: any, o2: any): boolean {
    return (o2 != null) && (o1.id === o2.id);
  }

  setHasMeasures(): void {
    this.hasMeasures = ((this.nodes.filter(n => n.visible).length > 0) || (this.indices.length > 0));
  }

  setChartTypesVisible(): void {
    let visible = false;
    if (this.measuresForm.get('timeAggregation').value) {
      let timeAggr = this.timeAggregations.find(agg => agg.id === this.measuresForm.get('timeAggregation').value);
      if (timeAggr) {
        if ((timeAggr.order > 2) && (timeAggr.order < 6)) {
          let visibleNodes: any[] = this.nodes.filter((n: any) => n.visible);
          visible = ((this.indices.length == 0) && ((visibleNodes.length <= 1) || (visibleNodes.filter(d => d.operation === 'SEMICOLON').length <= 1)) || ((this.indices.length == 1) && (visibleNodes.length === 0)));
        }
      }
      this.chartTypes.find(c => c.id === 'pie').visible = (this.measuresForm.get('timeAggregation').value === 'ALL');
    }
    this.chartTypes.find(c => c.id === 'heatmap').visible = visible;
    this.visibleChartTypes = this.chartTypes.filter(t => t.visible);
    if (((this.measuresForm.get('chartType').value === 'heatmap') && !visible) || ((this.measuresForm.get('chartType').value === 'pie') && (this.measuresForm.get('timeAggregation').value !== 'ALL')))
      this.measuresForm.patchValue({ chartType: 'spline' });
  }

  addDrainsForTree(data: any, drains: Drain[]): void {
    drains.forEach((drain: Drain) => {
      this.organizationsTree.selectDrain(data, this.allOrgs, this.energyClients, this.allFeeds, this.allDrains, drain.id);
    });
  }

  selectCostDrain(): void {
    const dialogRef = this.dialog.open(DrainsTreeDialogComponent, { width: '75%', data: { orgs: this.costsOrgs, clients: this.costsClients, feeds: this.costsFeeds, drains: this.costsDrains, formulas: [], showDetails: true, singleDrain: true } });
    dialogRef.afterClosed().subscribe((result: any) => {
      if (result && result.id)
        this.costsDrain = { id: result.id, full_name: result.full_name };
    });
  }

  addNode(node: any, editNode: boolean, loadMeasures: boolean): void {
    if (node) {
      if (node.type === 'drain') {
        let drain = this.allDrains.find((d: Drain) => d.id === node.id);
        if (drain) {
          drain.selected = true;
          let feed = this.allFeeds.find(f => f.id === drain.feed_id);
          if (feed) {
            let client = this.energyClients.find(c => (feed.client_ids.indexOf(c.id) > -1));
            if (client) {
              let org = this.allOrgs.find(o => o.id === client.org_id);
              if (org) {
                let aggregation = node.aggregation ? node.aggregation : (drain.measure_unit && (drain.measure_unit.toLowerCase().includes('wh') || feed.description.startsWith('Produzione'))) ? 'SUM' : 'AVG';
                let operation = node.operation ? node.operation : 'SEMICOLON';
                let excludeOutliers = node.exclude_outliers ? node.exclude_outliers : (drain.max_value !== undefined || drain.min_value !== undefined);
                let positiveNegativeValue = node.positive_negative_value ? node.positive_negative_value : '';
                let legend = node.legend ? node.legend : client.name + ' - ' + drain.name;
                this.createDrainControls(this.nodes.length, excludeOutliers, positiveNegativeValue, aggregation, operation, legend);
                this.nodes.push({ position: this.nodes.length, type: 'drain', id: drain.id, visible: true, measure_type: drain.measure_type, full_name: ((this.allOrgs.length > 1) ? org.name + ' - ' : '') + client.name + ' - ' + feed.description + ' - ' + drain.name + (drain.measure_unit ? ' (' + drain.measure_unit + ')' : ''), aggregations: this.httpUtils.getMeasuresAggregationsForMeasureType(drain.measure_type), aggregation: aggregation, operations: this.httpUtils.getMeasuresOperationsForMeasureType(drain.measure_type), operation: operation, is_positive_negative_value: drain.positive_negative_value, positive_negative_value: positiveNegativeValue, exclude_outliers: excludeOutliers, is_exclude_outliers: ((drain.min_value != null) || (drain.max_value != null)), legend: legend, show_legend: false, unit_of_measure: drain.measure_unit ? ' (' + drain.measure_unit + ')' : '' });
                this.visibleDrains = true;
              }
            }
          }
        }
      } else if (node.type === 'formula') {
        let formula = this.allFormulas.find(f => f.id === node.id);
        formula.selected = true;
        if (formula) {
          let subFormulas: number = formula.operators ? formula.operators.filter(o => o === 'SEMICOLON').length : 1;
          let operation: string = node.operation ? node.operation : 'SEMICOLON';
          this.createDrainControls(this.nodes.length, false, null, null, operation, (subFormulas > 1) ? null : (node.legend ? node.legend : formula.name));
          let component = this;
          let type = 'f';
          formula.components.forEach(function (drain_id: number) {
            let drain = component.allDrains.find((d: Drain) => d.id === drain_id);
            if (drain && (drain.type === 'c'))
              type = drain.type;
          });
          this.nodes.push({ position: this.nodes.length, type: 'formula', subFormulas: subFormulas, id: formula.id, name: formula.name, full_name: formula.name, components: formula.components, positive_negative_values: formula.positive_negative_values, aggregations: formula.aggregations, operators: formula.operators, operations: this.httpUtils.getMeasuresOperationsForMeasureType(type), operation: operation, visible: true, legends: node.legends ? node.legends : formula.legends, legend: (subFormulas > 1) ? null : (node.legend ? node.legend : formula.name), show_legend: false });
        }
        if ((this.nodes.length === 1) && !this.formulaId) {
          this.setFormulaData(this.nodes[0]);
        } else {
          this.formulaId = undefined;
          this.measuresForm.patchValue({ organization: undefined, client: undefined, formulaName: undefined });
        }
      } else if (node.type === 'index') {
        let index = this.allIndices.find(i => i.id === node.id);
        if (index) {
          index.selected = true;
          this.indices.push(index);
        }
      }
      if (editNode)
        this.drainsTree.editNode(node.id, node.type, true);
      this.setChartTypesVisible();
      this.setHasMeasures();
      if (loadMeasures)
        if (node.type === 'index')
          this.loadMeasures(undefined, this.indices[this.indices.length - 1], false);
        else
          this.loadMeasures(this.nodes[this.nodes.length - 1], undefined, false);
    }
  }

  removeNode(node: any): void {
    if ((node.type === 'drain') || (node.type === 'formula')) {
      let lastIndex: number = -1;
      let i: number = 0;
      this.nodes.forEach((n: any) => {
        if ((n.id === node.id) && (n.type === node.type) && n.visible)
          lastIndex = i;
        i++;
      });
      if (lastIndex !== -1)
        this.removeNodeByIndex(lastIndex, node.type, false);
    } else if (node.type === 'index') {
      let index: Index = this.allIndices.find((i: Index) => (i.id === node.id));
      if (index)
        this.removeIndex(index);
    }
    this.setHasMeasures();
  }

  removeNodeByIndex(i: number, type: string, editFormula: boolean): void {
    if ((this.nodes[i].type === 'formula') && !editFormula) {
      this.formulaId = undefined;
      this.measuresForm.patchValue({ organization: undefined, formulaName: undefined });
    }
    this.nodes[i].visible = false;
    this.nodes[i].operation = 'SEMICOLON';
    if (this.nodes.find((n: any) => ((n.id === this.nodes[i].id) && n.visible)) === undefined) {
      this.drainsTree.editNode(this.nodes[i].id, type, false);
      if (type === 'drain') {
        let drain: Drain = this.treeData.drains.find((d: Drain) => d.id === this.nodes[i].id);
        if (drain)
          drain.selected = false;
      } else if (type === 'formula') {
        let formula: Formula = this.treeData.formulas.find((f: Formula) => f.id === this.nodes[i].id);
        if (formula)
          formula.selected = false;
      }
    }
    this.visibleDrains = this.nodes.find((n: any) => (n.visible === true)) ? true : false;
    if (!editFormula) {
      this.setHasMeasures();
      this.setChartTypesVisible();
      let measureInfoIndex: number = this.measuresInfo.findIndex((info: any) => info.position === this.nodes[i].position);
      if (measureInfoIndex !== -1) {
        this.measuresInfo[measureInfoIndex].info.forEach((info: any) => {
          if (this.chart) {
            let serie: any = this.chartRef.get(info.id);
            if (serie)
              serie.remove();
          }
          this.chartSeries.splice(this.chartSeries.findIndex((s: any) => s.id === info.id), 1);
        });
        this.measuresInfo.splice(measureInfoIndex, 1);
      }
      if (this.chartSeries.length === 0) {
        this.chart = undefined;
        this.measures = [];
        this.measuresInfo = [];
      }
    }
  }

  removeIndex(index: Index): void {
    let i = this.indices.findIndex((i: Index) => i.id === index.id);
    this.indices.splice(i, 1);
    this.chartSeries.splice(this.chartSeries.findIndex((s: any) => s.id === 'index_' + index.id), 1);
    if (this.chart) {
      let serie: any = this.chartRef.get('index_' + index.id)
      if (serie)
        serie.remove();
    }
    this.drainsTree.editNode(index.id, 'index', false);
    let ind: Index = this.treeData.indices.find((d: Index) => d.id === index.id);
    if (ind)
      ind.selected = false;
    if (this.chartSeries.length === 0)
      this.chart = undefined;
  }

  setFormulaData(formula: Formula): void {
    if (formula) {
      if (!formula.org_id) {
        let formulaFromDrain = this.allFormulas.filter(f => f.id === formula.id)[0];
        formula.org_id = formulaFromDrain.org_id;
        formula.client_id = formulaFromDrain.client_id;
        formula.name = formulaFromDrain.name;
      }
      this.formulaId = formula.id;
      if (formula.org_id) {
        this.updateFormulaClient(formula.org_id);
        this.measuresForm.patchValue({ organization: formula.org_id, client: formula.client_id, formulaName: formula.name });
      }
    }
  }

  updateFormulaClient(orgId: number) {
    let formulaOrgs: Organization[] = [this.allOrgs.find(o => o.id === orgId)];
    formulaOrgs = this.httpUtils.getChildrenOrganizations(this.allOrgs, this.allOrgs.find(o => o.id === orgId), formulaOrgs);
    this.formulaClients = this.energyClients.filter(c => formulaOrgs.includes(this.allOrgs.find(o => o.id === c.org_id)));
    this.formulaClients.sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0);
  }

  disableSaveFormula(): boolean {
    return this.nodes.filter((n: any) => (n.components && n.visible)).length > 0;
  }

  showFormulaDetails(i: number) {
    let formula = this.allFormulas.find((f: Formula) => f.id === this.nodes[i].id );
    if (formula) {
      let details: any[] = [];
      let i = 0;
      formula.components.forEach((drain_id: number) => {
        let drain = this.allDrains.find((d: Drain) => d.id === drain_id);
        if (drain) {
          let feed = this.allFeeds.find((f: Feed) => f.id === drain.feed_id);
          if (feed) {
            let client = this.energyClients.find((c: Client) => (feed.client_ids.indexOf(c.id) > -1));
            if (client) {
              let org = this.allOrgs.find((o: Organization) => o.id === client.org_id);
              if (org)
                details.push({ full_name: ((this.allOrgs.length > 1) ? org.name + ' - ' : '') + client.name + ' - ' + feed.description + ' - ' + drain.name + (drain.measure_unit ? ' (' + drain.measure_unit + ')' : ''), aggregations: this.httpUtils.getMeasuresAggregationsForMeasureType(drain.measure_type), aggregation: formula.aggregations[i], operations: this.httpUtils.getMeasuresOperationsForMeasureType(drain.measure_type), operation: formula.operators[i], is_exclude_outliers: ((drain.min_value != null) || (drain.max_value != null)), exclude_outliers: formula.exclude_outliers[i], is_positive_negative_value: drain.positive_negative_value, positive_negative_value: formula.positive_negative_values[i], });
            }
          }
        }
        i++;
      });
      this.dialog.open(FormulaDetailsDialogComponent, { width: '75%', data: { details: details } });
    }
  }

  editFormula(i: number) {
    setTimeout(() =>{
      if (this.nodes[i]) {
        let formula = this.allFormulas.find((f: Formula) => (f.id === this.nodes[i].id));
        if (formula && formula.components) {
          this.removeNodeByIndex(i, 'formula', true);
          let k = 0;
          let component = this;
          formula.components.forEach(function (drain_id: number) {
            let drain = component.allDrains.find((d: Drain) => d.id === drain_id);
            if (drain) {
              drain.selected = true;
              let legend: string = '';
              if (formula.operators[k] === 'SEMICOLON')
                legend = formula.legends[k] ? formula.legends[k] : formula.name;
              component.addNode({ id: drain.id, type: 'drain', exclude_outliers: formula.exclude_outliers[k], positive_negative_value: formula.positive_negative_values[k] ? formula.positive_negative_values[k] : '', aggregation: formula.aggregations[k], operation: formula.operators[k], legend: legend }, true, false);
            }
            k++;
          });
        }
      }
    }, 500);
  }

  saveFormula(create: boolean): void {
    this.isSaving = true;
    let newFormula: Formula = new Formula();
    let dataDrain: any = this.saveLoad(undefined, undefined);
    let drainIdsStr = [];
    dataDrain.nodeIds.forEach((id: string) => drainIdsStr.push(id.slice(2)));
    if (!dataDrain.lastSemicolon) {
      this.httpUtils.errorDialog({ status: 499, error: { errorCode: 8499 } });
      return;
    }
    newFormula.name = this.measuresForm.get('formulaName').value;
    newFormula.org_id = this.measuresForm.get('organization').value;
    newFormula.client_id = this.measuresForm.get('client').value;
    newFormula.components = drainIdsStr;
    newFormula.aggregations = dataDrain.aggregations;
    newFormula.operators = dataDrain.operations;
    newFormula.legends = dataDrain.legends;
    newFormula.positive_negative_values = dataDrain.positiveNegativeValues;
    newFormula.exclude_outliers = dataDrain.excludeOutliers;
    newFormula.operators.pop();
    if (create) {
      this.formulasService.createFormula(newFormula).subscribe({
        next: (_response: Formula) => {
          this.isSaving = false;
          this.httpUtils.successSnackbar(this.translate.instant('FORMULASTREE.FORMULASAVED'));
          window.location.reload();
        },
        error: (error: any) => {
          this.isSaving = false;
          if (error.status !== 401)
            this.httpUtils.errorDialog(error);
        }
      });
    } else {
      newFormula.id = this.formulaId;
      this.formulasService.updateFormula(newFormula).subscribe({
        next: (_response: Formula) => {
          this.isSaving = false;
          this.httpUtils.successSnackbar(this.translate.instant('FORMULASTREE.FORMULAUPDATE'));
          window.location.reload();
        },
        error: (error: any) => {
          this.isSaving = false;
          if (error.status !== 401)
            this.httpUtils.errorDialog(error);
        }
      });
    }
  }

  saveLoad(node: any, index: Index): any {
    let nodeIds: any[] = [];
    let excludeOutliers: any[] = [];
    let positiveNegativeValues: any[] = [];
    let aggregations: any[] = [];
    let operations: any[] = [];
    let legends: any[] = [];
    let lastSemicolonControl: boolean = true;
    if (node) {
      lastSemicolonControl = this.addNodeToMeasuresQuery(node, nodeIds, operations, legends, lastSemicolonControl, aggregations, positiveNegativeValues, excludeOutliers);
    } else if (!index) {
      let component = this;
      this.measures = undefined;
      this.nodes.forEach((n: any) => {
        if (n.visible)
          lastSemicolonControl = component.addNodeToMeasuresQuery(n, nodeIds, operations, legends, lastSemicolonControl, aggregations, positiveNegativeValues, excludeOutliers);
      });
    }
    return { nodeIds: nodeIds, excludeOutliers: excludeOutliers, positiveNegativeValues: positiveNegativeValues, aggregations: aggregations, operations: operations, lastSemicolon: lastSemicolonControl, legends: legends };
  }

  addNodeToMeasuresQuery(node: any, nodeIds: any[], operations: any[], legends: any[], lastSemicolonControl: boolean, aggregations: any[], positiveNegativeValues: any[], excludeOutliers: any[]) {
    lastSemicolonControl = false;
    if (node.type === 'formula') {
      nodeIds.push("f_" + node.id);
      if (node.subFormulas === 1)
        operations.push(node.operation);
      lastSemicolonControl = (node.operation === 'SEMICOLON');
      let formula: Formula = this.allFormulas.find((f: Formula) => f.id === node.id)
      if (formula) {
        let i: number = 0;
        let nodeFormulaInfos: any[] = [];
        formula.components.forEach((_c: any) => {
          if (formula.operators[i] === 'SEMICOLON') {
            let legend = (node.subFormulas > 1) ? formula.legends[i] : (node.legend ? node.legend : formula.name);
            legends.push(legend);
            nodeFormulaInfos.push({ id: 'node_' + node.position + '_' + i, name: legend });
            lastSemicolonControl = true;
          }
          i++;
        });
        this.measuresInfo.push({ position: node.position, info: nodeFormulaInfos });
      }
    } else {
      nodeIds.push("d_" + node.id);
      aggregations.push(node.aggregation);
      operations.push(node.operation);
      positiveNegativeValues.push(node.is_positive_negative_value ? node.positive_negative_value : '');
      excludeOutliers.push(node.exclude_outliers);
      lastSemicolonControl = (node.operation === 'SEMICOLON');
      legends.push((node.operation === 'SEMICOLON') ? node.legend : undefined);
      if (node.operation === 'SEMICOLON')
        this.measuresInfo.push({ position: node.position, info: [{ id: 'node_' + node.position, name: node.legend }] });
    }

    return lastSemicolonControl;
  }

  loadMeasures(node: any, index: Index, exportCsv: boolean): void {
    this.isLoadingMeasures = true;
    this.measuresLoaded = false;
    let vNodes: any = this.saveLoad(node, index);
    if ((vNodes.nodeIds && (vNodes.nodeIds.length > 0)) || (this.indices.length > 0)) {
      if (this.checkFormula === true) {
        this.httpUtils.errorDialog({ status: 499, error: { errorCode: 8495 } });
        this.isLoadingMeasures = false;
        this.checkFormula = false;
        this.drainsTree.endLoadingMeasure();
        return;
      } else if (((vNodes.nodeIds && (vNodes.nodeIds.length > 0)) && !vNodes.lastSemicolon)) {
        this.httpUtils.errorDialog({ status: 499, error: { errorCode: 8499 } });
        this.isLoadingMeasures = false;
        this.checkFormula = false;
        this.drainsTree.endLoadingMeasure();
        return;
      }
      let start_time = new Date(moment(this.measuresForm.get('startTime').value).toISOString());
      let end_time = new Date(moment(this.measuresForm.get('endTime').value).toISOString());
      if (end_time < start_time) {
        this.httpUtils.errorDialog({ status: 496, error: { errorCode: 8496 } });
        this.isLoadingMeasures = false;
        this.drainsTree.endLoadingMeasure();
        return;
      }
      let requests: Observable<any>[] = [];
      let indexRequests: any[] = [];
      if (index) {
        indexRequests.push([]);
      } else if (!node && (this.indices.length > 0)) {
        this.indices.forEach((_index: Index) => {
          indexRequests.push([]);
        });
      }
      let years: number = 0;
      if ((start_time.getFullYear() === end_time.getFullYear()) || (this.measuresForm.get('timeAggregation').value === 'ALL')) {
        if (vNodes.nodeIds && (vNodes.nodeIds.length > 0)) {
          if (this.costs)
            requests.push(this.measuresService.getCosts(this.costsDrain.id, vNodes.nodeIds.toString(), vNodes.excludeOutliers.toString(), vNodes.positiveNegativeValues.toString(), this.measuresForm.get('costsAggregation').value, vNodes.operations.toString(), this.httpUtils.getDateTimeForUrl(start_time, true), this.httpUtils.getDateTimeForUrl(end_time, true), this.measuresForm.get('timeAggregation').value));
          else
            requests.push(this.measuresService.getMeasures(vNodes.nodeIds.toString(), vNodes.excludeOutliers.toString(), vNodes.positiveNegativeValues.toString(), vNodes.aggregations.toString(), vNodes.operations.toString(), this.httpUtils.getDateTimeForUrl(start_time, true), this.httpUtils.getDateTimeForUrl(end_time, true), this.measuresForm.get('timeAggregation').value, false));
        }
        if (index) {
          indexRequests[0].push(this.indicesService.calculateIndex(index.id, this.httpUtils.getDateTimeForUrl(start_time, true), this.httpUtils.getDateTimeForUrl(end_time, true), this.measuresForm.get('timeAggregation').value));
        } else if (!node && (this.indices.length > 0)) {
          let i = 0;
          this.indices.forEach((index: Index) => {
            if (indexRequests[i])
              indexRequests[i].push(this.indicesService.calculateIndex(index.id, this.httpUtils.getDateTimeForUrl(start_time, true), this.httpUtils.getDateTimeForUrl(end_time, true), this.measuresForm.get('timeAggregation').value));
            else
              indexRequests[i] = [this.indicesService.calculateIndex(index.id, this.httpUtils.getDateTimeForUrl(start_time, true), this.httpUtils.getDateTimeForUrl(end_time, true), this.measuresForm.get('timeAggregation').value)];
            i++;
          });
        }
        years++;
      } else {
         let start = moment(start_time);
         let end = moment(end_time);
         while (moment(start_time) < end) {
           start = (start_time.getFullYear() === new Date(end.toISOString()).getFullYear()) ? moment(start_time) : moment(end).startOf('year');
           if (vNodes.nodeIds && (vNodes.nodeIds.length > 0)) {
             if (this.costs)
               requests.push(this.measuresService.getCosts(this.costsDrain.id, vNodes.nodeIds.toString(), vNodes.excludeOutliers.toString(), vNodes.positiveNegativeValues.toString(), this.measuresForm.get('costsAggregation').value, vNodes.operations.toString(), this.httpUtils.getDateTimeForUrl(new Date(start.toISOString()), true), this.httpUtils.getDateTimeForUrl(new Date(end.toISOString()), true), this.measuresForm.get('timeAggregation').value));
             else
               requests.push(this.measuresService.getMeasures(vNodes.nodeIds.toString(), vNodes.excludeOutliers.toString(), vNodes.positiveNegativeValues.toString(), vNodes.aggregations.toString(), vNodes.operations.toString(), this.httpUtils.getDateTimeForUrl(new Date(start.toISOString()), true), this.httpUtils.getDateTimeForUrl(new Date(end.toISOString()), true), this.measuresForm.get('timeAggregation').value, false));
           }
           if (index) {
             indexRequests[0].push(this.indicesService.calculateIndex(index.id, this.httpUtils.getDateTimeForUrl(new Date(start.toISOString()), true), this.httpUtils.getDateTimeForUrl(new Date(end.toISOString()), true), this.measuresForm.get('timeAggregation').value));
           } else if (!node && (this.indices.length > 0)) {
             let i = 0;
             this.indices.forEach((index: Index) => {
               if (indexRequests[i])
                 indexRequests[i].push(this.indicesService.calculateIndex(index.id, this.httpUtils.getDateTimeForUrl(new Date(start.toISOString()), true), this.httpUtils.getDateTimeForUrl(new Date(end.toISOString()), true), this.measuresForm.get('timeAggregation').value));
               else
                 indexRequests[i] = [this.indicesService.calculateIndex(index.id, this.httpUtils.getDateTimeForUrl(new Date(start.toISOString()), true), this.httpUtils.getDateTimeForUrl(new Date(end.toISOString()), true), this.measuresForm.get('timeAggregation').value)];
               i++;
             });
           }
           end = moment(start).add(-1, 'second');
           years++;
         }
      }
      let drainRequests = requests.length;
      let totalRequests: number;
      indexRequests.forEach((irs: any[]) => {
        irs.forEach((request: any) => {
          requests.push(request);
        });
      });
      totalRequests = requests.length;
      forkJoin(requests).subscribe({
        next: (results: any[]) => {
          let ml: number = this.measures ? this.measures.length : 0;
          if (this.measures && node) {
            if (node.type === 'formula') {
              for (let sf = 0; sf < node.subFormulas; sf++)
                this.measures.push(results[drainRequests - 1][sf]);
            } else {
              this.measures.push(results[drainRequests - 1][0]);
            }
          } else if (!index && (drainRequests > 0)) {
            this.measures = results[drainRequests - 1];
          }
          for (let i = drainRequests - 2; i >= 0; i--) {
            for (let j = ml; j < this.measures.length; j++) {
              if (this.measures[j])
                this.measures[j].measures = this.measures[j].measures.concat(results[i][j - ml].measures);
              else
                this.measures[j].measures = results[i][j - ml].measures;
            }
          }
          this.indexResults = [];
          let i: number = totalRequests - 1;
          let k: number = 0;
          while (i >= drainRequests) {
            for (let j = 0; j < years; j++) {
              if (j == 0) {
                this.indexResults.push(results[i]);
              } else {
                if (results[i].result)
                  if (this.indexResults[k] && this.indexResults[k].result)
                    this.indexResults[k].result = this.indexResults[k].result.concat(results[i].result);
                  else
                    this.indexResults[k].result = results[i].result;
              }
              i--;
            }
            k++;
          }
          this.isLoadingMeasures = false;
          this.measuresLoaded = true;
          this.needReloadMeasures = false;
          this.drainsTree.endLoadingMeasure();
          if (exportCsv) {
            this.exportCsv();
          } else if (this.chart && (node || index)) {
            if (index) {
              this.addIndexResults(this.indexResults[this.indexResults.length - 1], true);
            } else {
              let measureInfo = this.measuresInfo.find((info: any) => info.position === node.position);
              if (node.type === 'formula') {
                let infoSf = 0;
                for (let sf = node.subFormulas; sf > 0; sf--) {
                  this.addMeasures(this.measures[this.measures.length - sf], measureInfo.info[infoSf].id, measureInfo.info[infoSf].name, true);
                  infoSf++;
                }
              } else {
                this.addMeasures(this.measures[this.measures.length - 1], measureInfo.info[0].id, measureInfo.info[0].name, true);
              }
            }
          } else {
            this.drawChart();
          }
        },
        error: (error: any) => {
          if (error.status !== 401)
            this.httpUtils.errorDialog(error);
          this.isLoadingMeasures = false;
          this.drainsTree.endLoadingMeasure();
        }
      });
    }
  }

  drawChart(): void {
    this.chart = undefined;
    this.chartLabels = [];
    this.chartSeries = [];
    this.unitArray = [];
    if (this.indexResults && (this.indexResults.length > 0)) {
      this.indexResults.forEach((index: Index) => {
        this.addIndexResults(index, false);
      });
    }
    if (this.measures && (this.measuresInfo.length > 0)) {
      let pos = 0;
      let sf = 0;
      let measureNodes = this.nodes.filter((n: any) => n.visible && (n.operation === 'SEMICOLON'));
      this.measures.forEach((m: Measures) => {
        if ((measureNodes.length > pos)) {
          let measureInfo = this.measuresInfo.find((info: any) => info.position === measureNodes[pos].position);
          if (measureInfo && (measureInfo.info.length > sf))
            this.addMeasures(m, measureInfo.info[sf].id, measureInfo.info[sf].name, false);
          if ((measureNodes[pos].type === 'formula') && (sf < (measureNodes[pos].subFormulas - 1))) {
            sf++;
          } else {
            sf = 0;
            pos++;
          }
        }
      });
    }
    if (!this.noMeasuresFound && (this.chartSeries.length > 0)) {
      let options = {};
      options['type'] = this.measuresForm.get('chartType').value === 'stacked' ? 'column' : this.measuresForm.get('chartType').value;
      options['height'] = Math.max(200, window.screen.height * 0.5);
      options['series'] = this.chartSeries;
      options['dark_theme'] = this.user.dark_theme;
      if (this.measuresForm.get('chartType').value === 'pie') {
        this.chart = this.pieChart.createPieChart(options);
      } else {
        options['y_axis'] = this.chartLabels;
        options['legend'] = true;
        options['legend_layout'] = (this.isHeatmapChart) ? 'h' : 'v';
        if (this.isHeatmapChart) {
          let isBoolean: boolean = (this.measures && (this.measures.length === 1) && (this.measures[0].measure_type === 'c'));
          let colors: any[] = isBoolean ? [ [0, '#FF0000'], [1, '#00FF00'] ] : [ [0, '#00FF00'], [0.5, '#FFFF00'], [0.9, '#FF0000'] ];
          if (this.measuresForm.get('color1').value || this.measuresForm.get('color2').value || this.measuresForm.get('color3').value) {
            colors = [];
            if (this.measuresForm.get('color1').value)
              colors.push([0, '#' + this.measuresForm.get('color1').value.hex]);
            if (this.measuresForm.get('color2').value)
              colors.push([0.5, '#' + this.measuresForm.get('color2').value.hex]);
            if (this.measuresForm.get('color3').value)
              colors.push([0.9, '#' + this.measuresForm.get('color3').value.hex]);
          }
          options['color_axis'] = { stops: colors, max: isBoolean ? 1 : undefined, min: isBoolean ? 0 : undefined };
          options['navigator'] = false;
        } else {
          options['navigator'] = true;
          options['plot_options'] = this.measuresForm.get('chartType').value === 'stacked' ? { column: { stacking: 'normal', dataLabels: { enabled: true, format: '{point.percentage:.0f}%', style: { fontSize: '1.1em' } } } } : { series: { marker: { enabled: this.measuresForm.get('showMarkers').value }, dataGrouping: { enabled: (this.measuresForm.get('chartAggregation').value === 'None') ? false : true, approximation: (this.measuresForm.get('chartAggregation').value === 'None') ? null : this.measuresForm.get('chartAggregation').value } } }
        }
        this.chart = this.timeChart.createTimeChart(options);
      }
      this.chart.ref$.subscribe((ref: Chart) => { this.chartRef = ref });
    }
  }

  addMeasures(m: Measures, id: string, name: string, addToChart: boolean): void {
    if (!m.decimals && (m.decimals !== 0))
      m.decimals = 2;
    if (m.measures) {
      let nodeId = id ? id : 'nodes_0';
      let nodeName = (name ?  name : m.drain_name) + ((m.unit && (m.unit !== '?')) ? ' (' + m.unit + ')' : '');
      if (this.measuresForm.get('chartType').value === 'pie') {
        let component = this;
        m.measures.forEach((measure: Measure) => {
          if ((measure.value !== null) && (measure.value !== undefined) && !Number.isNaN(parseFloat(measure.value.toString()))) {
            component.chartSeries.push(component.pieChart.createSerie(measure.value, nodeId, nodeName, false));
            if (addToChart)
              component.chartRef.series[0].addPoint(component.chartSeries[this.chartSeries.length - 1]);
          }
        });
      } else {
        let yAxisIndex: number = this.selectYAxis(m.unit, addToChart);
        let data_array: any[] = [];
        let component = this;
        m.measures.forEach((measure: Measure) => {
          if ((measure.value !== null) && (measure.value !== undefined) && !Number.isNaN(parseFloat(measure.value.toString())))
            data_array.push(component.timeChart.createData(new Date(measure.time), measure.value.toString(), (m.measure_type === 'c') ? 0 : m.decimals, component.isHeatmapChart, component.measuresForm.get('timeAggregation').value));
        });
        if (data_array.length > 0)
          this.noMeasuresFound = false;
        this.chartSeries.push(this.timeChart.createSerie(data_array, nodeId, nodeName, yAxisIndex, m.decimals, this.isHeatmapChart, (this.measuresForm.get('chartType').value === 'stacked'), m.measure_type, this.measuresForm.get('timeAggregation').value));
        if (addToChart)
          this.chartRef.addSeries(this.chartSeries[this.chartSeries.length - 1]);
      }
    }
  }

  addIndexResults(index: Index, addToChart: boolean): void {
    if (!index.decimals && (index.decimals !== 0))
      index.decimals = 2;
    if (index.result) {
      let indexId = 'index_' + index.id;
      let indexName = index.name + (index.measure_unit ? ' (' + index.measure_unit + ')' : '');
      if (this.measuresForm.get('chartType').value === 'pie') {
        index.result.forEach((measure: any) => {
          if (!Number.isNaN(parseFloat(measure.value))) {
            this.chartSeries.push(this.pieChart.createSerie(parseFloat(measure.value), indexId, indexName, false));
            if (addToChart)
              this.chartRef.series[0].addPoint(this.chartSeries[this.chartSeries.length - 1]);
          }
        });
      } else {
        let yAxisIndex: number = this.selectYAxis(index.measure_unit, addToChart);
        let data_array: any[] = [];
        let component = this;
        index.result.forEach((measure: any) => {
          if (!Number.isNaN(parseFloat(measure.value)))
            data_array.push(component.timeChart.createData(new Date(measure.at), measure.value.toString(), index.decimals, this.isHeatmapChart, this.measuresForm.get('timeAggregation').value));
        });
        if (data_array.length > 0)
          this.noMeasuresFound = false;
        this.chartSeries.push(this.timeChart.createSerie(data_array, indexId, indexName, yAxisIndex, index.decimals, this.isHeatmapChart, (this.measuresForm.get('chartType').value === 'stacked'), 'f', this.measuresForm.get('timeAggregation').value));
        if (addToChart)
          this.chartRef.addSeries(this.chartSeries[this.chartSeries.length - 1]);
      }
    }
  }

  selectYAxis(measure_unit: string, addToChart: boolean): number {
    let yAxisIndex: number;
    if ((this.unitArray.length > 0) && (this.unitArray.includes(measure_unit))) {
      yAxisIndex = this.unitArray.indexOf(measure_unit);
    } else {
      this.unitArray.push(measure_unit);
      yAxisIndex = this.unitArray.length - 1;
      this.chartLabels[yAxisIndex] = this.timeChart.createYAxis(measure_unit, this.unitArray.length, this.measuresForm.get('alarmValue').value, this.measuresForm.get('warningValue').value, undefined, undefined, this.isHeatmapChart, 'f', this.measuresForm.get('timeAggregation').value, false, this.user.dark_theme);
      if (addToChart)
        this.chartRef.addAxis(this.chartLabels[yAxisIndex], false);
    }

    return yAxisIndex;
  }

  onDrop(event: CdkDragDrop<any[]>) {
    if (event.previousIndex !== event.currentIndex) {
      this.optionsChanged = true;
      let drainCopy = [];
      this.nodes.forEach((d,i) => {
        drainCopy.push(d);
        this.measuresForm.removeControl('positiveNegativeValue_' + i);
        this.measuresForm.removeControl('aggregation_' + i);
        this.measuresForm.removeControl('operation_' + i);
        this.measuresForm.removeControl('legend_' + i);
      });
      this.nodes = [];
      moveItemInArray(drainCopy, event.previousIndex, event.currentIndex);
      this.isChangingOptionsMeasure = true;
      setTimeout(() => {
        drainCopy.forEach((d, i) => {
          this.createDrainControls(i, d.exclude_outlier, d.positive_negative_value, d.aggregation, d.operation, d.legend);
          this.nodes.push(d);
        });
        this.needReloadMeasures = true;
        this.isChangingOptionsMeasure = false;
      }, 500);
    }
  }

  exportCsv(): void {
    if (this.needReloadMeasures)
      this.loadMeasures(undefined, undefined, true);
    let columnNames: string[] = [];
    this.indices.forEach((index: Index) => {
      columnNames.push(index.name);
    });
    this.measuresInfo.forEach((mi: any) => {
      mi.info.forEach((info: any) => {
        columnNames.push(info.name);
      });
    });
    const link = document.createElement("a");
    link.href = this.httpUtils.createCsvContent(columnNames, this.indexResults, this.measures);
    link.download = 'drain_data.csv';
    link.click();
  }

  shareLink(): void {
    let dataDrain: any = this.saveLoad(undefined, undefined);
    this.clipboard.copy(this.httpUtils.createLinkToShare(null, dataDrain, this.indices, this.measuresForm));
    this.httpUtils.successSnackbar(this.translate.instant('MEASURES.LINKCOPIED'));
  }

  goBack(): void {
    this.location.back();
  }
}
