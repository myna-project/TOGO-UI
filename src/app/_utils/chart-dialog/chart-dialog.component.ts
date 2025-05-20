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
  nodes: string[];
  aggregations: string[];
  operations: string[];
  positive_negative_values: string[];
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
    forkJoin([this.drainsService.getDrains(), this.formulasService.getFormulas()]).subscribe({
      next: (results: any) => {
        this.allDrains = results[0];
        this.allFormulas = results[1];
        let drains: string[] = [];
        if (this.data.nodes) {
          this.isLoading = true;
          if (this.data.nodes) {
            if (!this.data.aggregations)
              this.data.aggregations = [];
            if (!this.data.operations)
              this.data.operations = [];
            if (!this.data.positive_negative_values)
              this.data.positive_negative_values = [];
            this.data.nodes.forEach((drain_id: string, index) => {
              drains.push(drain_id);
              if (this.data.nodes[index].slice(0,1) === 'd')
                if (!this.data.aggregations[index])
                  this.data.aggregations.push('AVG');
              if (this.data.nodes[index].slice(0,1) === 'f') {
                let formula = this.allFormulas.filter(f => this.data.nodes[index].slice(2) === f.id.toString())[0];
                if (formula && formula.operators.filter(o => o === 'SEMICOLON').length === 1)
                  if (!this.data.operations[index])
                    this.data.operations.push('SEMICOLON');
                  if (!this.data.positive_negative_values[index])
                    this.data.positive_negative_values.push('');
              } else
                if (!this.data.operations[index])
                  this.data.operations.push('SEMICOLON');
              if (!this.data.positive_negative_values[index])
                this.data.positive_negative_values.push('');
            });
          }
          if (!this.data.startTime || !this.data.endTime) {
            this.data.endTime = new Date(moment().toISOString());
            this.data.startTime = new Date(moment().add(-1, 'month').toISOString());
          }
          this.measuresService.getMeasures(drains.toString(), '', this.data.positive_negative_values.toString(), this.data.aggregations.toString(), this.data.operations.toString(), this.httpUtils.getDateTimeForUrl(this.data.startTime, true), this.httpUtils.getDateTimeForUrl(this.data.endTime, true), this.data.timeAggregation ? this.data.timeAggregation : 'HOUR', false).subscribe({
            next: (measures: any) => {
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
                    this.chartLabels[yAxisIndex] = this.timeChart.createYAxis(m.unit, unitArray.length, this.data.alarm_value, this.data.warning_value, this.data.low_threshold, this.data.high_threshold, false, m.measure_type, 'NONE', false, false);
                  }
                  let component = this;
                  m.measures.forEach(function(measure: any) {
                    if ((measure.value !== null) && (measure.value !== undefined) && !Number.isNaN(parseFloat(measure.value.toString())))
                      data_array.push(component.timeChart.createData(new Date(measure.time), measure.value.toString(), m.decimals, false, 'NONE'));
                  });
                  if (data_array.length > 0)
                    this.chartSeries.push(component.timeChart.createSerie(data_array, undefined, drainColumnName, yAxisIndex, m.decimals, false, false, m.measure_type, 'NONE'));
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
            error: (error: any) => {
              this.httpUtils.errorDialog(error);
            }
          });
        } else {
          this.isLoading = false;
        }
      },
      error: (error: any) => {
        this.httpUtils.errorDialog(error);
      }
    });
  }

  goToMeasures() {
    this.dialogRef.close();
    if (this.data.nodes)
      this.router.navigate(['measures'], { queryParams: { nodeIds: this.data.nodes ? this.data.nodes.toString() : '', operations: this.data.operations ? this.data.operations.toString() : '', positiveNegativeValues: this.data.positive_negative_values ? this.data.positive_negative_values.toString() : '', aggregations: this.data.aggregations ? this.data.aggregations.toString() : '', startTime: this.data.startTime, endTime: this.data.endTime } });
  }
}
