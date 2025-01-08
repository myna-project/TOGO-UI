import { Location } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Color } from '@angular-material-components/color-picker';
import { TranslateService } from '@ngx-translate/core';
import { forkJoin } from 'rxjs';

import { Client } from '../_models/client';
import { DashboardWidget } from '../_models/dashboardwidget';
import { DashboardWidgetDetail } from '../_models/dashboardwidgetdetail';
import { Drain } from '../_models/drain';
import { DrainControl } from '../_models/draincontrol';
import { Feed } from '../_models/feed';
import { Formula } from '../_models/formula';
import { Index } from '../_models/index';
import { Organization } from '../_models/organization';

import { ClientsService } from '../_services/clients.service';
import { DashboardWidgetsService } from '../_services/dashboardwidgets.service';
import { DrainControlsService } from '../_services/draincontrols.service';
import { DrainsService } from '../_services/drains.service';
import { FeedsService } from '../_services/feeds.service';
import { FormulasService } from '../_services/formulas.service';
import { IndicesService } from '../_services/indices.service';
import { OrganizationsService } from '../_services/organizations.service';

import { DrainControlsTreeDialogComponent } from '../_utils/draincontrols-tree-dialog/draincontrols-tree-dialog.component';
import { DrainsTreeDialogComponent } from '../_utils/drains-tree-dialog/drains-tree-dialog.component';
import { FormulasTreeDialogComponent } from '../_utils/formulas-tree-dialog/formulas-tree-dialog.component';
import { HttpUtils } from '../_utils/http.utils';
import { IndicesTreeDialogComponent } from '../_utils/indices-tree-dialog/indices-tree-dialog.component';
import { OrganizationsTree } from '../_utils/tree/organizations-tree';

import { MatDialog } from '@angular/material/dialog';

@Component({
  templateUrl: './dashboardwidget.component.html',
  styleUrls: ['./dashboardwidget.component.scss'],
  providers: [OrganizationsTree]
})
export class DashboardWidgetComponent implements OnInit {

  isLoading: boolean = true;
  isSaving: boolean = false;
  isDeleting: boolean = false;
  costsWidget: boolean = false;
  allOrgs: Organization[] = [];
  energyClients: Client[] = [];
  allFeeds: Feed[] = [];
  allDrains: Drain[] = [];
  allFormulas: Formula[] = [];
  allIndices: Index[] = [];
  allControls: DrainControl[] = [];
  costsOrgs: Organization[] = [];
  costsClients: Client[] = [];
  costsFeeds: Feed[] = [];
  costsDrains: Drain[] = [];
  costsDrain: any;
  unitOrgs: Organization[] = [];
  unitClients: Client[] = [];
  unitFeeds: Feed[] = [];
  unitDrains: Drain[] = [];
  unitFormulas: Formula[] = [];
  widgetTypes: any[] = [];
  costsWidgetTypes: any[] = [];
  timeAggregations: any[] = [];
  costsTimeAggregations: any[] = [];
  pieTimeAggregations: any[] = [];
  heatmapTimeAggregations: any[] = [];
  periods: any[] = [];
  legendPositions: any[] = [];
  legendLayouts: any[] = [];
  measuresAggregations: any[] = [];
  relativeTime: boolean = true;
  period_missing: boolean = false;
  number_period_missing: boolean = false;
  start_time_missing: boolean = false;
  visibleDetails: boolean = false;
  lastSemicolon: boolean = true;
  widget: DashboardWidget = new DashboardWidget();
  dashboardId: number;
  widgetForm: FormGroup;
  group: any = {};
  backRoute: string = 'dashboard';

  constructor(private dashboardWidgetsService: DashboardWidgetsService, private orgsService: OrganizationsService, private clientsService: ClientsService, private feedsService: FeedsService, private drainsService: DrainsService, private formulasService: FormulasService, private indicesService: IndicesService, private drainControlsService: DrainControlsService, private organizationsTree: OrganizationsTree, private route: ActivatedRoute, private router: Router, private location: Location, private dialog: MatDialog, private httpUtils: HttpUtils, private translate: TranslateService) {}

