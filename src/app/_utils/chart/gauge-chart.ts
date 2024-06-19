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
        backgroundColor: {
          linearGradient: { x1: 0.7, x2: 0.4, y1: 0.4, y2: 1 },
          stops: [
            [0, '#310640'],
            [1, options.background_color.toString()],
          ]
        },
        height: options ? options.height : '100%',
        width: options ? options.width : '100%'
      },
      pane: {
        startAngle: -90,
        endAngle: 89.9,
        background: null,
        center: ['50%', '75%'],
        size: '80%'
      },
      credits: {
        enabled: true
      },
      title: {
        text: options.title,
        verticalAlign: 'top',
        style: {
          color: '#e6d4d4',
          fontWeight: 'bold',
          fontSize: '1.1em',
        }
      },
      legend: {
        enabled: false
      },
      yAxis: {
        min: options.min_value,
        max: options.max_value,
        minorTickInterval: null,
        minorTickWidth: 2,
        minorTickLength: 10,
        tickPixelInterval: 50,
        labels: {
          y: 0,
          style: {
            color: "#bbb1b1",
            fontWeight: 'bold',
          },
          distance: 18
        },
        title: {
          text: options.unit ? options.unit : '',
          style: {
            fontSize: '1em',
            color: "#bbb1b1",
            fontWeight: 'bold'
          },
          y: 36
        },
        plotBands: options.plot_bands,
      },
      series: [
        {
          type: 'gauge',
          name: '',
          dataLabels: {
            format: '{point.y:,.' + (options.decimals ? options.decimals : 2) + 'f}',
            style: {
              fontSize: '16px'
            }
          },
          data: [options.value],
          tooltip: {
            valueDecimals: ((options.decimals !== null) && (options.decimals !== undefined)) ? options.decimals : 2,
            valueSuffix: options.unit ? ' ' + options.unit : ''
          },
          dial: {
            radius: '80%',
            backgroundColor: '#bbb1b1',
          },
          pivot: {
            backgroundColor: '#bbb1b1'
          }
        }
      ]
    });
  }

  public setPlotBands(options: any, alarm_value: number, warning_value: number): void {
    let alarm_color = '#a62b2b' // red
    let warning_color = '#e3c81e' // yellow
    let ok_color = '#5e9a50' // green
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
