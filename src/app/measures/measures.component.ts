import { Clipboard } from '@angular/cdk/clipboard';
import { Location } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Color } from '@angular-material-components/color-picker';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { forkJoin } from 'rxjs';

import * as moment from 'moment';

import { Client } from '../_models/client';
import { Drain } from '../_models/drain';
import { Feed } from '../_models/feed';
import { Formula } from '../_models/formula';
import { Index } from '../_models/index';
import { Organization } from '../_models/organization';
import { Measure } from '../_models/measure';
import { Measures } from '../_models/measures';

import { ClientsService } from '../_services/clients.service';
import { DrainsService } from '../_services/drains.service';
import { FeedsService } from '../_services/feeds.service';
import { FormulasService } from '../_services/formulas.service';
import { IndicesService } from '../_services/indices.service';
import { OrganizationsService } from '../_services/organizations.service';
import { MeasuresService } from '../_services/measures.service';

import { PieChart } from '../_utils/chart/pie-chart';
import { TimeChart } from '../_utils/chart/time-chart';
import { DrainsTreeDialogComponent } from '../_utils/drains-tree-dialog/drains-tree-dialog.component';
import { FormulasTreeDialogComponent } from '../_utils/formulas-tree-dialog/formulas-tree-dialog.component';
import { IndicesTreeDialogComponent } from "../_utils/indices-tree-dialog/indices-tree-dialog.component";
import { HttpUtils } from '../_utils/http.utils';
import { OrganizationsTree } from '../_utils/tree/organizations-tree';

@Component({
  templateUrl: './measures.component.html',
  styleUrls: ['./measures.component.scss']
})
export class MeasuresComponent implements OnInit {

  isLoading: boolean = true;
  isLoadingMeasures: boolean = false;
  measuresLoaded: boolean = false;
  isSaving: boolean = false;
  params: any = {};
  allOrgs: Organization[] = [];
  energyClients: Client[] = [];
  allFeeds: Feed[] = [];
  allDrains: Drain[] = [];
  allFormulas: Formula[] = [];
  allIndices: Index[] = [];
  timeAggregations: any[] = [];
  indices: Index[] = [];
  drains: any[] = [];
  measures: Measures[];
  indexResults: Index[];
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
  measuresForm: FormGroup;
  group: any = {};
  formulaId: number;
  formulaClients: Client[] = [];
  visibleDrains: boolean = false;
  chartOptions: boolean = false;
  seriesNames: string[] = [];
  backRoute: string = 'dashboard';

  constructor(private orgsService: OrganizationsService, private clientsService: ClientsService, private feedsService: FeedsService, private drainsService: DrainsService, private formulasService: FormulasService, private indicesService: IndicesService, private measuresService: MeasuresService, private organizationsTree: OrganizationsTree, private timeChart: TimeChart, private pieChart: PieChart, private route: ActivatedRoute, private router: Router, private location: Location, private clipboard: Clipboard, private dialog: MatDialog, private httpUtils: HttpUtils, private translate: TranslateService) {}