  ngOnInit(): void {
    this.measuresAggregations = this.httpUtils.getMeasuresAggregationsForMeasureType('f');
    this.translate.get('CHART.SPLINE').subscribe((spline: string) => {
      this.widgetTypes.push({ id: 'SPLINE', description: spline });
      this.costsWidgetTypes.push({ id: 'SPLINE', description: spline });
      this.translate.get('CHART.HISTOGRAM').subscribe((histogram: string) => {
        this.widgetTypes.push({ id: 'HISTOGRAM', description: histogram });
        this.costsWidgetTypes.push({ id: 'HISTOGRAM', description: histogram });
        this.translate.get('CHART.PIE').subscribe((pie: string) => {
          this.widgetTypes.push({ id: 'PIE', description: pie });
          this.costsWidgetTypes.push({ id: 'PIE', description: pie });
          this.translate.get('CHART.HEATMAP').subscribe((heatmap: string) => {
            this.widgetTypes.push({ id: 'HEATMAP', description: heatmap });
            this.costsWidgetTypes.push({ id: 'HEATMAP', description: heatmap });
            this.translate.get('CHART.GAUGE').subscribe((gauge: string) => {
              this.widgetTypes.push({ id: 'GAUGE', description: gauge });
              this.costsWidgetTypes.push({ id: 'GAUGE', description: gauge });
              this.translate.get('CHART.STACKED').subscribe((stacked: string) => {
                this.widgetTypes.push({ id: 'STACKED', description: stacked });
                this.costsWidgetTypes.push({ id: 'STACKED', description: stacked });
                this.widgetTypes.push({ id: 'ALERT', description: 'Alert' });
              });
            });
          });
        });
      });
    });
    this.translate.get('TIME.NONE').subscribe((none: string) => {
      this.timeAggregations.push({ id: 'NONE', description: none });
      this.translate.get('TIME.MINUTE').subscribe((minute: string) => {
        this.timeAggregations.push({ id: 'MINUTE', description: minute });
        this.periods.push({ id: 'minutes', description: minute });
        this.translate.get('TIME.QHOUR').subscribe((qhour: string) => {
          this.timeAggregations.push({ id: 'QHOUR', description: qhour });
          this.costsTimeAggregations.push({ id: 'QHOUR', description: qhour });
          this.translate.get('TIME.HOUR').subscribe((hour: string) => {
            this.timeAggregations.push({ id: 'HOUR', description: hour });
            this.costsTimeAggregations.push({ id: 'HOUR', description: hour });
            this.heatmapTimeAggregations.push({ id: 'HOUR', description: hour });
            this.periods.push({ id: 'hours', description: hour });
            this.translate.get('TIME.DAY').subscribe((day: string) => {
              this.timeAggregations.push({ id: 'DAY', description: day });
              this.costsTimeAggregations.push({ id: 'DAY', description: day });
              this.heatmapTimeAggregations.push({ id: 'DAY', description: day });
              this.periods.push({ id: 'days', description: day });
              this.translate.get('TIME.MONTH').subscribe((month: string) => {
                this.timeAggregations.push({ id: 'MONTH', description: month });
                this.costsTimeAggregations.push({ id: 'MONTH', description: month });
                this.heatmapTimeAggregations.push({ id: 'MONTH', description: month });
                this.periods.push({ id: 'months', description: month });
                this.translate.get('TIME.YEAR').subscribe((year: string) => {
                  this.timeAggregations.push({ id: 'YEAR', description: year });
                  this.costsTimeAggregations.push({ id: 'YEAR', description: year });
                  this.periods.push({ id: 'years', description: year });
                  this.translate.get('TIME.ALL').subscribe((all: string) => {
                    this.timeAggregations.push({ id: 'ALL', description: all });
                    this.costsTimeAggregations.push({ id: 'ALL', description: all });
                    this.pieTimeAggregations.push({ id: 'ALL', description: all });
                  });
                });
              });
            });
          });
        });
      });
    });
    this.translate.get('LEGEND.TOPLEFT').subscribe((topleft: string) => {
      this.legendPositions.push({ id: 'top-left', description: topleft });
      this.translate.get('LEGEND.TOPCENTER').subscribe((topcenter: string) => {
        this.legendPositions.push({ id: 'top-center', description: topcenter });
        this.translate.get('LEGEND.TOPRIGHT').subscribe((topright: string) => {
          this.legendPositions.push({ id: 'top-right', description: topright });
          this.translate.get('LEGEND.MIDDLELEFT').subscribe((middleright: string) => {
            this.legendPositions.push({ id: 'middle-right', description: middleright });
            this.translate.get('LEGEND.MIDDLERIGHT').subscribe((middleright: string) => {
              this.legendPositions.push({ id: 'middle-right', description: middleright });
              this.translate.get('LEGEND.BOTTOMLEFT').subscribe((bottomleft: string) => {
                this.legendPositions.push({ id: 'bottom-left', description: bottomleft });
                this.translate.get('LEGEND.BOTTOMCENTER').subscribe((bottomcenter: string) => {
                  this.legendPositions.push({ id: 'bottom-center', description: bottomcenter });
                  this.translate.get('LEGEND.BOTTOMRIGHT').subscribe((bottomright: string) => {
                    this.legendPositions.push({ id: 'bottom-right', description: bottomright });
                  });
                });
              });
            });
          });
        });
      });
    });
    this.translate.get('LEGEND.HORIZONTAL').subscribe((horizontal: string) => {
      this.legendLayouts.push({ id: 'h', description: horizontal });
      this.translate.get('LEGEND.VERTICAL').subscribe((vertical: string) => {
        this.legendLayouts.push({ id: 'v', description: vertical });
      });
    });
    this.createForm();
    this.route.paramMap.subscribe((params: any) => {
      forkJoin([this.orgsService.getOrganizations(), this.clientsService.getClients(), this.feedsService.getFeeds(), this.drainsService.getDrains(), this.formulasService.getFormulas(), this.indicesService.getIndices(), this.drainControlsService.getDrainControls()]).subscribe({
        next: (results: any) => {
          this.allOrgs = results[0];
          this.energyClients = results[1].filter((c: Client) => c.energy_client);
          this.allFeeds = results[2];
          this.allDrains = results[3];
          this.allFormulas = results[4];
          this.allIndices = results[5];
          this.allControls = results[6];
          this.costsDrains = this.allDrains.filter(d => (d.measure_unit && d.measure_unit.includes('€/')));
          let data = { orgs: [], clients: [], feeds: [], drains: [] };
          this.addDrainsForTree(data, this.costsDrains);
          this.costsOrgs = data.orgs;
          this.costsClients = data.clients;
          this.costsFeeds = data.feeds;
          var widgetId = +params.get('id');
          this.dashboardId = +params.get('dashboardId');
          if (widgetId) {
            this.dashboardWidgetsService.getDashboardWidget(widgetId, this.dashboardId).subscribe({
              next: (widget: DashboardWidget) => {
                this.widget = widget;
                if (this.widget.costs_drain_id != undefined) {
                  this.costsWidget = true;
                  this.setCostDrain(this.widget.costs_drain_id);
                }
                this.relativeTime = (this.widget.start_time === undefined);
                this.createForm();
                if (widget.details) {
                  widget.drain_details = widget.details.filter(d => (d.drain_id !== undefined || d.formula_id !== undefined));
                  widget.details = widget.details.filter(d => (d.drain_id === undefined && d.formula_id === undefined) );
                  let i: number = 0;
                  widget.details.forEach(detail => {
                    if (detail.index_id) {
                      let index = this.allIndices.find(i => i.id === detail.index_id);
                      if (index)
                        this.createDetailControl(detail, undefined, index, undefined, undefined);
                    } else if (detail.drain_control_id) {
                      let control = this.allControls.find(c => c.id === detail.drain_control_id);
                      if (control)
                        this.createDetailControl(detail, undefined, undefined, control, undefined);
                    }
                    i++;
                  });
                  if (i > 0)
                    this.visibleDetails = true;
                } else {
                  widget.details = [];
                }
                if (widget.drain_details) {
                  let i: number = 0;
                  widget.drain_details.forEach(detail => {
                  if (detail.formula_id) {
                      let formula = this.allFormulas.find(f => f.id === detail.formula_id);
                      if (formula)
                        this.createDetailControl(detail, formula, undefined, undefined, i);
                    } else if (detail.drain_id) {
                      let drain = this.allDrains.find(d => d.id === detail.drain_id);
                      if(drain)
                        this.createDrainDetailControl(detail, drain.id, i);
                    }
                    i++;
                  });
                  if (i > 0)
                    this.visibleDetails = true;
                } else {
                  widget.drain_details = [];
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
          } else {
            this.widget.x_pos = 0;
            this.widget.y_pos = 0;
            this.widget.n_cols = 1;
            this.widget.n_rows = 1;
            this.isLoading = false;
          }
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

  get widget_type() { return this.widgetForm.get('widget_type'); }
  get title() { return this.widgetForm.get('title'); }
  get interval_seconds() { return this.widgetForm.get('interval_seconds'); }
  get background_color() { return this.widgetForm.get('background_color'); }
  get color1() { return this.widgetForm.get('color1'); }
  get color2() { return this.widgetForm.get('color2'); }
  get color3() { return this.widgetForm.get('color3'); }
  get number_periods() { return this.widgetForm.get('number_periods'); }
  get period() { return this.widgetForm.get('period'); }
  get start_time() { return this.widgetForm.get('start_time'); }
  get end_time() { return this.widgetForm.get('end_time'); }
  get legend() { return this.widgetForm.get('legend'); }
  get legend_position() { return this.widgetForm.get('legend_position'); }
  get legend_layout() { return this.widgetForm.get('legend_layout'); }
  get navigator() { return this.widgetForm.get('navigator'); }
  get time_aggregation() { return this.widgetForm.get('time_aggregation'); }
  get costs_aggregation() { return this.widgetForm.get('costs_aggregation'); }
  get min_value() { return this.widgetForm.get('min_value'); }
  get max_value() { return this.widgetForm.get('max_value'); }
  get warning_value() { return this.widgetForm.get('warning_value'); }
  get alarm_value() { return this.widgetForm.get('alarm_value'); }

  createForm() {
    let patterns = this.httpUtils.getPatterns();
    let background_rgb = this.widget.background_color ? this.httpUtils.hexToRgb(this.widget.background_color.toLowerCase()) : undefined;
    let color1_rgb = this.widget.color1 ? this.httpUtils.hexToRgb(this.widget.color1.toLowerCase()) : undefined;
    let color2_rgb = this.widget.color2 ? this.httpUtils.hexToRgb(this.widget.color2.toLowerCase()) : undefined;
    let color3_rgb = this.widget.color3 ? this.httpUtils.hexToRgb(this.widget.color3.toLowerCase()) : undefined;
    this.group['widget_type'] = new FormControl(this.widget.widget_type, [ Validators.required ]);
    this.group['title'] = new FormControl(this.widget.title, []);
    this.group['interval_seconds'] = new FormControl(this.widget.interval_seconds, [ Validators.pattern(patterns.positiveFloat) ]);
    this.group['background_color'] = new FormControl(background_rgb ? new Color(background_rgb.r, background_rgb.g, background_rgb.b) : undefined, []);
    this.group['color1'] = new FormControl(color1_rgb ? new Color(color1_rgb.r, color1_rgb.g, color1_rgb.b) : undefined, []);
    this.group['color2'] = new FormControl(color2_rgb ? new Color(color2_rgb.r, color2_rgb.g, color2_rgb.b) : undefined, []);
    this.group['color3'] = new FormControl(color3_rgb ? new Color(color3_rgb.r, color3_rgb.g, color3_rgb.b) : undefined, []);
    this.group['number_periods'] = new FormControl(this.widget.number_periods, [ Validators.pattern(patterns.positiveInteger) ]);
    this.group['period'] = new FormControl(this.widget.period, []);
    this.group['start_time'] = new FormControl(new Date(this.widget.start_time), []);
    this.group['end_time'] = new FormControl(new Date(this.widget.end_time), []);
    this.group['legend'] = new FormControl(this.widget.legend, []);
    this.group['legend_position'] = new FormControl(this.widget.legend_position, []);
    this.group['legend_layout'] = new FormControl(this.widget.legend_layout, []);
    this.group['navigator'] = new FormControl(this.widget.navigator, []);
    this.group['time_aggregation'] = new FormControl(this.widget.time_aggregation, [ Validators.required ]);
    this.group['costs_aggregation'] = new FormControl(this.widget.costs_aggregation, []);
    this.group['min_value'] = new FormControl(this.widget.min_value, [ Validators.pattern(patterns.positiveNegativeFloat) ]);
    this.group['max_value'] = new FormControl(this.widget.max_value, [ Validators.pattern(patterns.positiveNegativeFloat) ]);
    this.group['warning_value'] = new FormControl(this.widget.warning_value, [ Validators.pattern(patterns.positiveNegativeFloat) ]);
    this.group['alarm_value'] = new FormControl(this.widget.alarm_value, [ Validators.pattern(patterns.positiveNegativeFloat) ]);
    this.widgetForm = new FormGroup(this.group);
    this.widgetForm.get('widget_type').valueChanges.subscribe((type: string) => {
      this.widget.widget_type = type;
      if (this.widget.time_aggregation) {
        if (this.widget.widget_type === 'HEATMAP') {
          if ((this.widget.time_aggregation === 'NONE') || (this.widget.time_aggregation === 'MINUTE') || (this.widget.time_aggregation === 'QHOUR') || (this.widget.time_aggregation === 'ALL')) {
            this.widgetForm.patchValue({ time_aggregation: 'HOUR' });
          }
        } else if ((this.widget.widget_type === 'PIE') || (this.widget.widget_type === 'GAUGE')) {
            this.widgetForm.patchValue({ time_aggregation: 'ALL' });
            if (this.widget.widget_type === 'PIE') {
              let i: number = 0;
              this.widget.details.forEach((detail: any) => {
                if (detail.index_id != undefined)
                  this.removeDetail(i, false);
                i++
              });
              this.widget.drain_details.forEach((detail: any) => {
                if (detail.index_id != undefined)
                  this.removeDetail(i, true);
                i++
              });
            }
        } else {
          if (this.costsWidget) {
            if ((this.widget.time_aggregation === 'NONE') || (this.widget.time_aggregation === 'MINUTE')) {
              this.widgetForm.patchValue({ time_aggregation: 'HOUR' });
            }
          }
        }
      }
      if (type !== 'GAUGE')
        this.widgetForm.patchValue({ background_color: undefined });
      if (type !== 'HEATMAP')
        this.widgetForm.patchValue({ color1: undefined, color2: undefined, color3: undefined });
    });
    this.widgetForm.get('legend').valueChanges.subscribe((legend: boolean) => {
      this.widget.legend = legend;
      if (this.widget.legend) {
        this.widgetForm.patchValue({ legend_position: 'bottom-center', legend_layout: (this.widget.widget_type === 'HEATMAP') ? 'h' : 'v' });
      }
    });
    this.widgetForm.get('number_periods').valueChanges.subscribe((number: number) => {
      this.number_period_missing = (number === undefined || number === null);
    });
    this.widgetForm.get('period').valueChanges.subscribe((period: string) => {
      this.period_missing = (period === undefined || period === null);
    });
    this.widgetForm.get('start_time').valueChanges.subscribe((time: string) => {
      this.start_time_missing = (time === undefined || time === null);
    });
  }

  cleanAndUpdateValidators(control: AbstractControl): void {
    control.clearAsyncValidators();
    control.clearValidators();
    control.updateValueAndValidity();
  }

  compareObjects(o1: any, o2: any): boolean {
    return (o2 != null) && (o1.id === o2.id);
  }

  setCostDrain(d: Drain | number): void {
    let drain: Drain = (typeof d === 'number') ? this.allDrains.find(elem => elem.id === d) : d;
    if (drain) {
      let feed = this.allFeeds.find(f => f.id === drain.feed_id);
      if (feed) {
        let client = this.energyClients.find(c => feed.client_ids.indexOf(c.id) > -1);
        if (client) {
          let org = this.allOrgs.find(o => o.id === client.org_id);
          if (org) {
            this.costsDrain = { id: drain.id, full_name: ((this.allOrgs.length > 1) ? org.name + ' - ' : '') + client.name + ' - ' + feed.description + ' - ' + drain.name + (drain.measure_unit ? ' (' + drain.measure_unit + ')' : '') }
            this.unitDrains = this.allDrains.filter(d => (d.measure_unit && d.measure_unit.toLowerCase().includes('wh') && !d.measure_unit.toLowerCase().includes('€')));
            this.allFormulas.forEach((formula: Formula) => {
              let control = true;
              formula.components.forEach((drain_id: number) => {
                let drain = this.allDrains.filter(d => d.id === drain_id)[0];
                if (drain.measure_unit && !drain.measure_unit.toLowerCase().includes('wh'))
                  control = false;
              });
              if (control)
                this.unitFormulas.push(formula);
            });
            let data = { orgs: [], clients: [], feeds: [], drains: [] };
            this.addDrainsForTree(data, this.unitDrains);
            this.unitOrgs = data.orgs;
            this.unitClients = data.clients;
            this.unitFeeds = data.feeds;
          }
        }
      }
    }
  }

  setCostsWidget(): void {
    if (this.costsDrains.length === 1)
      this.setCostDrain(this.costsDrains[0]);
    this.widgetForm.patchValue({ time_aggregation: ((this.time_aggregation.value != null) && (this.time_aggregation.value != 'NONE') && (this.time_aggregation.value != 'MINUTE')) ? this.time_aggregation.value : 'QHOUR', costs_aggregation: 'SUM' });
    this.cleanAndUpdateValidators(this.costs_aggregation);
    this.hideDetails();
    this.costsWidget = true;
  }

  disableCostsWidget(): void {
    this.costsDrain = null;
    this.widget.costs_drain_id = null;
    this.widget.costs_aggregation = null;
    this.widgetForm.patchValue({ costs_aggregation: undefined });
    this.cleanAndUpdateValidators(this.costs_aggregation);
    this.hideDetails();
    this.costsWidget = false;
  }

  hideDetails(): void {
    if (this.widget.details) {
      this.widget.details.forEach(d => {
        d.visible = false;
      });
    }
    if (this.widget.drain_details) {
      this.widget.drain_details.forEach(d => {
        d.visible = false;
      });
    }
    this.visibleDetails = false;
  }

  changeRelativeTime(relative: boolean): void {
    this.relativeTime = relative;
    this.cleanAndUpdateValidators(this.number_periods);
    this.cleanAndUpdateValidators(this.period);
    this.cleanAndUpdateValidators(this.start_time);
    this.cleanAndUpdateValidators(this.end_time);
    if (relative)
      this.widgetForm.patchValue({ start_time: undefined, end_time: undefined});
    this.period_missing = (relative && !this.period.value);
    this.number_period_missing = (relative && !this.number_periods.value);
    this.start_time_missing = (!relative && ((this.start_time.value === undefined) || (this.start_time.value === null)));
  }

  createDrainDetailControl(detail: DashboardWidgetDetail, drain_id: number, i: number) {
    if (drain_id) {
      let drain = this.allDrains.find(d => d.id === drain_id);
      if (drain) {
        let feed = this.allFeeds.find(f => f.id === drain.feed_id);
        if (feed) {
          let client = this.energyClients.find(c => (c.energy_client && (feed.client_ids.indexOf(c.id) > -1)));
          if (client) {
            let org = this.allOrgs.find(o => o.id === client.org_id);
            if (org) {
              detail.drain_id = drain.id;
              detail.is_exclude_outliers = ((drain.min_value != null) || (drain.max_value != null));
              detail.full_name = ((this.allOrgs.length > 1) ? org.name + ' - ' : '') + client.name + ' - ' + feed.description + ' - ' + drain.name + (drain.measure_unit ? ' (' + drain.measure_unit + ')' : '');
              detail.is_positive_negative_value = drain.positive_negative_value;
              detail.aggregations = this.httpUtils.getMeasuresAggregationsForMeasureType(drain.measure_type);
              detail.operators = this.httpUtils.getMeasuresOperationsForMeasureType(drain.measure_type);
              detail.visible = true;
            }
          }
        }
      }
    }
    detail.divider = (!detail.operator || (detail.operator === 'SEMICOLON'));
    this.group['excludeOutliers_' + i] = new FormControl(detail.id ? detail.exclude_outliers : detail.is_exclude_outliers);
    this.group['positiveNegativeValue_' + i] = new FormControl(detail.positive_negative_value ? detail.positive_negative_value : '');
    this.group['aggregation_' + i] = new FormControl(detail.aggregation, []);
    this.group['operator_' + i] = new FormControl(detail.operator, []);
    this.widgetForm.get('excludeOutliers_' + i).valueChanges.subscribe((ex: boolean) => {
      detail.exclude_outliers = ex;
    });
    this.widgetForm.get('positiveNegativeValue_' + i).valueChanges.subscribe((pn: string) => {
      detail.positive_negative_value = pn;
    });
    this.widgetForm.get('aggregation_' + i).valueChanges.subscribe((aggregation: string) => {
      detail.aggregation = aggregation;
    });
    this.widgetForm.get('operator_' + i).valueChanges.subscribe((operator: string) => {
      detail.operator = operator;
      detail.divider = (!operator || (operator === 'SEMICOLON'));
      this.checkLastSemicolon();
    });
  }

  createDetailControl(detail: DashboardWidgetDetail, formula: Formula, index: Index, control: DrainControl, i: number) {
    if (formula) {
      detail.formula_id = formula.id;
      let org = this.allOrgs.find(o => o.id === formula.org_id);
      if (org) {
        let client = this.energyClients.find(c => (c.id === formula.client_id));
        detail.full_name = (org.name + ' - ' ) + (client ? client.name + ' - ' : '') + formula.name;
        if (formula.components) {
          let type = 'f';
          detail.operators = this.httpUtils.getMeasuresOperationsForMeasureType(type);
          detail.operator = 'SEMICOLON';
          detail.visible = true;
          detail.disabled_sub_formula = formula.operators.filter(o => o === 'SEMICOLON').length > 1;
          detail.is_positive_negative_value = false;
        }
        detail.divider = (!detail.operator || (detail.operator === 'SEMICOLON'));
        this.group['operator_' + i] = new FormControl(detail.operator, []);
        this.group['aggregation_' + i] = new FormControl('AVG', []);
        this.widgetForm.get('aggregation_' + i).valueChanges.subscribe((aggregation: string) => {
          detail.aggregation = aggregation;
        });
        this.widgetForm.get('operator_' + i).valueChanges.subscribe((operator: string) => {
          detail.operator = operator;
          detail.divider = (!operator || (operator === 'SEMICOLON'));
          this.checkLastSemicolon();
        });
      }
    }  if (index) {
      detail.index_id = index.id;
      detail.full_name = ((this.allOrgs.length > 1) ? this.allOrgs.find(o => o.id === index.org_id).name + ' - ' : '') + (index.group ? index.group.name + ' - ' : '') + index.name + (index.measure_unit ? ' (' + index.measure_unit + ')' : '');
      detail.visible = true;
    } else if (control) {
      detail.drain_control_id = control.id;
      detail.full_name = ((this.allOrgs.length > 1) ? this.allOrgs.find(o => o.id === control.org_id).name + ' - ' : '') + control.name;
      detail.visible = true;
    }
    detail.divider = true;
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
    const dialogRef = this.dialog.open(DrainsTreeDialogComponent, { width: '75%', data: { orgs: this.costsWidget ? this.unitOrgs : this.allOrgs, clients: this.costsWidget ? this.unitClients : this.energyClients, feeds: this.costsWidget ? this.unitFeeds : this.allFeeds, filteredFeeds: this.costsWidget ? this.unitFeeds : this.allFeeds, drains: this.costsWidget ? this.unitDrains : this.allDrains.filter(d => ((d.measure_type !== 'C') && (d.measure_type !== 's'))), filteredDrains: this.costsWidget ? this.unitDrains : this.allDrains.filter(d => ((d.measure_type !== 'C') && (d.measure_type !== 's'))), formulas: [], showDetails: this.costsWidget } });
    dialogRef.afterClosed().subscribe((result: any[]) => {
      if (result) {
        let component = this;
        result.forEach(function (drain: any) {
          let detail: DashboardWidgetDetail = new DashboardWidgetDetail();
          if (!component.costsWidget)
            detail.aggregation = 'AVG';
          detail.operator = 'SEMICOLON';
          component.createDrainDetailControl(detail, drain.id, component.widget.drain_details ? component.widget.drain_details.length : 0);
          if (component.widget.drain_details)
            component.widget.drain_details.push(detail);
          else
            component.widget.drain_details = [detail];
          component.visibleDetails = true;
        });
        this.checkLastSemicolon();
      }
    });
  }

  loadFormulas(): void {
    let component = this;
    let data = { orgs: [], clients: [], formulas: [] };
    this.allFormulas.forEach((formula: Formula) => {
      this.organizationsTree.selectFormula(data, this.allOrgs, this.energyClients, this.costsWidget ? this.unitFormulas : this.allFormulas, formula.id);
    });
    const dialogRef = this.dialog.open(FormulasTreeDialogComponent, { width: '75%', data: { orgs: data.orgs, clients: data.clients, formulas: data.formulas } });
    dialogRef.afterClosed().subscribe((result: any[]) => {
      if (result) {
        result.forEach(function (formula: Formula) {
          let detail: DashboardWidgetDetail = new DashboardWidgetDetail();
          component.createDetailControl(detail, formula, undefined, undefined, component.widget.drain_details.length);
          if (component.widget.drain_details)
            component.widget.drain_details.push(detail);
          else
            component.widget.drain_details = [detail];
        });
        component.visibleDetails = true;
      }
    });
  }

  addIndices(): void {
    const dialogRef = this.dialog.open(IndicesTreeDialogComponent, { width: '75%', data: { orgs: this.allOrgs, indices: this.allIndices } });
    dialogRef.afterClosed().subscribe((result: any[]) => {
      if (result) {
        let component = this;
        result.forEach(function (index: Index) {
          let detail: DashboardWidgetDetail = new DashboardWidgetDetail();
          component.createDetailControl(detail, undefined, index, undefined, undefined);
          if (component.widget.details)
            component.widget.details.push(detail);
          else
            component.widget.details = [detail];
          component.visibleDetails = true;
        });
      }
    });
  }

  addControl(): void {
    const dialogRef = this.dialog.open(DrainControlsTreeDialogComponent, { width: '75%', data: { orgs: this.allOrgs, controls: this.allControls } });
    dialogRef.afterClosed().subscribe((control: DrainControl) => {
      if (control) {
        let component = this;
        let detail: DashboardWidgetDetail = new DashboardWidgetDetail();
        component.createDetailControl(detail, undefined, undefined, control, undefined);
        if (component.widget.details)
          component.widget.details.push(detail);
        else
          component.widget.details = [detail];
        component.visibleDetails = true;
      }
    });
  }

  confirmRemoveDetail(i: number, drain: boolean): void {
    const dialogRef = this.httpUtils.confirmDelete(this.translate.instant('DASHBOARDWIDGET.DELETEDETAILCONFIRM'));
    dialogRef.afterClosed().subscribe((dialogResult: any) => {
      if (dialogResult)
        this.removeDetail(i, drain);
    });
  }

  removeDetail(i: number, drain: boolean): void {
    if (drain) {
      this.widget.drain_details[i].visible = false;
      this.checkLastSemicolon();
    } else {
      this.widget.details[i].visible = false;
    }
    this.visibleDetails = (this.widget.details.filter(d => d.visible).length > 0) || (this.widget.drain_details.filter(d => d.visible).length > 0);
  }

  checkLastSemicolon(): void {
    let visibleDrains = this.widget.drain_details.filter(d => d.visible);
    this.lastSemicolon = ((visibleDrains.length === 0) || (visibleDrains.at(visibleDrains.length - 1).operator === 'SEMICOLON'));
  }

  save(): void {
    this.isSaving = true;
    let widgetDetailsRecords = this.widget.details.slice();
    let checkFormula = false;
    if (this.costsWidget && this.costsDrain)
      this.widget.costs_drain_id = this.costsDrain.id;
    this.widget.widget_type = this.widget_type.value;
    this.widget.title = this.title.value;
    this.widget.interval_seconds = this.interval_seconds.value;
    if (this.background_color.value)
      this.widget.background_color = '#' + this.background_color.value.hex;
    if (this.color1.value)
      this.widget.color1 = '#' + this.color1.value.hex;
    if (this.color2.value)
      this.widget.color2 = '#' + this.color2.value.hex;
    if (this.color3.value)
      this.widget.color3 = '#' + this.color3.value.hex;
    this.widget.number_periods = this.number_periods.value;
    this.widget.period = this.period.value;
    this.widget.start_time = this.relativeTime ? undefined : this.start_time.value;
    this.widget.end_time = this.relativeTime ? undefined : this.end_time.value;
    this.widget.legend = this.legend.value;
    this.widget.legend_position = this.legend_position.value;
    this.widget.legend_layout = this.legend_layout.value;
    this.widget.navigator = this.navigator.value;
    this.widget.time_aggregation = this.time_aggregation.value;
    if (this.costsWidget)
      this.widget.costs_aggregation = this.costs_aggregation.value;
    this.widget.min_value = this.min_value.value;
    this.widget.max_value = this.max_value.value;
    this.widget.warning_value = this.warning_value.value;
    this.widget.alarm_value = this.alarm_value.value;
    this.widget.details = this.widget.details.filter(d => d.visible);
    let lastOperator = 'SEMICOLON';
    this.widget.drain_details.forEach((d: DashboardWidgetDetail) => {
      if (d.visible) {
        d.positive_negative_value = d.is_positive_negative_value ? (d.positive_negative_value ? d.positive_negative_value : "") : "";
        this.widget.details.push(d);
        if (d.formula_id) {
          let formula = this.allFormulas.filter(f => f.id === d.formula_id)[0]
          let subFormulas = formula.operators.filter(o => o === 'SEMICOLON').length > 1;
          let legendControl = lastOperator === 'SEMICOLON';
          if (subFormulas === true) {
            if (legendControl === false || d.operator !== 'SEMICOLON')
              checkFormula = true;
          }
        }
        lastOperator = d.operator;
      }
    });
    if (checkFormula) {
      this.httpUtils.errorDialog({ status: 499, error: { errorCode: 8495 } });
      this.widget.details = widgetDetailsRecords;
      this.isSaving = false;
      return;
    }
    if (this.widget.id !== undefined) {
      this.dashboardWidgetsService.updateDashboardWidget(this.widget, this.dashboardId).subscribe({
        next: (_response: DashboardWidget) => {
          this.isSaving = false;
          this.httpUtils.successSnackbar(this.translate.instant('DASHBOARDWIDGET.SAVED'));
          this.router.navigate([this.backRoute + '/' + this.dashboardId]);
        },
        error: (error: any) => {
          this.isSaving = false;
          if (error.status !== 401)
            this.httpUtils.errorDialog(error);
          this.widget.details = this.widget.details.filter(d => (d.drain_id === undefined));
        }
      });
    } else {
      this.dashboardWidgetsService.createDashboardWidget(this.widget, this.dashboardId).subscribe({
        next: (_response: DashboardWidget) => {
          this.isSaving = false;
          this.httpUtils.successSnackbar(this.translate.instant('DASHBOARDWIDGET.SAVED'));
          this.router.navigate([this.backRoute + '/' + this.dashboardId]);
        },
        error: (error: any) => {
          this.isSaving = false;
          if (error.status !== 401)
            this.httpUtils.errorDialog(error);
          this.widget.details = this.widget.details.filter(d => (d.drain_id === undefined));
        }
      });
    }
  }

  goBack(): void {
    this.location.back();
  }
}
