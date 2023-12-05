import { Clipboard } from '@angular/cdk/clipboard';
import { Location } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Color } from '@angular-material-components/color-picker';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { forkJoin, Observable } from 'rxjs';

import * as moment from 'moment';

import { Client } from '../_models/client';
import { Drain } from '../_models/drain';
import { Feed } from '../_models/feed';
import { Formula } from '../_models/formula';
import { Organization } from '../_models/organization';
import { Measure } from '../_models/measure';
import { Measures } from '../_models/measures';

import { ClientsService } from '../_services/clients.service';
import { DrainsService } from '../_services/drains.service';
import { FeedsService } from '../_services/feeds.service';
import { FormulasService } from '../_services/formulas.service';
import { OrganizationsService } from '../_services/organizations.service';
import { MeasuresService } from '../_services/measures.service';

import { PieChart } from '../_utils/chart/pie-chart';
import { TimeChart } from '../_utils/chart/time-chart';
import { DrainsTreeDialogComponent } from '../_utils/drains-tree-dialog/drains-tree-dialog.component';
import { FormulasTreeDialogComponent } from '../_utils/formulas-tree-dialog/formulas-tree-dialog.component';
import { HttpUtils } from '../_utils/http.utils';
import { OrganizationsTree } from '../_utils/tree/organizations-tree';

@Component({
  templateUrl: './costs.component.html',
  styleUrls: ['./costs.component.scss']
})
export class CostsComponent implements OnInit {

  isLoading: boolean = true;
  isLoadingCosts: boolean = false;
  costsLoaded: boolean = false;
  isSaving: boolean = false;
  params: any = {};
  allOrgs: Organization[] = [];
  energyClients: Client[] = [];
  allFeeds: Feed[] = [];
  allDrains: Drain[] = [];
  allFormulas: Formula[] = [];
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
  drains: any[] = [];
  costs: Measures[];
  chartTypes: any[] = [];
  visibleChartTypes: any[] = [];
  isSplineChart: boolean = true;
  isPieChart: boolean = false;
  isHeatmapChart: boolean = false;
  chartAggregations: any[] = [];
  tableTypes: string[] = ['None', 'Time'];
  chartSeries: any[] = [];
  chartLabels: any[] = [];
  chart: any;
  costsForm: FormGroup;
  group: any = {};
  formulaId: number;
  visibleDrains: boolean = false;
  chartOptions: boolean = false;
  seriesNames: string[] = [];
  backRoute: string = 'dashboard';

  constructor(private orgsService: OrganizationsService, private clientsService: ClientsService, private feedsService: FeedsService, private drainsService: DrainsService, private formulasService: FormulasService, private measuresService: MeasuresService, private timeChart: TimeChart, private pieChart: PieChart, private organizationsTree: OrganizationsTree, private route: ActivatedRoute, private router: Router, private location: Location, private clipboard: Clipboard, private dialog: MatDialog, private httpUtils: HttpUtils, private translate: TranslateService) {}