  ngOnInit(): void {
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
    this.translate.get('TIME.NONE').subscribe((none: string) => {
      this.timeAggregations.push({ id: 'NONE', description: none, order: 0 });
      this.translate.get('TIME.MINUTE').subscribe((minute: string) => {
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

    this.route.queryParams.subscribe((params: any) => {
      this.params = params;
      this.createMeasuresForm();
      forkJoin(this.orgsService.getOrganizations(), this.clientsService.getClients(), this.feedsService.getFeeds(), this.drainsService.getDrains(), this.formulasService.getFormulas(), this.indicesService.getIndices()).subscribe(
        (results: any) => {
          this.allOrgs = results[0];
          this.allOrgs.sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0);
          this.energyClients = results[1].filter((c: Client) => c.energy_client);
          this.energyClients.sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0);
          this.allFeeds = results[2];
          this.allDrains = results[3];
          this.allFormulas = results[4];
          this.allIndices = results[5];
          if (this.params.indexIds || this.params.drainIds || this.params.formulaIds) {
            if (this.params.indexIds) {
              var indexIds = this.params.indexIds.split(',');
              indexIds.forEach((indexId: string) => {
                let index = this.allIndices.find(i => i.id === parseInt(indexId));
                if (index && (!this.indices.find((i: Index) => i.id === index.id)))
                  this.indices.push(index);
              });
            }
            if (this.params.drainIds) {
              var drainIds = this.params.drainIds.split(',');
              var drainAggregations = this.params.aggregations ? this.params.aggregations.split(',') : [];
              var drainOperations = this.params.operations ? this.params.operations.split(',') : [];
              var drainLegends = this.params.legends ? this.params.legends.split(',') : [];
              let i: number = 0;
              drainIds.forEach((drainId: string) => {
                let drain = this.allDrains.find(d => d.id === parseInt(drainId));
                if (drain)
                  this.loadDrain(drain, (drainAggregations.length > i) ? drainAggregations[i] : 'AVG', (drainOperations.length > i) ? drainOperations[i] : 'SEMICOLON', (drainLegends.length > i) ? drainLegends[i] : undefined);
                i++;
              });
            }
            if (this.params.formulaIds) {
              var formulaIds = this.params.formulaIds.split(',');
              formulaIds.forEach((formulaId: string) => {
                let formula = this.allFormulas.find(f => f.id === parseInt(formulaId));
                if (formula)
                  this.loadFormula(formula);
              });
              if ((formulaIds.length === 1) && !this.formulaId && !this.params.drainIds)
                this.setFormulaData(this.allFormulas.find(f => f.id === parseInt(formulaIds[0])));
            }
            this.setChartTypesVisible();
            this.isSplineChart = (this.params.chartType === 'spline') ? true : false;
            this.isPieChart = (this.params.chartType === 'pie') ? true : false;
            this.isHeatmapChart = (this.params.chartType === 'heatmap') ? true : false;
            this.loadMeasures();
          }
          this.isLoading = false;
        },
        (error: any) => {
          const dialogRef = this.httpUtils.errorDialog(error);
          dialogRef.afterClosed().subscribe((_value: any) => {
            this.router.navigate([this.backRoute]);
          });
        }
      );
    });
  }

  createMeasuresForm() {
    let patterns = this.httpUtils.getPatterns();
    let color1_rgb = this.params.color1 ? this.httpUtils.hexToRgb(this.params.color1.toLowerCase().replace('%23', '#')) : undefined;
    let color2_rgb = this.params.color2 ? this.httpUtils.hexToRgb(this.params.color2.toLowerCase().replace('%23', '#')) : undefined;
    let color3_rgb = this.params.color3 ? this.httpUtils.hexToRgb(this.params.color3.toLowerCase().replace('%23', '#')) : undefined;
    this.group['startTime'] = new FormControl(this.params.startTime ? new Date(this.params.startTime) : new Date(moment().add(-1, 'hour').toISOString()), [ Validators.required ]);
    this.group['endTime'] = new FormControl(this.params.endTime ? new Date(this.params.endTime) : new Date(moment().toISOString()), [ Validators.required ]);
    this.group['timeAggregation'] = new FormControl(this.params.timeAggregation ? this.params.timeAggregation : 'NONE', [ Validators.required ]);
    this.group['chartType'] = new FormControl(this.params.chartType ? this.params.chartType : 'spline', [ Validators.required ]);
    this.group['showMarkers'] = new FormControl(this.params.showMarkers ? this.params.showMarkers : false, []);
    this.group['chartAggregation'] = new FormControl(this.params.chartAggregation ? this.params.chartAggregation : 'average', [ Validators.required ]);
    this.group['color1'] = new FormControl(color1_rgb ? new Color(color1_rgb.r, color1_rgb.g, color1_rgb.b) : undefined, []);
    this.group['color2'] = new FormControl(color2_rgb ? new Color(color2_rgb.r, color2_rgb.g, color2_rgb.b) : undefined, []);
    this.group['color3'] = new FormControl(color3_rgb ? new Color(color3_rgb.r, color3_rgb.g, color3_rgb.b) : undefined, []);
    this.group['formulaName'] = new FormControl('', []);
    this.group['organization'] = new FormControl('', []);
    this.group['client'] = new FormControl('', []);
    this.group['warningValue'] = new FormControl(this.params.warningValue ? this.params.warningValue : '', [ Validators.pattern(patterns.positiveNegativeFloat) ]);
    this.group['alarmValue'] = new FormControl(this.params.alarmValue ? this.params.alarmValue : '', [ Validators.pattern(patterns.positiveNegativeFloat) ]);
    this.measuresForm = new FormGroup(this.group);
    this.measuresForm.get('timeAggregation').valueChanges.subscribe((_t: string) => {
      this.setChartTypesVisible();
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

  createDrainControls(i: number, aggregation: string, operation: string, legend: String): void {
    this.group['aggregation_' + i] = new FormControl(aggregation ? aggregation : 'AVG', [ Validators.required ]);
    this.measuresForm.get('aggregation_' + i).valueChanges.subscribe((a: string) => {
      this.drains[i].aggregation = a;
    });
    this.group['operation_' + i] = new FormControl(operation ? operation : 'SEMICOLON', [ Validators.required ]);
    this.measuresForm.get('operation_' + i).valueChanges.subscribe((o: string) => {
      this.drains[i].operation = o;
      if (o === 'SEMICOLON') {
        if (this.drains.length > (i + 1)) {
          let k = 0;
          for (let drain of this.drains) {
            if (k > i) {
              if (drain.visible) {
                this.measuresForm.get('legend_' + k).setValue(drain.full_name);
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
    this.measuresForm.get('legend_' + i).valueChanges.subscribe((n: string) => {
      if (this.measuresForm.get('operation_' + i).value === 'SEMICOLON')
        this.drains[i].legend = n;
    });
  }

  compareObjects(o1: any, o2: any): boolean {
    return (o2 != null) && (o1.id === o2.id);
  }

  setLastHour(): void {
    this.measuresForm.patchValue({ startTime: new Date(moment().add(-1, 'hour').toISOString()), endTime: new Date(moment().toISOString()) });
  }

  setLastDay(): void {
    this.measuresForm.patchValue({ startTime: new Date(moment().add(-1, 'day').toISOString()), endTime: new Date(moment().toISOString()) });
  }

  setLastWeek(): void {
    this.measuresForm.patchValue({ startTime: new Date(moment().add(-7, 'day').toISOString()), endTime: new Date(moment().toISOString()) });
  }

  setLastMonth(): void {
    this.measuresForm.patchValue({ startTime: new Date(moment().add(-1, 'month').toISOString()), endTime: new Date(moment().toISOString()) });
  }

  setChartTypesVisible(): void {
    let visible = false;
    if (this.measuresForm.get('timeAggregation').value) {
      let timeAggr = this.timeAggregations.find(agg => agg.id === this.measuresForm.get('timeAggregation').value);
      if (timeAggr) {
        if ((timeAggr.order > 2) && (timeAggr.order < 6)) {
          let visibleDrains: any[] = this.drains.filter(d => d.visible);
          visible = ((this.indices.length == 0) && ((visibleDrains.length <= 1) || (visibleDrains.filter(d => d.operation === 'SEMICOLON').length <= 1)) || ((this.indices.length == 1) && (visibleDrains.length === 0)));
        }
      }
      this.chartTypes.find(c => c.id === 'pie').visible = (this.measuresForm.get('timeAggregation').value === 'ALL');
    }
    this.chartTypes.find(c => c.id === 'heatmap').visible = visible;
    this.visibleChartTypes = this.chartTypes.filter(t => t.visible);
    if (((this.measuresForm.get('chartType').value === 'heatmap') && !visible) || ((this.measuresForm.get('chartType').value === 'pie') && (this.measuresForm.get('timeAggregation').value !== 'ALL')))
      this.measuresForm.patchValue({ chartType: 'spline' });
  }

  addIndices(): void {
    const dialogRef = this.dialog.open(IndicesTreeDialogComponent, { width: '75%', data: { orgs: this.allOrgs, indices: this.allIndices } });
    dialogRef.afterClosed().subscribe((result: any[]) => {
      if (result) {
        let component = this;
        result.forEach(function (index: Index) {
          if (!component.indices.find((i: Index) => i.id === index.id))
            component.indices.push(index);
          component.setChartTypesVisible();
        });
      }
    });
  }

  removeIndex(index: Index): void {
    this.indices = this.indices.filter((i: Index) => i.id !== index.id);
  }

  addDrains(): void {
    const dialogRef = this.dialog.open(DrainsTreeDialogComponent, { width: '75%', data: { orgs: this.allOrgs, clients: this.energyClients, feeds: this.allFeeds, drains: this.allDrains.filter(d => ((d.measure_type !== 'C') && (d.measure_type !== 's'))) } });
    dialogRef.afterClosed().subscribe((result: any[]) => {
      if (result) {
        let component = this;
        result.forEach(function (selected: any) {
          let drain = component.allDrains.find((d: Drain) => d.id === selected.id);
          if (drain) {
            component.loadDrain(drain, 'AVG', 'SEMICOLON', undefined);
          }
        });
        component.setChartTypesVisible();
      }
    });
  }

  removeDrain(i: number): void {
    this.drains[i].visible = false;
    this.drains[i].operation = 'SEMICOLON';
    this.measuresForm.get('operation_' + i).setValue('SEMICOLON');
    this.visibleDrains = this.drains.find(drain => (drain.visible === true)) ? true : false;
    if (!this.visibleDrains) {
      this.formulaId = undefined;
      this.measuresForm.patchValue({ organization: undefined, formulaName: undefined });
    }
    this.setChartTypesVisible();
  }

  loadDrain(drain: Drain, aggregation: string, operation: string, legend: String) {
    let feed = this.allFeeds.find(f => f.id === drain.feed_id);
    if (feed) {
      let client = this.energyClients.find(c => (feed.client_ids.indexOf(c.id) > -1));
      if (client) {
        let org = this.allOrgs.find(o => o.id === client.org_id);
        if (org) {
          if (!legend)
            legend = client.name + ' - ' + drain.name;
          this.createDrainControls(this.drains.length, aggregation, operation, legend);
          this.drains.push({ id: drain.id, visible: true, measure_type: drain.measure_type, full_name: ((this.allOrgs.length > 1) ? org.name + ' - ' : '') + client.name + ' - ' + feed.description + ' - ' + drain.name + (drain.measure_unit ? ' (' + drain.measure_unit + ')' : ''), aggregations: this.httpUtils.getMeasuresAggregationsForMeasureType(drain.measure_type), aggregation: aggregation, operations: this.httpUtils.getMeasuresOperationsForMeasureType(drain.measure_type), operation: operation, legend: legend, show_legend: false });
          this.visibleDrains = true;
        }
      }
    }
  }

  showLegend(i: number): void {
    this.drains[i].show_legend = !this.drains[i].show_legend;
  }

  loadFormula(formula: Formula): void {
    if (formula.components) {
      let i = 0;
      let component = this;
      formula.components.forEach(function (drain_id: number) {
        let drain = component.allDrains.find(d => d.id === drain_id);
        if (drain)
          component.loadDrain(drain, formula.aggregations[i], formula.operators[i], formula.legends[i]);
        i++;
      });
    }
  }

  setFormulaData(formula: Formula): void {
    if (formula) {
      this.formulaId = formula.id;
      if (formula.org_id) {
        this.updateFormulaClient(formula.org_id);
        this.measuresForm.patchValue({ organization: formula.org_id, client: formula.client_id, formulaName: formula.name });
      }
    }
  }

  addFormulas(): void {
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
          component.loadFormula(formula);
        });
        if ((result.length === 1) && !this.formulaId) {
          this.setFormulaData(result[0]);
        } else {
          this.formulaId = undefined;
          this.measuresForm.patchValue({ organization: undefined, client: undefined, formulaName: undefined });
        }
        this.setChartTypesVisible();
      }
    });
  }

  updateFormulaClient(orgId: number) {
    let formulaOrgs: Organization[] = [this.allOrgs.find(o => o.id === orgId)];
    formulaOrgs = this.httpUtils.getChildrenOrganizations(this.allOrgs, this.allOrgs.find(o => o.id === orgId), formulaOrgs);
    this.formulaClients = this.energyClients.filter(c => formulaOrgs.includes(this.allOrgs.find(o => o.id === c.org_id)));
    this.formulaClients.sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0);
  }

  saveLoad(): any {
    let drainIds = [];
    let aggregations = [];
    let operations = [];
    let lastSemicolonControl: boolean = false;
    let legends = [];
    this.seriesNames = [];
    this.drains.forEach(drain => {
      if (drain.visible) {
        drainIds.push(drain.id);
        aggregations.push(drain.aggregation);
        operations.push(drain.operation);
        lastSemicolonControl = (drain.operation === 'SEMICOLON');
        legends.push((drain.operation === 'SEMICOLON') ? drain.legend : undefined);
        if (drain.operation === 'SEMICOLON')
          this.seriesNames.push(drain.legend);
      }
    });
    return { drainIds: drainIds, aggregations: aggregations, operations: operations, lastSemicolon: lastSemicolonControl, legends: legends };
  }

  loadMeasures(): void {
    this.isLoadingMeasures = true;
    this.measuresLoaded = false;
    let dataDrain: any = this.saveLoad();
    if ((dataDrain.drainIds.length > 0) || (this.indices.length > 0)) {
      if ((dataDrain.drainIds.length > 0) && !dataDrain.lastSemicolon) {
        this.httpUtils.errorDialog({ status: 499, error: { errorCode: 8499 } });
        this.isLoadingMeasures = false;
        return;
      }
      let requests: any[] = [];
      let indexRequests: any[] = [];
      this.indices.forEach((_index: Index) => {
        indexRequests.push([]);
      });
      let start_time = new Date(moment(this.measuresForm.get('startTime').value).toISOString());
      let end_time = new Date(moment(this.measuresForm.get('endTime').value).toISOString());
      if (end_time < start_time) {
        this.httpUtils.errorDialog({ status: 496, error: { errorCode: 8496 } });
        this.isLoadingMeasures = false;
        return;
      }
      let years: number = 0;
      if ((start_time.getFullYear() === end_time.getFullYear()) || (this.measuresForm.get('timeAggregation').value === 'ALL')) {
        if (dataDrain.drainIds.length > 0)
          requests.push(this.measuresService.getMeasures(dataDrain.drainIds.toString(), dataDrain.aggregations.toString(), dataDrain.operations.toString(), this.httpUtils.getDateTimeForUrl(start_time, true), this.httpUtils.getDateTimeForUrl(end_time, true), this.measuresForm.get('timeAggregation').value));
        let i = 0;
        this.indices.forEach((index: Index) => {
          indexRequests[i].push(this.indicesService.calculateIndex(index.id, this.httpUtils.getDateTimeForUrl(start_time, true), this.httpUtils.getDateTimeForUrl(end_time, true), this.measuresForm.get('timeAggregation').value));
          i++;
        });
        years++;
      } else {
         let start = moment(start_time);
         let end = moment(end_time);
         while (moment(start_time) < end) {
           start = (start_time.getFullYear() === new Date(end.toISOString()).getFullYear()) ? moment(start_time) : moment(end).startOf('year');
           if (dataDrain.drainIds.length > 0)
             requests.push(this.measuresService.getMeasures(dataDrain.drainIds.toString(), dataDrain.aggregations.toString(), dataDrain.operations.toString(), this.httpUtils.getDateTimeForUrl(new Date(start.toISOString()), true), this.httpUtils.getDateTimeForUrl(new Date(end.toISOString()), true), this.measuresForm.get('timeAggregation').value));
           let i = 0;
           this.indices.forEach((index: Index) => {
             indexRequests[i].push(this.indicesService.calculateIndex(index.id, this.httpUtils.getDateTimeForUrl(new Date(start.toISOString()), true), this.httpUtils.getDateTimeForUrl(new Date(end.toISOString()), true), this.measuresForm.get('timeAggregation').value));
             i++;
           });
           end = moment(start).add(-1, 'second');
           years++;
         }
      }
      let drainRequests = requests.length;
      indexRequests.forEach((irs: any[]) => {
        irs.forEach((request: any) => {
          requests.push(request);
        });
      });
      let totalRequests = requests.length;
      forkJoin(requests).subscribe(
        (results: any) => {
          this.measures = results[drainRequests - 1];
          for (let i = drainRequests - 2; i >= 0; i--) {
            for (let j = 0; j < this.measures.length; j++) {
              if (this.measures[j])
                this.measures[j].measures = this.measures[j].measures.concat(results[i][j].measures);
              else
                this.measures[j].measures = results[i][j].measures;
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
          this.drawChart();
        },
        (error: any) => {
          this.httpUtils.errorDialog(error);
          this.isLoadingMeasures = false;
        }
      );
    }
  }

  createFormula(): void {
    this.saveFormula(true);
  }

  updateFormula(): void {
    this.saveFormula(false);
  }

  saveFormula(create: boolean): void {
    this.isSaving = true;
    let newFormula: Formula = new Formula();
    let dataDrain: any = this.saveLoad();
    if (!dataDrain.lastSemicolon) {
      this.httpUtils.errorDialog({ status: 499, error: { errorCode: 8499 } });
      return;
    }
    newFormula.name = this.measuresForm.get('formulaName').value;
    newFormula.org_id = this.measuresForm.get('organization').value;
    newFormula.client_id = this.measuresForm.get('client').value;
    newFormula.components = dataDrain.drainIds;
    newFormula.aggregations = dataDrain.aggregations;
    newFormula.operators = dataDrain.operations;
    newFormula.legends = dataDrain.legends;
    newFormula.operators.pop();
    if (create) {
      this.formulasService.createFormula(newFormula).subscribe(
        (_response: Formula) => {
          this.isSaving = false;
          this.httpUtils.successSnackbar(this.translate.instant('FORMULASTREE.FORMULASAVED'));
          window.location.reload();
        },
        (error: any) => {
          this.isSaving = false;
          this.httpUtils.errorDialog(error);
        }
      );
    } else {
      newFormula.id = this.formulaId;
      this.formulasService.updateFormula(newFormula).subscribe(
        (_response: Formula) => {
          this.isSaving = false;
          this.httpUtils.successSnackbar(this.translate.instant('FORMULASTREE.FORMULAUPDATE'));
          window.location.reload();
        }
      );
    }
  }

  drawChart(): void {
    this.chart = undefined;
    this.chartLabels = [];
    this.chartSeries = [];
    let unitArray = [];
    if (this.indexResults && (this.indexResults.length > 0)) {
      this.indexResults.forEach((index: Index) => {
        if (!index.decimals && (index.decimals !== 0))
          index.decimals = 2;
        if (index.result) {
          let indexName = index.name + (index.measure_unit ? ' (' + index.measure_unit + ')' : '');
          if (this.measuresForm.get('chartType').value === 'pie') {
            index.result.forEach((measure: any) => {
              if (!Number.isNaN(parseFloat(measure.value)))
                this.chartSeries.push(this.pieChart.createSerie(parseFloat(measure.value), indexName, index.decimals));
            });
          } else {
            let yAxisIndex: number;
            if ((unitArray.length > 0) && (unitArray.includes(index.measure_unit))) {
              yAxisIndex = unitArray.indexOf(index.measure_unit);
            } else {
              unitArray.push(index.measure_unit);
              yAxisIndex = unitArray.length - 1;
              this.chartLabels[yAxisIndex] = this.timeChart.createYAxis(index.measure_unit, unitArray.length, this.measuresForm.get('alarmValue').value, this.measuresForm.get('warningValue').value, undefined, undefined, this.isHeatmapChart, 'f', this.measuresForm.get('timeAggregation').value);
            }
            let data_array: any[] = [];
            let component = this;
            index.result.forEach((measure: any) => {
              if (!Number.isNaN(parseFloat(measure.value)))
                  data_array.push(component.timeChart.createData(new Date(measure.at), measure.value.toString(), index.decimals, this.isHeatmapChart, this.measuresForm.get('timeAggregation').value));
            });
            if (data_array.length > 0)
              this.chartSeries.push(this.timeChart.createSerie(data_array, indexName, yAxisIndex, index.decimals, this.isHeatmapChart, 'f', this.measuresForm.get('timeAggregation').value));
          }
        }
      });
    }
    if (this.measures) {
      let i = 0;
      this.measures.forEach((m: Measures) => {
        let drainColumnName = (((this.seriesNames.length > i) && this.seriesNames[i]) ? this.seriesNames[i] : m.drain_name) + ((m.unit && (m.unit !== '?')) ? ' (' + m.unit + ')' : '');
        if (!m.decimals && (m.decimals !== 0))
          m.decimals = 2;
        if (m.measures) {
          if (this.measuresForm.get('chartType').value === 'pie') {
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
              this.chartLabels[yAxisIndex] = this.timeChart.createYAxis(m.unit, unitArray.length, this.measuresForm.get('alarmValue').value, this.measuresForm.get('warningValue').value, undefined, undefined, this.isHeatmapChart, m.measure_type, this.measuresForm.get('timeAggregation').value);
            }
            let data_array: any[] = [];
            let component = this;
            m.measures.forEach((measure: Measure) => {
              if ((measure.value !== null) && (measure.value !== undefined) && !Number.isNaN(parseFloat(measure.value.toString())))
                data_array.push(component.timeChart.createData(new Date(measure.time), measure.value.toString(), (m.measure_type === 'c') ? 0 : m.decimals, this.isHeatmapChart, this.measuresForm.get('timeAggregation').value));
            });
            if (data_array.length > 0)
              this.chartSeries.push(this.timeChart.createSerie(data_array, drainColumnName, yAxisIndex, m.decimals, this.isHeatmapChart, m.measure_type, this.measuresForm.get('timeAggregation').value));
          }
        }
        i++;
      });
    }
    if (this.chartSeries.length > 0) {
      let options = {};
      options['type'] = this.measuresForm.get('chartType').value;
      options['height'] = Math.max(400, window.screen.height * 0.7);
      options['series'] = this.chartSeries;
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
          options['plot_options'] = { series: { marker: { enabled: this.measuresForm.get('showMarkers').value }, dataGrouping: { enabled: (this.measuresForm.get('chartAggregation').value === 'None') ? false : true, approximation: (this.measuresForm.get('chartAggregation').value === 'None') ? null : this.measuresForm.get('chartAggregation').value } } }
        }
        this.chart = this.timeChart.createTimeChart(options);
      }
    }
  }

  exportCsv(): void {
    const link = document.createElement("a");
    link.href = this.httpUtils.createCsvContent(this.measures, this.seriesNames, this.indexResults);
    link.download = 'drain_data.csv';
    link.click();
  }

  shareLink(): void {
    let dataDrain: any = this.saveLoad();
    this.clipboard.copy(this.httpUtils.createLinkToShare(null, dataDrain, this.indices, this.measuresForm));
    this.httpUtils.successSnackbar(this.translate.instant('MEASURES.LINKCOPIED'));
  }

  goBack(): void {
    this.location.back();
  }
}
