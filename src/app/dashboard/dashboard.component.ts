import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { CompactType, GridsterConfig, GridsterItemComponentInterface, GridType } from 'angular-gridster2';
import { TranslateService } from '@ngx-translate/core';
import { forkJoin } from 'rxjs';

import { unitOfTime } from 'moment';
import * as moment from 'moment';

import { Client } from '../_models/client';
import { DashboardWidget } from '../_models/dashboardwidget';
import { DashboardWidgetDetail } from '../_models/dashboardwidgetdetail';
import { Drain } from '../_models/drain';
import { DrainControl } from '../_models/draincontrol';
import { Feed } from '../_models/feed';
import { Formula } from '../_models/formula';
import { Index } from '../_models/index';
import { Measures } from '../_models/measures';
import { Measure } from '../_models/measure';
import { Organization } from '../_models/organization';
import { User } from '../_models/user';

import { AuthenticationService } from '../_services/authentication.service';
import { ClientsService } from '../_services/clients.service';
import { DashboardWidgetsService } from '../_services/dashboardwidgets.service';
import { DrainControlsService } from '../_services/draincontrols.service';
import { DrainsService } from '../_services/drains.service';
import { FeedsService } from '../_services/feeds.service';
import { FormulasService } from '../_services/formulas.service';
import { IndicesService } from '../_services/indices.service';
import { OrganizationsService } from '../_services/organizations.service';
import { MeasuresService } from '../_services/measures.service';

import { AppComponent } from '../app.component';

import { GaugeChart } from '../_utils/chart/gauge-chart';
import { PieChart } from '../_utils/chart/pie-chart';
import { TimeChart } from '../_utils/chart/time-chart';
import { ChartDialogComponent } from '../_utils/chart-dialog/chart-dialog.component';
import { DrainControlDetailsTreeDialogComponent } from '../_utils/draincontroldetails-tree-dialog/draincontroldetails-tree-dialog.component';
import { HttpUtils } from '../_utils/http.utils';
import { OrganizationsTree } from '../_utils/tree/organizations-tree';

