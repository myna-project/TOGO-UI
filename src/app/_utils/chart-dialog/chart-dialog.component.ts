import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';

import * as moment from 'moment';

import { Drain } from '../../_models/drain';
import { Formula } from '../../_models/formula';

import { DrainsService } from '../../_services/drains.service';
import { FormulasService } from '../../_services/formulas.service';
import { MeasuresService } from '../../_services/measures.service';

import { TimeChart } from '../../_utils/chart/time-chart';
import { HttpUtils } from '../../_utils/http.utils';

export interface ChartDialogData {
  drains: string[];
  formulas: string[];
  aggregations: string[];
  operations: string[];
  startTime: Date;
  endTime: Date;
  timeAggregation: string;
  alarm_value: number;
  warning_value: number;
  low_threshold: number;
  high_threshold: number;
}

@Component({
  templateUrl: './chart-dialog.component.html'
})
export class ChartDialogComponent implements OnInit {

  isLoading: boolean = true;
  allDrains: Drain[] = [];
  allFormulas: Formula[] = [];
  chartSeries: any[] = [];
  chartLabels: any[] = [];
  chart: any;

  constructor(private dialogRef: MatDialogRef<ChartDialogComponent>, private drainsService: DrainsService, private formulasService: FormulasService, private measuresService: MeasuresService, private timeChart: TimeChart, private router: Router, private httpUtils: HttpUtils, @Inject(MAT_DIALOG_DATA) private data: ChartDialogData) {}

  ngOnInit() {
    forkJoin(this.drainsService.getDrains(), this.formulasService.getFormulas()).subscribe(
      (results: any) => {
        this.allDrains = results[0];
        this.allFormulas = results[1];
        let drains: string[] = [];
        if (this.data.drains || this.data.formulas) {
          this.isLoading = true;
          if (this.data.drains) {
            if (!this.data.aggregations)
              this.data.aggregations = [];
            if (!this.data.operations)
              this.data.operations = [];
            this.data.drains.forEach((drain_id: string) => {
              drains.push(drain_id);
              if (!this.data.aggregations)
                this.data.aggregations.push('AVG');
              if (!this.data.operations)
                this.data.operations.push('SEMICOLON');
            });
          }
          if (this.data.formulas) {
            if (!this.data.aggregations)
              this.data.aggregations = [];
            if (!this.data.operations)
              this.data.operations = [];
            this.data.formulas.forEach((formula_id: String) => {
              let formula: Formula = this.allFormulas.find((f : Formula) => f.id === +formula_id);
              if (formula && formula.components) {
                let i = drains.length;
                let component = this;
                formula.components.forEach(function (drain_id: number) {
                  drains.push(drain_id.toString());
                  component.data.aggregations.push(formula.aggregations[i]);
                  component.data.operations.push(formula.operators[i]);
                  i++;
                });
              }
            });
          }
          if (!this.data.startTime || !this.data.endTime) {
            this.data.endTime = new Date(moment().toISOString());
            this.data.startTime = new Date(moment().add(-1, 'month').toISOString());
          }
          this.measuresService.getMeasures(drains.toString(), this.data.aggregations.toString(), this.data.operations.toString(), this.httpUtils.getDateTimeForUrl(this.data.startTime, true), this.httpUtils.getDateTimeForUrl(this.data.endTime, true), this.data.timeAggregation ? this.data.timeAggregation : 'HOUR').subscribe(
            (measures: any) => {
              let unitArray = [];
              measures.forEach((m: any) => {
                let drainColumnName: string = m.drain_name + (m.unit ? ' (' + m.unit + ')' : '');
                if (!m.decimals)
                  m.decimals = 2;
                let data_array: any[] = [];
                if (m.measures) {
                  let yAxisIndex: number;
                  if ((unitArray.length > 0) && (unitArray.includes(m.unit))) {
                    yAxisIndex = unitArray.indexOf(m.unit);
                  } else {
                    unitArray.push(m.unit);
                    yAxisIndex = unitArray.length - 1;
                    this.chartLabels[yAxisIndex] = this.timeChart.createYAxis(m.unit, unitArray.length, this.data.alarm_value, this.data.warning_value, this.data.low_threshold, this.data.high_threshold, false, m.measure_type, 'NONE');
                  }
                  let component = this;
                  m.measures.forEach(function(measure: any) {
                    if ((measure.value !== null) && (measure.value !== undefined) && !Number.isNaN(parseFloat(measure.value.toString())))
                      data_array.push(component.timeChart.createData(new Date(measure.time), measure.value.toString(), m.decimals, false, 'NONE'));
                  });
                  if (data_array.length > 0)
                    this.chartSeries.push(component.timeChart.createSerie(data_array, drainColumnName, yAxisIndex, m.decimals, false, m.measure_type, 'NONE'));
                }
              });
              if (this.chartSeries.length > 0) {
                let options = {};
                options['type'] = 'spline';
                options['y_axis'] = this.chartLabels;
                options['plot_options'] = { series: { marker: { enabled: true, dataGrouping: { enabled: false } } } };
                options['series'] = this.chartSeries;
                this.chart = this.timeChart.createTimeChart(options);
              }
              this.isLoading = false;
            },
            (error: any) => {
              this.httpUtils.errorDialog(error);
            }
          );
        } else {
          this.isLoading = false;
        }
      },
      (error: any) => {
        this.httpUtils.errorDialog(error);
      }
    );
  }

  goToMeasures() {
    this.dialogRef.close();
    if (this.data.drains || this.data.formulas)
      this.router.navigate(['measures'], { queryParams: { drainIds: this.data.drains ? this.data.drains.toString() : '', formulaIds: this.data.formulas ? this.data.formulas.toString() : '' } });
  }
}
