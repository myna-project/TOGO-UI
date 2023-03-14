import { Injectable } from '@angular/core';
import { Chart } from 'angular-highcharts';

@Injectable({
  providedIn: 'root',
})
export class GaugeChart {

  constructor() {}

  public createGaugeChart(options: any): Chart {
    return new Chart({
      chart: {
        type: 'gauge',
        backgroundColor: options.background_color,
        height: options ? options.height : '100%',
        width: options ? options.width : '100%'
      },
      credits: {
        enabled: true
      },
      title: {
        text: options.title,
        verticalAlign: 'top'
      },
      legend: {
        enabled: false
      },
      pane: {
        startAngle: -150,
        endAngle: 150
      },
      yAxis: {
        min: options.min_value,
        max: options.max_value,
        minorTickInterval: 'auto',
        minorTickWidth: 1,
        minorTickLength: 10,
        minorTickPosition: 'inside',
        minorTickColor: '#666',
        tickPixelInterval: 30,
        tickWidth: 2,
        tickPosition: 'inside',
        tickLength: 10,
        tickColor: '#666',
        labels: {
          step: 2
        },
        title: {
          text: options.unit ? options.unit : ''
        },
        plotBands: options.plot_bands,
      },
      series: [
        {
          type: 'gauge',
          name: '',
          dataLabels: {
            format: '{point.y:,.' + (options.decimals ? options.decimals : 2) + 'f}'
          },
          data: [options.value],
          tooltip: {
            valueDecimals: ((options.decimals !== null) && (options.decimals !== undefined)) ? options.decimals : 2,
            valueSuffix: options.unit ? ' ' + options.unit : ''
          }
        }
      ]
    });
  }

  public setPlotBands(options: any, alarm_value: number, warning_value: number): void {
    let alarm_color = '#DF5353' // red
    let warning_color = '#DDDF0D' // yellow
    let ok_color = '#55BF3B' // green
    if ((options.min_value === undefined) || (options.min_value > options.value))
      options.min_value = options.value;
    if ((options.max_value === undefined) || (options.max_value < options.value))
      options.max_value = options.value;
    if ((warning_value !== undefined) && (alarm_value !== undefined)) {
      if (alarm_value > warning_value) {
        if (options.min_value > warning_value)
          options.min_value = warning_value * 0.5;
        if (options.max_value < alarm_value)
          options.max_value = alarm_value * 1.1;
        options.plot_bands = [
          {
            from: options.min_value,
            to: warning_value,
            color: ok_color
          },
          {
            from: warning_value,
            to: alarm_value,
            color: warning_color
          },
          {
            from: alarm_value,
            to: options.max_value,
            color: alarm_color
          }
        ];
      } else {
        if (options.min_value > alarm_value)
          options.min_value = alarm_value * 0.5;
        if (options.max_value < warning_value)
          options.max_value = warning_value * 1.1;
        options.plot_bands = [
          {
            from: options.min_value,
            to: alarm_value,
            color: alarm_color
          },
          {
            from: alarm_value,
            to: warning_value,
            color: warning_color
          },
          {
            from: warning_value,
            to: options.max_value,
            color: ok_color
          }
        ];
      }
    } else if (alarm_value !== undefined) {
      if (options.min_value > alarm_value)
        options.min_value = alarm_value * 0.5;
      if (options.max_value < alarm_value)
        options.max_value = alarm_value * 1.1;
      options.plot_bands = [
        {
          from: options.min_value,
          to: alarm_value,
          color: ok_color
        },
        {
          from: alarm_value,
          to: options.max_value,
          color: alarm_color
        }
      ];
    } else if (warning_value !== undefined) {
      if (options.min_value > warning_value)
        options.min_value = warning_value * 0.5;
      if (options.max_value < warning_value)
        options.max_value = warning_value * 1.1;
      options.plot_bands = [
        {
          from: options.min_value,
          to: warning_value,
          color: ok_color
        },
        {
          from: warning_value,
          to: options.max_value,
          color: warning_color
        }
      ];
    }
  }
}