@Component({
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {

  allOrgs: Organization[] = [];
  energyClients: Client[] = [];
  allFeeds: Feed[] = [];
  allDrains: Drain[] = [];
  allFormulas: Formula[] = [];
  options: GridsterConfig;
  dashboard: DashboardWidget[] = [];
  currentUser: User = new User();
  dashboardId: number;
  isLoading: boolean;

  constructor(public myapp: AppComponent, private authService: AuthenticationService, private dashboardWidgetsService: DashboardWidgetsService, private orgsService: OrganizationsService, private clientsService: ClientsService, private feedsService: FeedsService, private drainsService: DrainsService, private formulasService: FormulasService, private measuresService: MeasuresService, private indicesService: IndicesService, private drainControlsService: DrainControlsService, private organizationsTree: OrganizationsTree, private timeChart: TimeChart, private pieChart: PieChart, private gaugeChart: GaugeChart, private dialog: MatDialog, private route: ActivatedRoute, private router: Router, private httpUtils: HttpUtils, private translate: TranslateService) {}

  ngOnInit(): void {
    this.options = {
      gridType: GridType.ScrollVertical,
      compactType: CompactType.CompactUpAndLeft,
      itemResizeCallback: this.itemResize.bind(this),
      swapWhileDragging: true,
      minCols: 8,
      maxCols: 8,
      minRows: 4,
      pushItems: true,
      draggable: { enabled: true, delayStart: 500 },
      resizable: { enabled: true, delayStart: 300 }
    };
    this.route.paramMap.subscribe((params: any) => {
      this.isLoading = true;
      this.myapp.dashboardLoading();
      if (this.dashboard.length > 0)
        this.dashboard = [];
      this.currentUser = this.authService.getCurrentUser();
      if (this.currentUser.default_dashboard_id || params.get('id')) {
        this.dashboardId = params.get('id') ? params.get('id') : this.currentUser.default_dashboard_id;
        forkJoin(this.orgsService.getOrganizations(), this.clientsService.getClients(), this.feedsService.getFeeds(), this.drainsService.getDrains(), this.formulasService.getFormulas(), this.dashboardWidgetsService.getDashboardWidgets(params.get('id') ? +params.get('id') : this.currentUser.default_dashboard_id)).subscribe(
          (results: any) => {
            this.allOrgs = results[0];
            this.energyClients = results[1].filter((c: Client) => c.energy_client);
            this.allFeeds = results[2];
            this.allDrains = results[3];
            this.allFormulas = results[4];
            let widgets: DashboardWidget[] = results[5];
            widgets.sort((a, b) => a.x_pos < b.x_pos ? ((a.y_pos <= b.y_pos) ? -1 : 1) : ((a.y_pos <= b.y_pos) ? -1 : 1));
            widgets.forEach(widget => {
              this.setGridsterItemPosition(widget);
              this.dashboard.push(widget);
              if (widget.widget_type === 'GAUGE') {
                this.loadGauge(widget, false);
                if (widget.interval_seconds) {
                  widget.interval = setInterval(() => {
                    this.loadGauge(widget, true);
                  }, widget.interval_seconds * 1000);
                }
              } else if ((widget.widget_type === 'SPLINE') || (widget.widget_type === 'PIE') || (widget.widget_type === 'HISTOGRAM') || (widget.widget_type === 'HEATMAP')) {
                widget.type = (widget.widget_type === 'SPLINE') ? 'spline' : ((widget.widget_type === 'HISTOGRAM') ? 'column' : ((widget.widget_type === 'PIE') ? 'pie' : 'heatmap'));
                this.loadChart(widget);
                if (widget.interval_seconds) {
                  widget.interval = setInterval(() => {
                    this.loadChart(widget);
                  }, widget.interval_seconds * 1000);
                }
              } else if (widget.widget_type === 'ALERT') {
                this.loadAlertWidget(widget);
                if (widget.interval_seconds) {
                  widget.interval = setInterval(() => {
                    this.loadAlertWidget(widget);
                  }, widget.interval_seconds * 1000);
                }
              }
            });
            this.isLoading = false;
            this.myapp.dashboardLoading();
          },
          (error: any) => {
            this.httpUtils.errorDialog(error);
            this.isLoading = false;
            this.myapp.dashboardLoading();
          }
        );
      } else {
        this.isLoading = false;
        this.myapp.dashboardLoading();
      }
    });
  }

  ngOnDestroy() {
    this.dashboard.forEach(widget => {
      clearInterval(widget.interval);
    });
  }

  itemResize(widget: DashboardWidget, itemComponent: GridsterItemComponentInterface): void {
    widget.height = Number(itemComponent.el.style.height.substr(0, itemComponent.el.style.height.indexOf('px')));
    widget.width = Number(itemComponent.el.style.width.substr(0, itemComponent.el.style.width.indexOf('px')));
    if (widget.widget_type === 'GAUGE')
      widget.gauge = this.gaugeChart.createGaugeChart(widget);
    if ((widget.widget_type === 'SPLINE') || (widget.widget_type === 'HISTOGRAM'))
      widget.chart = this.timeChart.createTimeChart(widget);
  }

  getGridsterItemPosition(widget: DashboardWidget): void {
    widget.n_cols = widget.cols;
    widget.n_rows = widget.rows;
    widget.x_pos = widget.x;
    widget.y_pos = widget.y;
  }

  setGridsterItemPosition(widget: DashboardWidget): void {
    widget.cols = widget.n_cols;
    widget.rows = widget.n_rows;
    widget.x = widget.x_pos;
    widget.y = widget.y_pos;
  }

  settingWidget($event: MouseEvent | TouchEvent, widget: DashboardWidget): void {
    $event.preventDefault();
    $event.stopPropagation();
    this.router.navigate([this.dashboardId + '/dashboardwidget' + ((widget.id && (widget.id !== 0)) ? '/' + widget.id : '')]);
  }

  removeWidget($event: MouseEvent | TouchEvent, widget: DashboardWidget): void {
    $event.preventDefault();
    $event.stopPropagation();
    const dialogRef = this.httpUtils.confirmDelete(this.translate.instant('DASHBOARD.DELETECONFIRM'));
    dialogRef.afterClosed().subscribe((dialogResult: any) => {
      if (dialogResult) {
        this.dashboardWidgetsService.deleteDashboardWidget(widget, this.dashboardId).subscribe(
          (_response: any) => {
            clearInterval(widget.interval);
            this.dashboard.splice(this.dashboard.indexOf(widget), 1);
          },
          (error: any) => {
            this.httpUtils.errorDialog(error);
          }
        )
      }
    });
  }

  addWidget(): void {
    if (this.dashboardId) {
      let widget: DashboardWidget = new DashboardWidget();
      widget.n_cols = 1;
      widget.n_rows = 1;
      widget.x_pos = this.options.api.getFirstPossiblePosition(widget).x;
      widget.y_pos = this.options.api.getFirstPossiblePosition(widget).y;
      this.setGridsterItemPosition(widget);
      widget.widget_type = 'SPLINE';
      widget.number_periods = 1;
      widget.period = 'hours';
      widget.time_aggregation = 'NONE';
      this.dashboardWidgetsService.createDashboardWidget(widget, this.dashboardId).subscribe(
        (response: any) => {
          widget.id = response.id;
          this.dashboard.push(widget);
          this.httpUtils.successSnackbar(this.translate.instant('DASHBOARDWIDGET.SAVED'));
        },
        (error: any) => {
          this.dashboard.splice(this.dashboard.indexOf(widget), 1);
          this.httpUtils.errorDialog(error);
        }
      );
    } else {
      const dialogRef = this.httpUtils.confirmDelete(this.translate.instant('DASHBOARD.CREATEFIRST'));
      dialogRef.afterClosed().subscribe((dialogResult: any) => {
        if (dialogResult) {
          this.router.navigate(["dashboarddetail/"]);
        }
      });
    }
  }

  detailDashboard(): void {
    let path = this.dashboardId  ? this.dashboardId : '';
    this.router.navigate(["dashboarddetail/" + path]);
  }

  setFormula(widget: DashboardWidget, detail: DashboardWidgetDetail): void {
    let formula = this.allFormulas.find(f => f.id === detail.formula_id);
    if (formula) {
      if (formula.components) {
        let i = 0;
        widget.formula_ids += ((widget.formula_ids !== '') ? ',' : '') + formula.id;
        let component = this;
        formula.components.forEach(function (drain_id: number) {
          let drain = component.allDrains.find(d => d.id === drain_id);
          if (drain) {
            detail.aggregation = formula.aggregations[i];
            detail.operator = formula.operators[i];
            component.loadDrainDetail(widget, detail, drain, formula);
          }
          i++;
        });
      }
    }
  }

  loadGauge(widget: DashboardWidget, update: boolean): void {
    if (widget.details) {
      if (((widget.details.filter(d => d.index_id !== undefined).length > 0) && (widget.details.filter(d => d.drain_id !== undefined).length > 0)) || (widget.details.filter(d => d.index_id !== undefined).length > 1)) {
        this.setError(widget, { status: 8497 });
        return;
      }
      widget.drains = '';
      widget.aggregations = '';
      widget.operations = '';
      widget.details.forEach(detail => {
        if (detail.drain_id) {
          if (!update || !widget.gauge)
            widget.is_loading_drain = true;
          this.loadDrainDetail(widget, detail, this.allDrains.find(d => d.id === detail.drain_id), undefined);
        } else if (detail.formula_id) {
          if (!update || !widget.gauge)
            widget.is_loading_drain = true;
          this.setFormula(widget, detail);
        } else if (detail.index_id) {
          if (!update || !widget.gauge)
            widget.is_loading_index = true;
          this.indicesService.calculateIndex(detail.index_id, this.httpUtils.getDateTimeForUrl(new Date(widget.start_time ? widget.start_time : moment().add(widget.number_periods * -1, <unitOfTime.DurationConstructor>widget.period).toISOString()), true), this.httpUtils.getDateTimeForUrl(new Date(moment().toISOString()), true)).subscribe(
            (index: Index) => {
              index.result.forEach(measure => {
                if (!Number.isNaN(parseFloat(measure.value))) {
                  widget.value = parseFloat(parseFloat(measure.value.toString()).toFixed(2));
                  if (!update || !widget.gauge) {
                    this.gaugeChart.setPlotBands(widget, widget.alarm_value ? widget.alarm_value : index.alarm_value, widget.warning_value ? widget.warning_value : index.warning_value);
                    widget.gauge = this.gaugeChart.createGaugeChart(widget);
                    widget.is_loading_index = false;
                  } else {
                    widget.gauge.removePoint(0);
                    widget.gauge.addPoint(widget.value);
                  }
                } else {
                  this.setError(widget, { status: 8498 });
                  widget.is_loading_index = false;
                  return;
                }
              });
              widget.last_updated = this.httpUtils.getLocaleDateTimeString(moment().toISOString());
            },
            (error: any) => {
              this.setError(widget, error);
              return;
            }
          );
        }
      });
      if (widget.drains != '') {
        if (widget.costs_drain_id) {
          this.measuresService.getCosts(widget.costs_drain_id, widget.drains, widget.costs_aggregation, widget.operations, this.httpUtils.getDateTimeForUrl(new Date(widget.start_time ? widget.start_time : moment().add(widget.number_periods * -1, <unitOfTime.DurationConstructor>widget.period).toISOString()), true), this.httpUtils.getDateTimeForUrl(new Date(moment().toISOString()), true), widget.time_aggregation).subscribe(
            (measures: any) => {
              this.loadMeasuresInGauge(widget, measures, update);
            },
            (error: any) => {
              if (error.status !== 404) {
                this.setError(widget, error);
                return;
              }
            }
          );
        } else {
          this.measuresService.getMeasures(widget.drains, widget.aggregations, widget.operations, this.httpUtils.getDateTimeForUrl(new Date(widget.start_time ? widget.start_time : moment().add(widget.number_periods * -1, <unitOfTime.DurationConstructor>widget.period).toISOString()), true), this.httpUtils.getDateTimeForUrl(new Date(moment().toISOString()), true), widget.time_aggregation).subscribe(
            (measures: any) => {
              this.loadMeasuresInGauge(widget, measures, update);
            },
            (error: any) => {
              if (error.status !== 404) {
                this.setError(widget, error);
                return;
              }
            }
          );
        }
      }
    }
  }

  loadMeasuresInGauge(widget: DashboardWidget, measures: any, update: boolean): void {
    if (measures) {
      if (measures.length > 0) {
        if ((measures.length > 1) || (measures[0].measures.length > 1)) {
          this.setError(widget, { status: 8497 });
          return;
        }
        if (measures[0].measures && (measures[0].measures.length > 0)) {
          if (!Number.isNaN(parseFloat(measures[0].measures[0].value))) {
            widget.decimals = measures[0].decimals ? measures[0].decimals : 2;
            widget.value = parseFloat(parseFloat(measures[0].measures[0].value.toString()).toFixed(widget.decimals));
            if (!update || !widget.gauge) {
              this.gaugeChart.setPlotBands(widget, widget.alarm_value, widget.warning_value);
              widget.unit = measures[0].unit;
              widget.gauge = this.gaugeChart.createGaugeChart(widget);
              widget.is_loading_drain = false;
            } else {
              widget.gauge.removePoint(0);
              widget.gauge.addPoint(widget.value);
            }
          } else {
            this.setError(widget, { status: 8498 });
            return;
          }
        } else {
          widget.is_loading_drain = false;
        }
      } else {
        widget.is_loading_drain = false;
      }
    } else {
      widget.is_loading_drain = false;
    }
    widget.last_updated = this.httpUtils.getLocaleDateTimeString(moment().toISOString());
  }

  loadChart(widget: DashboardWidget): void {
    widget.drains = '';
    widget.drain_ids = '';
    widget.formula_ids = '';
    widget.aggregations = '';
    widget.operations = '';
    widget.units = [];
    widget.y_axis = [];
    widget.series = [];
    if (widget.widget_type === 'HEATMAP') {
      let isBoolean: boolean = ((widget.details.length === 1) && (widget.details[0].drain_id) && (this.allDrains.find(d => d.id === widget.details[0].drain_id).measure_type === 'c'));
      let colors: any[] = isBoolean ? [ [0, '#FF0000'], [1, '#00FF00'] ] : [ [0, '#00FF00'], [0.5, '#FFFF00'], [0.9, '#FF0000'] ];
      if (widget.color1 || widget.color2 || widget.color3) {
        colors = [];
        if (widget.color1)
          colors.push([0, widget.color1]);
        if (widget.color2)
          colors.push([0.5, widget.color2]);
        if (widget.color3)
          colors.push([0.9, widget.color3]);
      }
      widget.color_axis = { stops: colors, max: isBoolean ? 1 : undefined, min: isBoolean ? 0 : undefined };
    } else if (widget.widget_type !== 'PIE') {
      widget.plot_options = { series: { marker: { enabled: true }, dataGrouping: { enabled: true, approximation: 'average' } } };
    }
    if (widget.details) {
      widget.details.forEach(detail => {
        if (detail.drain_id) {
          widget.is_loading_drain = true;
          this.loadDrainDetail(widget, detail, this.allDrains.find(d => d.id === detail.drain_id), undefined);
        } else if (detail.formula_id) {
          widget.is_loading_drain = true;
          this.setFormula(widget, detail);
        } else if (detail.index_id) {
          let component = this;
          widget.is_loading_index = true;
          if ((widget.time_aggregation === 'NONE') || (widget.time_aggregation === 'ALL')) {
            this.indicesService.calculateIndex(detail.index_id, this.httpUtils.getDateTimeForUrl(new Date(moment().add(widget.number_periods * -1, <unitOfTime.DurationConstructor>widget.period).toISOString()), true), this.httpUtils.getDateTimeForUrl(new Date(moment().toISOString()), true)).subscribe(
              (index: Index) => {
                let yAxisIndex: number;
                if ((widget.units.length > 0) && (widget.units.includes(''))) {
                  yAxisIndex = widget.units.indexOf('');
                } else {
                  widget.units.push('');
                  yAxisIndex = widget.units.length - 1;
                  widget.y_axis[yAxisIndex] = this.timeChart.createYAxis(undefined, widget.units.length, widget.alarm_value, widget.warning_value, undefined, undefined, false, 'f', '');
                }
                let data_array = [];
                index.result.forEach(measure => {
                  if (!Number.isNaN(parseFloat(measure.value)))
                    data_array.unshift(component.timeChart.createData(new Date(measure.at), measure.value.toString(), 2, false, 'NONE'));
                });
                widget.series.push(this.timeChart.createSerie(data_array, index.name, yAxisIndex, 2, false, 'f', widget.time_aggregation));
                widget.chart = this.timeChart.createTimeChart(widget);
                widget.last_updated = this.httpUtils.getLocaleDateTimeString(moment().toISOString());
                widget.is_loading_index = false;
              },
              (error: any) => {
                this.setError(widget, error);
                return;
              }
            );
          } else {
            let nPeriods = 1;
            if (widget.time_aggregation === 'MINUTE') {
              if (widget.period === 'hours')
                nPeriods = 60;
              else if (widget.period === 'days')
                nPeriods = 60 * 24;
              else if (widget.period === 'months')
                nPeriods = 60 * 24 * 30;
              else if (widget.period === 'years')
                nPeriods = 60 * 24 * 365;
            } else if (widget.time_aggregation === 'QHOUR') {
              if (widget.period === 'hours')
                nPeriods = 4;
              else if (widget.period === 'days')
                nPeriods = 4 * 24;
              else if (widget.period === 'months')
                nPeriods = 4 * 24 * 30;
              else if (widget.period === 'years')
                nPeriods = 4 * 24 * 365;
            } else if (widget.time_aggregation === 'HOUR') {
              if (widget.period === 'days')
                nPeriods = 24;
              else if (widget.period === 'months')
                nPeriods = 24 * 30;
              else if (widget.period === 'years')
                nPeriods = 24 * 365;
            } else if (widget.time_aggregation === 'DAY') {
              if (widget.period === 'months')
                nPeriods = 30;
              else if (widget.period === 'years')
                nPeriods = 365;
            } else if (widget.time_aggregation === 'MONTH') {
              if (widget.period === 'years')
                nPeriods = 12;
            }
            this.indicesService.calculateLastIndex(detail.index_id, widget.time_aggregation, widget.number_periods * nPeriods).subscribe(
              (index: Index) => {
                let yAxisIndex: number;
                if ((widget.units.length > 0) && (widget.units.includes(''))) {
                  yAxisIndex = widget.units.indexOf('');
                } else {
                  widget.units.push('');
                  yAxisIndex = widget.units.length - 1;
                  widget.y_axis[yAxisIndex] = this.timeChart.createYAxis(undefined, widget.units.length, (widget.units.length === 1) ? widget.alarm_value : undefined, (widget.units.length === 1) ? widget.warning_value : undefined, undefined, undefined, false, 'f', '');
                }
                let data_array = [];
                index.result.forEach(measure => {
                  if (!Number.isNaN(parseFloat(measure.value)))
                    data_array.unshift(component.timeChart.createData(new Date(measure.at), measure.value.toString(), 2, false, 'NONE'));
                });
                widget.series.push(this.timeChart.createSerie(data_array, index.name, yAxisIndex, 2, false, 'f', widget.time_aggregation));
                widget.chart = this.timeChart.createTimeChart(widget);
                widget.last_updated = this.httpUtils.getLocaleDateTimeString(moment().toISOString());
                widget.is_loading_index = false;
              },
              (error: any) => {
                if (error.status !== 404) {
                  this.setError(widget, error);
                  return;
                }
              }
            );
          }
        }
      });
      if (widget.last_operator && (widget.last_operator !== 'SEMICOLON')) {
        this.setError(widget, { status: 8499 });
        return;
      }
      if (widget.drains != '') {
        let requests: any[] = [];
        let start_time = new Date(widget.start_time ? widget.start_time : moment().add(widget.number_periods * -1, <unitOfTime.DurationConstructor>widget.period).toISOString());
        let end_time = new Date(new Date(moment().toISOString()));
        if (end_time < start_time) {
          this.setError(widget, { status: 8499 });
          return;
        }
        if ((start_time.getFullYear() === end_time.getFullYear()) || (widget.time_aggregation === 'ALL')) {
          if (widget.costs_drain_id)
            requests.push(this.measuresService.getCosts(widget.costs_drain_id, widget.drains, widget.costs_aggregation, widget.operations, this.httpUtils.getDateTimeForUrl(start_time, true), this.httpUtils.getDateTimeForUrl(end_time, true), widget.time_aggregation));
          else
            requests.push(this.measuresService.getMeasures(widget.drains, widget.aggregations, widget.operations, this.httpUtils.getDateTimeForUrl(start_time, true), this.httpUtils.getDateTimeForUrl(end_time, true), widget.time_aggregation));
        } else {
           let start = moment(start_time);
           let end = moment(end_time);
           while (moment(start_time) < end) {
             start = (start_time.getFullYear() === new Date(end.toISOString()).getFullYear()) ? moment(start_time) : moment(end).startOf('year');
             if (widget.costs_drain_id)
               requests.push(this.measuresService.getCosts(widget.costs_drain_id, widget.drains, widget.costs_aggregation, widget.operations, this.httpUtils.getDateTimeForUrl(new Date(start.toISOString()), true), this.httpUtils.getDateTimeForUrl(new Date(end.toISOString()), true), widget.time_aggregation));
             else
               requests.push(this.measuresService.getMeasures(widget.drains, widget.aggregations, widget.operations, this.httpUtils.getDateTimeForUrl(new Date(start.toISOString()), true), this.httpUtils.getDateTimeForUrl(new Date(end.toISOString()), true), widget.time_aggregation));
             end = moment(start).add(-1, 'second');
           }
        }
        forkJoin(requests).subscribe(
          (results: any) => {
            let measures: any = results[results.length - 1];
            for (let i = results.length - 2; i >= 0; i--) {
              for (let j = 0; j < measures.length; j++) {
                measures[j].measures = measures[j].measures.concat(results[i][j].measures);
              }
            }
            this.loadMeasuresInChart(widget, measures);
          },
          (error: any) => {
            if (error.status !== 404) {
              this.setError(widget, error);
              return;
            }
          }
        );
      }
    }
  }

  loadMeasuresInChart(widget: DashboardWidget, measures: any): void {
    if ((widget.widget_type === 'HEATMAP') && (measures.length > 1)) {
      this.setError(widget, { status: 8497 });
      return;
    }
    let i = 0;
    measures.forEach((m: Measures) => {
      let drainColumnName = (widget.serie_names[i] ? widget.serie_names[i] : m.drain_name) + (m.unit ? ' (' + m.unit + ')' : '');
      if (!m.decimals)
        m.decimals = 2;
      let data_array = [];
      if (m.measures) {
        if (widget.widget_type === 'PIE') {
          m.measures.forEach((measure: Measure) => {
            if ((measure.value !== null) && (measure.value !== undefined) && !Number.isNaN(parseFloat(measure.value.toString())))
              widget.series.push(this.pieChart.createSerie(measure.value, drainColumnName, m.decimals));
          });
        } else {
          let yAxisIndex: number;
          if ((widget.units.length > 0) && (widget.units.includes(m.unit))) {
            yAxisIndex = widget.units.indexOf(m.unit);
          } else {
            widget.units.push(m.unit);
            yAxisIndex = widget.units.length - 1;
            widget.y_axis[yAxisIndex] = this.timeChart.createYAxis(m.unit, widget.units.length, (widget.units.length === 1) ? widget.alarm_value : undefined, (widget.units.length === 1) ? widget.warning_value : undefined, undefined, undefined, (widget.widget_type === 'HEATMAP'), m.measure_type, widget.time_aggregation);
          }
          let component = this;
          m.measures.forEach(function(measure: Measure) {
            if ((measure.value !== null) && (measure.value !== undefined) && !Number.isNaN(parseFloat(measure.value.toString())))
              data_array.push(component.timeChart.createData(new Date(measure.time), measure.value.toString(), (m.measure_type === 'c') ? 0 : m.decimals, (widget.widget_type === 'HEATMAP'), widget.time_aggregation));
          });
          if (data_array.length > 0)
            widget.series.push(component.timeChart.createSerie(data_array, drainColumnName, yAxisIndex, m.decimals, (widget.widget_type === 'HEATMAP'), m.measure_type, widget.time_aggregation));
        }
      }
      i++;
    });
    widget.chart = (widget.widget_type === 'PIE') ? this.pieChart.createPieChart(widget) : this.timeChart.createTimeChart(widget);
    widget.last_updated = this.httpUtils.getLocaleDateTimeString(moment().toISOString());
    widget.is_loading_drain = false;
  }

  loadAlertWidget(widget: DashboardWidget): void {
    if (widget.details) {
      widget.is_loading_control = true;
      widget.details.forEach(detail => {
        if (detail.drain_control_id) {
          this.drainControlsService.getDrainControl(detail.drain_control_id).subscribe(
            (control: DrainControl) => {
              widget.drain_control = control;
              if ((control.type === 'MISSING') || (control.type === 'THRESHOLD'))
                widget.alert_n = control.details.filter(d => d.active && d.error).length;
              else if (control.type === 'MEASUREDIFF')
                widget.warning_n = control.details.filter(d => d.active && d.error).length;
              widget.ok_n = control.details.filter(d => d.active && !d.error).length;
              widget.last_updated = this.httpUtils.getLocaleDateTimeString(moment().toISOString());
              widget.is_loading_control = false;
            },
            (error: any) => {
              if (error.status !== 404) {
                this.setError(widget, error);
                return;
              }
            }
          );
        }
      });
    }
  }

  viewControlDetail($event: MouseEvent | TouchEvent, widget: DashboardWidget, error: boolean): void {
    $event.preventDefault();
    $event.stopPropagation();
    if (widget.drain_control && widget.drain_control.details) {
      let details = widget.drain_control.details.filter(d => d.active && (d.error === error));
      if (details && details.length > 0) {
        let data = { orgs: [], clients: [], feeds: [], drains: [], formulas: [] };
        widget.drain_control.details.forEach(detail => {
          if ((detail.error === error) && detail.active)
            if (detail.drain_id)
              this.organizationsTree.selectDrain(data, this.allOrgs, this.energyClients, this.allFeeds, this.allDrains, detail.drain_id);
            else
              this.organizationsTree.selectFormula(data, this.allOrgs, this.energyClients, this.allFormulas, detail.formula_id);
        });
        this.dialog.open(DrainControlDetailsTreeDialogComponent, { width: '75%', data: data });
      }
    }
  }

  goToControl($event: MouseEvent | TouchEvent, widget: DashboardWidget): void {
    $event.preventDefault();
    $event.stopPropagation();
    if (widget.details) {
      widget.details.forEach(detail => {
        if (detail.drain_control_id) {
          this.router.navigate(['draincontrol/' + detail.drain_control_id]);
        }
      });
    }
  }

  goToMeasures($event: MouseEvent | TouchEvent, widget: DashboardWidget): void {
    $event.preventDefault();
    $event.stopPropagation();
    if (widget.drains && (widget.widget_type === 'SPLINE') || (widget.widget_type === 'HISTOGRAM') || (widget.widget_type === 'HEATMAP'))
      this.router.navigate([widget.costs_drain_id ? 'costs' : 'measures'], { queryParams: { costsDrain: widget.costs_drain_id, drainIds: widget.drain_ids, formulaIds: widget.formula_ids, costsAggregation: widget.costs_aggregation, aggregations: widget.aggregations, operations: widget.operations, startTime: this.httpUtils.getDateTimeForUrl(new Date(widget.start_time ? widget.start_time : moment().add(widget.number_periods * -1, <unitOfTime.DurationConstructor>widget.period).toISOString()), false), timeAggregation: widget.time_aggregation, chartType: widget.type, color1: widget.color1 ? widget.color1.replace('#', '%23') : undefined, color2: widget.color2 ? widget.color2.replace('#', '%23') : undefined, color3: widget.color3 ? widget.color3.replace('#', '%23') : undefined, warningValue: widget.warning_value, alarmValue: widget.alarm_value } });
  }

  goToControlMeasures($event: MouseEvent | TouchEvent, widget: DashboardWidget): void {
    $event.preventDefault();
    $event.stopPropagation();
    if (widget.details) {
      widget.details.forEach(detail => {
        if (detail.drain_control_id) {
          this.drainControlsService.getDrainControl(detail.drain_control_id).subscribe(
            (control: DrainControl) => {
              let active_controls = control.details.filter(d => d.active);
              if (active_controls.length === 1) {
                let drains: number[] = [];
                let aggregations: string[] = [];
                let operations: string[] = [];
                if (active_controls[0].drain_id) {
                  drains.push(active_controls[0].drain_id);
                  aggregations.push(active_controls[0].aggregation);
                  operations.push('SEMICOLON');
                } else if (active_controls[0].formula_id) {
                  let formula = this.allFormulas.find(f => f.id === active_controls[0].formula_id);
                  if (formula) {
                    if (formula.components) {
                      let i = 0;
                      let component = this;
                      formula.components.forEach(function (drain_id: number) {
                        let drain = component.allDrains.find(d => d.id === drain_id);
                        if (drain) {
                          drains.push(drain_id);
                          aggregations.push(formula.aggregations[i]);
                          operations.push(formula.operators[i]);
                        }
                        i++;
                      });
                    }
                  }
                }
                this.dialog.open(ChartDialogComponent, { width: '75%', data: { drains: drains, aggregations: aggregations, operations: operations, startTime: new Date(moment().add(active_controls[0].last_minutes * -1, 'minutes').toISOString()), endTime: new Date(moment().toISOString()), timeAggregation: 'NONE', high_threshold: active_controls[0].high_threshold, low_threshold: active_controls[0].low_threshold } });
              }
            },
            (error: any) => {
              if (error.status !== 404) {
                this.setError(widget, error);
                return;
              }
            }
          );
        }
      });
    }
  }

  loadDrainDetail(widget: DashboardWidget, detail: DashboardWidgetDetail, drain: Drain, formula: Formula): void {
    if (drain) {
      let feed = this.allFeeds.find(f => f.id === drain.feed_id);
      if (feed) {
        let client = this.energyClients.find(c => (feed.client_ids.indexOf(c.id) > -1));
        if (client) {
          let org = this.allOrgs.find(o => o.id === client.org_id);
          if (org) {
            widget.drains += ((widget.drains !== '') ? ',' : '') + drain.id;
            if (!formula)
              widget.drain_ids += ((widget.drain_ids !== '') ? ',' : '') + drain.id;
            widget.aggregations += ((widget.aggregations !== '') ? ',' : '') + detail.aggregation;
            widget.operations += ((widget.operations !== '') ? ',' : '') + detail.operator;
            widget.last_operator = detail.operator;
            if (detail.operator === 'SEMICOLON') {
              let serie_name = formula ? ((formula.operators.filter(o => o === 'SEMICOLON').length === 1) ? formula.name : '') : undefined;
              if (widget.serie_names)
                widget.serie_names.push(serie_name);
              else
                widget.serie_names = [serie_name];
            }
          }
        }
      }
    }
  }

  setError(widget: DashboardWidget, error: any): void {
    let status = error.status;
    if ((error.status >= 400) && (error.status < 500) && (error.error !== undefined))
      if (error.error.errorCode !== undefined)
        status = error.error.errorCode;
    widget.error = this.translate.instant('DIALOG.ERROR') + ' ' + status + ': ' + this.translate.instant('ERROR.' + status);
    widget.is_loading_drain = false;
    widget.is_loading_index = false;
    widget.is_loading_control = false;
    clearInterval(widget.interval);
  }

  saveDashboard(i: number): void {
    let w: DashboardWidget = this.dashboard[i];
    this.getGridsterItemPosition(w);
    let widget: DashboardWidget = new DashboardWidget();
    widget.dashboard_id =  this.dashboardId;
    widget.id = w.id;
    widget.n_cols = w.n_cols;
    widget.n_rows = w.n_rows;
    widget.x_pos = w.x_pos;
    widget.y_pos = w.y_pos;
    widget.costs_drain_id = w.costs_drain_id;
    widget.costs_aggregation = w.costs_aggregation;
    widget.widget_type = w.widget_type;
    widget.interval_seconds = w.interval_seconds;
    widget.title = w.title;
    widget.background_color = w.background_color;
    widget.number_periods = w.number_periods;
    widget.period = w.period;
    widget.start_time = w.start_time;
    widget.legend = w.legend;
    widget.legend_position = w.legend_position;
    widget.legend_layout = w.legend_layout;
    widget.navigator = w.navigator;
    widget.time_aggregation = w.time_aggregation;
    widget.min_value = w.min_value;
    widget.max_value = w.max_value;
    widget.warning_value = w.warning_value;
    widget.alarm_value = w.alarm_value;
    widget.color1 = w.color1;
    widget.color2 = w.color2;
    widget.color3 = w.color3;
    widget.details = w.details;
    this.dashboardWidgetsService.updateDashboardWidget(widget, this.dashboardId).subscribe(
      (_response: DashboardWidget) => {
        i++;
        if (i < this.dashboard.length)
          this.saveDashboard(i);
        else
          this.httpUtils.successSnackbar(this.translate.instant('DASHBOARD.SAVED'));
      },
      (error: any) => {
        this.httpUtils.errorDialog(error);
        return;
      }
    );
  }
}
