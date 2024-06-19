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
        options3d: {
          enabled: true,
          alpha: 45
        },
        height: options ? options.height : '100%',
        width: options ? options.width : '100%',
        backgroundColor: options.widget_type ? '#310640' : null
      },
      credits: {
        enabled: true
      },
      title: {
        text: options.title,
        style: {
          color: options.widget_type ? '#e6d4d4' : null,
          fontWeight: 'bold',
          fontSize: '1.2em'
        }
      },
      colors: options.widget_type ? ["#59b36b", "#3fafff","#ffca6a","#f13f43", "#2b27ff", "#ea7b08", "#c522e3", "#b8d043"] : ["#2caffe", "#fa041a", "#214cd7", "#4fc574", "#da6a41", "#050f1f", "#d568fb", "#91e8e1", "#00ea37", "#ea190e"],
        plotOptions: {
          pie: {
            innerSize: 100,
            depth: 45
          }
        },
      accessibility: {
        point: {
          valueSuffix: '%'
        }
      },
      tooltip: {
        pointFormat: '<b>{point.y:,.' + ((!options.decimals && options.decimals !== 0) ? 2 : options.decimals) + 'f}</b> ({point.percentage:.1f}%)',
        style: {
          fontSize: '1.2em'
        },
      },
      series: [{
        type: 'pie',
        data: options.series
      }]
    });
  }

  public createSerie(value: number, id: string, name: string, dashboard_type: boolean): any {
    return {
      id: id ? id : undefined,
      name: name,
      y: value,
      dataLabels: {
        format: '{point.name}: ({point.percentage:.1f}%)',
        style: {
          fontSize: '1.2em',
          fontWeight: 'bold',
          color: dashboard_type ? '#e6d4d4' : '#000000'
        }
      }
    }
  }
}