  ngOnInit(): void {
    this.costsAggregations = this.httpUtils.getMeasuresAggregationsForMeasureType('f');
    this.costsOperations = this.httpUtils.getMeasuresOperationsForMeasureType('f');
    this.chartAggregations = this.httpUtils.getChartAggregations();
    this.translate.get('CHART.SPLINE').subscribe((spline: string) => {
      this.chartTypes.push({ id: 'spline', description: spline, visible: true });
      this.translate.get('CHART.HISTOGRAM').subscribe((histogram: string) => {
        this.chartTypes.push({ id: 'column', description: histogram, visible: true });
        this.translate.get('CHART.HEATMAP').subscribe((heatmap: string) => {
          this.chartTypes.push({ id: 'heatmap', description: heatmap, visible: false });
          this.translate.get('CHART.PIE').subscribe((pie: string) => {
            this.chartTypes.push({ id: 'pie', description: pie, visible: true });
          });
        });
      });
    });
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

    this.route.queryParams.subscribe((params: any) => {
      this.params = params;
      this.createCostsForm();
      forkJoin([this.orgsService.getOrganizations(), this.clientsService.getClients(), this.feedsService.getFeeds(), this.drainsService.getDrains(), this.formulasService.getFormulas()]).subscribe({
        next: (results: any) => {
          this.allOrgs = results[0];
          this.energyClients = results[1].filter((c: Client) => c.energy_client);
          this.allFeeds = results[2];
          this.allDrains = results[3];
          this.allFormulas = results[4];
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
                    this.unitDrains = this.allDrains.filter(d => (d.measure_unit && d.measure_unit.toLowerCase().includes('wh') && !d.measure_unit.toLowerCase().includes('€')));
                    let data = { orgs: [], clients: [], feeds: [], drains: [] };
                    this.addDrainsForTree(data, this.unitDrains);
                    this.unitOrgs = data.orgs;
                    this.unitClients = data.clients;
                    this.unitFeeds = data.feeds;
                }
              }
            }
          }
          let data = { orgs: [], clients: [], feeds: [], drains: [] };
          this.addDrainsForTree(data, this.costsDrains);
          this.costsOrgs = data.orgs;
          this.costsFeeds = data.feeds;
          this.costsClients = data.clients;
          if (this.params.drainIds || this.params.formulaIds) {
            if (this.params.drainIds) {
              var drainIds = this.params.drainIds.split(',');
              var drainOperations = this.params.operations ? this.params.operations.split(',') : [];
              var drainLegends = this.params.legends ? this.params.legends.split(',') : [];
              let i: number = 0;
              drainIds.forEach((drainId: string) => {
                if (drainId.slice(0,1) === 'd') {
                  let drain = this.allDrains.find(d => d.id === parseInt(drainId.slice(2)));
                  if (drain)
                    this.loadDrain(drain, (drainOperations.length > i) ? drainOperations[i] : 'SEMICOLON', (drainLegends.length > i) ? drainLegends[i] : undefined);
                  i++;
                } else if (drainId.slice(0,1) === 'f') {
                  let formula = this.allFormulas.find(f => f.id === parseInt(drainId.slice(2)));
                  if (formula)
                    this.loadFormula(formula);
                }
              });
            }
            this.setChartTypesVisible();
            this.isSplineChart = (this.params.chartType === 'spline') ? true : false;
            this.isPieChart = (this.params.chartType === 'pie') ? true : false;
            this.isHeatmapChart = (this.params.chartType === 'heatmap') ? true : false;
            this.loadCosts();
          }

          this.isLoading = false;
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

  createCostsForm() {
    let patterns = this.httpUtils.getPatterns();
    let color1_rgb = this.params.color1 ? this.httpUtils.hexToRgb(this.params.color1.toLowerCase().replace('%23', '#')) : undefined;
    let color2_rgb = this.params.color2 ? this.httpUtils.hexToRgb(this.params.color2.toLowerCase().replace('%23', '#')) : undefined;
    let color3_rgb = this.params.color3 ? this.httpUtils.hexToRgb(this.params.color3.toLowerCase().replace('%23', '#')) : undefined;
    this.group['startTime'] = new FormControl(this.params.startTime ? new Date(this.params.startTime) : new Date(moment().add(-1, 'hour').toISOString()), [ Validators.required ]);
    this.group['endTime'] = new FormControl(this.params.endTime ? new Date(this.params.endTime) : new Date(moment().toISOString()), [ Validators.required ]);
    this.group['timeAggregation'] = new FormControl(this.params.timeAggregation ? this.params.timeAggregation : 'QHOUR', [ Validators.required ]);
    this.group['costsAggregation'] = new FormControl(this.params.costsAggregation ? this.params.costsAggregation : 'SUM', [ Validators.required ]);
    this.group['chartType'] = new FormControl(this.params.chartType ? this.params.chartType : 'spline', [ Validators.required ]);
    this.group['showMarkers'] = new FormControl(this.params.showMarkers ? this.params.showMarkers : false, []);
    this.group['chartAggregation'] = new FormControl(this.params.chartAggregation ? this.params.chartAggregation : 'average', [ Validators.required ]);
    this.group['color1'] = new FormControl(color1_rgb ? new Color(color1_rgb.r, color1_rgb.g, color1_rgb.b) : undefined, []);
    this.group['color2'] = new FormControl(color2_rgb ? new Color(color2_rgb.r, color2_rgb.g, color2_rgb.b) : undefined, []);
    this.group['color3'] = new FormControl(color3_rgb ? new Color(color3_rgb.r, color3_rgb.g, color3_rgb.b) : undefined, []);
    this.group['warningValue'] = new FormControl(this.params.warningValue ? this.params.warningValue : '', [ Validators.pattern(patterns.positiveNegativeFloat) ]);
    this.group['alarmValue'] = new FormControl(this.params.alarmValue ? this.params.alarmValue : '', [ Validators.pattern(patterns.positiveNegativeFloat) ]);
    this.costsForm = new FormGroup(this.group);
    this.costsForm.get('timeAggregation').valueChanges.subscribe((_t: string) => {
      this.setChartTypesVisible();
    });
    this.costsForm.get('chartType').valueChanges.subscribe((t: string) => {
      this.isSplineChart = (t === 'spline') ? true : false;
      this.isPieChart = (t === 'pie') ? true : false;
      this.isHeatmapChart = (t === 'heatmap') ? true : false;
      this.drawChart();
    });
    this.costsForm.get('showMarkers').valueChanges.subscribe((_s: boolean) => {
      this.drawChart();
    });
    this.costsForm.get('chartAggregation').valueChanges.subscribe((_a: string) => {
      this.drawChart();
    });
    this.costsForm.get('warningValue').valueChanges.subscribe((_s: number) => {
      this.drawChart();
    });
    this.costsForm.get('alarmValue').valueChanges.subscribe((_s: number) => {
      this.drawChart();
    });
  }

  createDrainControls(i: number, operation: string, legend: String): void {
    this.group['operation_' + i] = new FormControl(operation ? operation : 'SEMICOLON', [ Validators.required ]);
    this.costsForm.get('operation_' + i).valueChanges.subscribe((o: string) => {
      this.drains[i].operation = o;
      if (o === 'SEMICOLON') {
        if (this.drains.length > (i + 1)) {
          let k = 0;
          for (let drain of this.drains) {
            if (k > i) {
              if (drain.visible) {
                this.costsForm.get('legend_' + k).setValue(drain.full_name);
                this.drains[k].legend = drain.full_name;
                break;
              }
            }
            k++;
          }
        }
      }
      this.setChartTypesVisible();
    });
    this.group['legend_' + i] = new FormControl(legend, []);
    this.costsForm.get('legend_' + i).valueChanges.subscribe((n: string) => {
      if (this.costsForm.get('operation_' + i).value === 'SEMICOLON')
        this.drains[i].legend = n;
    });
  }

  compareObjects(o1: any, o2: any): boolean {
    return (o2 != null) && (o1.id === o2.id);
  }

  setLastHour(): void {
    this.costsForm.patchValue({ startTime: new Date(moment().add(-1, 'hour').toISOString()), endTime: new Date(moment().toISOString()) });
  }

  setLastDay(): void {
    this.costsForm.patchValue({ startTime: new Date(moment().add(-1, 'day').toISOString()), endTime: new Date(moment().toISOString()) });
  }

  setLastWeek(): void {
    this.costsForm.patchValue({ startTime: new Date(moment().add(-7, 'day').toISOString()), endTime: new Date(moment().toISOString()) });
  }

  setLastMonth(): void {
    this.costsForm.patchValue({ startTime: new Date(moment().add(-1, 'month').toISOString()), endTime: new Date(moment().toISOString()) });
  }

  setChartTypesVisible(): void {
    let visible = false;
    if (this.costsForm.get('timeAggregation').value) {
      let timeAggr = this.timeAggregations.find(agg => agg.id === this.costsForm.get('timeAggregation').value);
      if (timeAggr) {
        if ((timeAggr.order > 2) && (timeAggr.order < 6)) {
          let visibleDrains: any[] = this.drains.filter(d => d.visible);
          if ((visibleDrains.length <= 1) || (visibleDrains.filter(d => d.operation === 'SEMICOLON').length <= 1))
            visible = true;
        }
      }
      this.chartTypes.find(c => c.id === 'pie').visible = (this.costsForm.get('timeAggregation').value === 'ALL');
    }
    this.chartTypes.find(c => c.id === 'heatmap').visible = visible;
    this.visibleChartTypes = this.chartTypes.filter(t => t.visible);
    if (((this.costsForm.get('chartType').value === 'heatmap') && !visible) || ((this.costsForm.get('chartType').value === 'pie') && (this.costsForm.get('timeAggregation').value !== 'ALL')))
      this.costsForm.patchValue({ chartType: 'spline' });
  }

  addDrainsForTree(data: any, drains: Drain[]): void {
    drains.forEach((drain: Drain) => {
      this.organizationsTree.selectDrain(data, this.allOrgs, this.energyClients, this.allFeeds, this.allDrains, drain.id);
    });
  }

  selectCostDrain(): void {
    const dialogRef = this.dialog.open(DrainsTreeDialogComponent, { width: '75%', data: { orgs: this.costsOrgs, clients: this.costsClients, feeds: this.costsFeeds, drains: this.costsDrains, formulas: [], showDetails: true, singleDrain: true } });
    dialogRef.afterClosed().subscribe((result: any) => {
      if (result && result.id) {
        this.costsDrain = { id: result.id, full_name: result.full_name };
        this.unitDrains = this.allDrains.filter(d => (d.measure_unit && d.measure_unit.toLowerCase().includes('wh') && !d.measure_unit.toLowerCase().includes('€')));
        let data = { orgs: [], clients: [], feeds: [], drains: [] };
        this.addDrainsForTree(data, this.unitDrains);
        this.unitOrgs = data.orgs;
        this.unitClients = data.clients;
        this.unitFeeds = data.feeds;
      }
    });
  }

  addDrains(): void {
    const dialogRef = this.dialog.open(DrainsTreeDialogComponent, { width: '75%', data: { orgs: this.unitOrgs, clients: this.unitClients, feeds: this.unitFeeds, drains: this.unitDrains.filter(d => ((d.measure_type !== 'C') && (d.measure_type !== 's'))), formulas: [], showDetails: true } });
    dialogRef.afterClosed().subscribe((result: any[]) => {
      if (result) {
        let component = this;
        result.forEach(function (selected: any) {
          let drain = component.allDrains.find((d: Drain) => d.id === selected.id);
          if (drain)
            component.loadDrain(drain, 'SEMICOLON', undefined);
        });
        component.setChartTypesVisible();
      }
    });
  }

  removeDrain(i: number): void {
    this.drains[i].visible = false;
    this.visibleDrains = this.drains.find(drain => (drain.visible === true)) ? true : false;
    if (!this.visibleDrains)
      this.formulaId = undefined;
    this.setChartTypesVisible();
  }

  loadDrain (drain: Drain, operation: string, legend: string) {
    let feed = this.allFeeds.find(f => f.id === drain.feed_id);
    if (feed) {
      let client = this.energyClients.find(c => (feed.client_ids.indexOf(c.id) > -1));
      if (client) {
        let org = this.allOrgs.find(o => o.id === client.org_id);
        if (org) {
          if (!legend)
            legend = client.name + ' - ' + drain.name;
          this.createDrainControls(this.drains.length, operation, legend)
          this.drains.push({ id: drain.id, visible: true, full_name: ((this.allOrgs.length > 1) ? org.name + ' - ' : '') + client.name + ' - ' + feed.description + ' - ' + drain.name + (drain.measure_unit ? ' (' + drain.measure_unit + ')' : ''), operation: operation, legend: legend, show_legend: false });
          this.visibleDrains = true;
        }
      }
    }
  }

  showLegend(i: number): void {
    this.drains[i].show_legend = !this.drains[i].show_legend;
  }

  loadFormulas(): void {
    let component = this;
    let data = { orgs: [], clients: [], formulas: [] };
    this.allFormulas.forEach((formula: Formula) => {
      this.organizationsTree.selectFormula(data, component.allOrgs, component.energyClients, component.allFormulas, formula.id);
    });
    const dialogRef = this.dialog.open(FormulasTreeDialogComponent, { width: '75%', data: { orgs: data.orgs, clients: data.clients, formulas: data.formulas } });
    dialogRef.afterClosed().subscribe((result: any[]) => {
      if (result) {
        let component = this;
        result.forEach(function (formula: Formula) {
          if (formula.components) {
            let i = 0;
            formula.components.forEach(function (drain_id: number) {
              let drain = component.allDrains.find(d => d.id === drain_id);
              if (drain)
                component.loadDrain(drain, formula.operators[i], formula.legends[i]);
              i++;
            });
          }
        });
        this.formulaId = ((result.length === 1) && !this.formulaId) ? result[0].id : undefined;
        this.setChartTypesVisible();
      }
    });
  }

  loadFormula(formula: Formula): void {
    if (formula.components) {
      let i = 0;
      let component = this;
      formula.components.forEach(function (drain_id: number) {
        let drain = component.allDrains.find(d => d.id === drain_id);
        if (drain)
          component.loadDrain(drain, formula.operators[i], formula.legends[i]);
        i++;
      });
    }
  }

  saveLoad(): any {
    let drainIds = [];
    let operations = [];
    let lastSemicolonControl: boolean = false;
    let legends = [];
    this.seriesNames = [];
    this.drains.forEach(drain => {
      if (drain.visible) {
        drainIds.push('d_' + drain.id);
        operations.push(drain.operation);
        lastSemicolonControl = (drain.operation === 'SEMICOLON');
        legends.push((drain.operation === 'SEMICOLON') ? drain.legend : undefined);
        if (drain.operation === 'SEMICOLON')
          this.seriesNames.push(drain.legend);
      }
    });
    return { drainIds: drainIds, operations: operations, lastSemicolon: lastSemicolonControl, legends: legends };
  }

  loadCosts(): void {
    this.isLoadingCosts = true;
    this.costsLoaded = false;
    let dataDrain: any = this.saveLoad();
    if (dataDrain.drainIds !== '') {
      if (!dataDrain.lastSemicolon) {
        this.httpUtils.errorDialog({ status: 499, error: { errorCode: 8499 } });
        this.isLoadingCosts = false;
        return;
      }
      let requests: Observable<any>[] = [];
      let start_time = new Date(moment(this.costsForm.get('startTime').value).toISOString());
      let end_time = new Date(moment(this.costsForm.get('endTime').value).toISOString());
      if (end_time < start_time) {
        this.httpUtils.errorDialog({ status: 496, error: { errorCode: 8496 } });
        this.isLoadingCosts = false;
        return;
      }
      if ((start_time.getFullYear() === end_time.getFullYear()) || (this.costsForm.get('timeAggregation').value === 'ALL')) {
        requests.push(this.measuresService.getCosts(this.costsDrain.id, dataDrain.drainIds.toString(), this.costsForm.get('costsAggregation').value, dataDrain.operations.toString(), this.httpUtils.getDateTimeForUrl(start_time, true), this.httpUtils.getDateTimeForUrl(end_time, true), this.costsForm.get('timeAggregation').value));
      } else {
         let start = moment(start_time);
         let end = moment(end_time);
         while (moment(start_time) < end) {
           start = (start_time.getFullYear() === new Date(end.toISOString()).getFullYear()) ? moment(start_time) : moment(end).startOf('year');
           requests.push(this.measuresService.getCosts(this.costsDrain.id, dataDrain.drainIds.toString(), this.costsForm.get('costsAggregation').value, dataDrain.operations.toString(), this.httpUtils.getDateTimeForUrl(new Date(start.toISOString()), true), this.httpUtils.getDateTimeForUrl(new Date(end.toISOString()), true), this.costsForm.get('timeAggregation').value));
           end = moment(start).add(-1, 'second');
         }
      }
      forkJoin(requests).subscribe({
        next: (results: any) => {
          this.costs = results[results.length - 1];
          for (let i = results.length - 2; i >= 0; i--) {
            for (let j = 0; j < this.costs.length; j++) {
              this.costs[j].measures = this.costs[j].measures.concat(results[i][j].measures);
            }
          }
          this.isLoadingCosts = false;
          this.costsLoaded = true;
          this.drawChart();
        },
        error: (error: any) => {
          if (error.status !== 401)
            this.httpUtils.errorDialog(error);
          this.isLoadingCosts = false;
        }
      });
    }
  }

  drawChart(): void {
    this.chart = undefined;
    this.chartLabels = [];
    this.chartSeries = [];
    let unitArray = [];
    if (this.costs) {
      let i = 0;
      this.costs.forEach(m => {
        let drainColumnName = (((this.seriesNames.length > i) && this.seriesNames[i]) ? this.seriesNames[i] : m.drain_name) + ((m.unit && (m.unit !== '?')) ? ' (' + m.unit + ')' : '');
        if (!m.decimals && m.decimals !== 0)
          m.decimals = 2;
        if (m.measures) {
          if (this.costsForm.get('chartType').value === 'pie') {
            m.measures.forEach((measure: Measure) => {
              if ((measure.value !== null) && (measure.value !== undefined) && !Number.isNaN(parseFloat(measure.value.toString())))
                this.chartSeries.push(this.pieChart.createSerie(measure.value, drainColumnName, m.decimals));
            });
          } else {
            let yAxisIndex: number;
            if ((unitArray.length > 0) && (unitArray.includes(m.unit))) {
              yAxisIndex = unitArray.indexOf(m.unit);
            } else {
              unitArray.push(m.unit);
              yAxisIndex = unitArray.length - 1;
              this.chartLabels[yAxisIndex] = this.timeChart.createYAxis(m.unit, unitArray.length, this.costsForm.get('alarmValue').value, this.costsForm.get('warningValue').value, undefined, undefined, this.isHeatmapChart, m.measure_type, this.costsForm.get('timeAggregation').value);
            }
            let data_array: any[] = [];
            let component = this;
            m.measures.forEach((measure: Measure) => {
              if ((measure.value !== null) && (measure.value !== undefined) && !Number.isNaN(parseFloat(measure.value.toString())))
                data_array.push(component.timeChart.createData(new Date(measure.time), measure.value.toString(), m.decimals, this.isHeatmapChart, this.costsForm.get('timeAggregation').value));
            });
            if (data_array.length > 0)
              this.chartSeries.push(this.timeChart.createSerie(data_array, drainColumnName, yAxisIndex, m.decimals, this.isHeatmapChart, m.measure_type, this.costsForm.get('timeAggregation').value));
          }
        }
        i++;
      });
    }
    if (this.chartSeries.length > 0) {
      let options = {};
      options['type'] = this.costsForm.get('chartType').value;
      options['height'] = Math.max(400, window.screen.height * 0.7);
      options['series'] = this.chartSeries;
      if (this.costsForm.get('chartType').value === 'pie') {
        this.chart = this.pieChart.createPieChart(options);
      } else {
        options['y_axis'] = this.chartLabels;
        options['legend'] = true;
        options['legend_layout'] = (this.isHeatmapChart) ? 'h' : 'v';
        if (this.isHeatmapChart) {
          let colors: any[] = [ [0, '#00FF00'], [0.5, '#FFFF00'], [0.9, '#FF0000'] ];
          if (this.costsForm.get('color1').value || this.costsForm.get('color2').value || this.costsForm.get('color3').value) {
            colors = [];
            if (this.costsForm.get('color1').value)
              colors.push([0, '#' + this.costsForm.get('color1').value.hex]);
            if (this.costsForm.get('color2').value)
              colors.push([0.5, '#' + this.costsForm.get('color2').value.hex]);
            if (this.costsForm.get('color3').value)
              colors.push([0.9, '#' + this.costsForm.get('color3').value.hex]);
          }
          options['color_axis'] = { stops: colors };
          options['navigator'] = false;
        } else {
          options['navigator'] = true;
          options['plot_options'] = { series: { marker: { enabled: this.costsForm.get('showMarkers').value }, dataGrouping: { enabled: (this.costsForm.get('chartAggregation').value === 'None') ? false : true, approximation: (this.costsForm.get('chartAggregation').value === 'None') ? null : this.costsForm.get('chartAggregation').value } } }
        }
        this.chart = this.timeChart.createTimeChart(options);
      }
    }
  }

  exportCsv(): void {
    const link = document.createElement("a");
    link.href = this.httpUtils.createCsvContent(this.costs, this.seriesNames, null);
    link.download = 'costs_data.csv';
    link.click();
  }

  shareLink(): void {
    let dataDrain: any = this.saveLoad();
    this.clipboard.copy(this.httpUtils.createLinkToShare(this.costsDrain, dataDrain, null, this.costsForm));
    this.httpUtils.successSnackbar(this.translate.instant('COSTS.LINKCOPIED'));
  }

  goBack(): void {
    this.location.back();
  }
}
