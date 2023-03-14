import { Injectable } from '@angular/core';
import { Chart } from 'angular-highcharts';

@Injectable({
  providedIn: 'root',
})
export class PieChart {

  constructor() {}

  public createPieChart(options: any): Chart {
    return new Chart({
      chart: {
        type: 'pie',
        height: options ? options.height : '100%',
        width: options ? options.width : '100%'
      },
      credits: {
        enabled: true
      },
      title: {
        text: options.title
      },
      tooltip: {
        pointFormat: '<b>{point.y:,.' + ((!options.decimals && options.decimals !== 0) ? 2 : options.decimals) + 'f}</b> ({point.percentage:.1f}%)'
      },
      series: [{
        type: 'pie',
        data: options.series
      }]
    });
  }

  public createSerie(value: number, name: string, decimals: number): any {
    return {
      name: name,
      y: value,
      dataLabels: {
        format: '{point.name}: {point.y:,.' + ((!decimals && decimals !== 0) ? 2 : decimals) + 'f} ({point.percentage:.1f}%)'
      }
    }
  }
}
