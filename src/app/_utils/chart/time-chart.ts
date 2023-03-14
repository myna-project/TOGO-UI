import { Injectable } from '@angular/core';
import { StockChart } from 'angular-highcharts';
import { TranslateService } from '@ngx-translate/core';

import { HttpUtils } from '../http.utils';

@Injectable({
  providedIn: 'root',
})
export class TimeChart {

  months: string[] = [];

  constructor(private httpUtils: HttpUtils, private translate: TranslateService) {
    this.translate.get('MONTH.JANUARY').subscribe((january: string) => {
      this.months.push(january);
      this.translate.get('MONTH.FEBRUARY').subscribe((february: string) => {
        this.months.push(february);
        this.translate.get('MONTH.MARCH').subscribe((march: string) => {
          this.months.push(march);
          this.translate.get('MONTH.APRIL').subscribe((april: string) => {
            this.months.push(april);
            this.translate.get('MONTH.MAY').subscribe((may: string) => {
              this.months.push(may);
              this.translate.get('MONTH.JUNE').subscribe((june: string) => {
                this.months.push(june);
                this.translate.get('MONTH.JULY').subscribe((july: string) => {
                  this.months.push(july);
                  this.translate.get('MONTH.AUGUST').subscribe((august: string) => {
                    this.months.push(august);
                    this.translate.get('MONTH.SEPTEMBER').subscribe((september: string) => {
                      this.months.push(september);
                      this.translate.get('MONTH.OCTOBER').subscribe((october: string) => {
                        this.months.push(october);
                        this.translate.get('MONTH.NOVEMBER').subscribe((november: string) => {
                          this.months.push(november);
                          this.translate.get('MONTH.DECEMBER').subscribe((december: string) => {
                            this.months.push(december);
                          });
                        });
                      });
                    });
                  });
                });
              });
            });
          });
        });
      });
    });
  }

  public createTimeChart(options: any): StockChart {
    return new StockChart({
      chart: {
        panning: { enabled: false },
        type: options.type,
        height: options ? options.height : '100%',
        width: options ? options.width : '100%',
      },
      title: {
        text: options.title,
      },
      boost: {
        useGPUTranslations: true
      },
      credits: {
        enabled: true
      },
      xAxis: {
        type: 'datetime',
        ordinal: false
      },
      yAxis: options.y_axis,
      colorAxis: options.color_axis,
      legend: {
        enabled: options.legend,
        layout: (options.legend_layout && (options.legend_layout == 'h')) ? 'horizontal' : 'vertical',
        align: options.legend_position ? options.legend_position.substr(options.legend_position.indexOf('-') + 1) : 'center',
        verticalAlign: options.legend_position ? options.legend_position.substr(0, options.legend_position.indexOf('-')) : 'bottom'
      },
      tooltip: {
        valueDecimals: 2
      },
      navigator: {
        enabled: options.navigator
      },
      plotOptions: options.plot_options ? options.plot_options : {},
      time: {
        useUTC: false
      },
      responsive: {
        rules: [{
          condition: {
            maxWidth: 500
          },
          chartOptions: {
            legend: {
              layout: 'horizontal',
              align: 'center',
              verticalAlign: 'bottom'
            }
          }
        }]
      },
      series: options.series
    });
  }

  public createYAxis(unit: string, n: number, alarm_value: number, warning_value: number, low_threshold: number, high_threshold: number, heatmap: boolean, measure_type: string, time_aggregation: string): any {
    let timeChart = this;
    return heatmap ?
      {
        title: {
          text: null
        },
        labels: {
          formatter: function () {
            if (time_aggregation === 'HOUR')
              return this.value + ':00';
            else if (time_aggregation === 'DAY')
              return this.value
            else
              return timeChart.months[this.value - 1]
          },
          align: 'left',
        },
        showFirstLabel: true,
        showLastLabel: true,
        startOnTick: false,
        endOnTick: false,
        tickWidth: 1,
        min: (time_aggregation === 'HOUR') ? 0 : 1,
        max: (time_aggregation === 'HOUR') ? 23 : ((time_aggregation === 'DAY') ? 31 : 12)
      }
    :
      {
        labels: {
          formatter: function () {
            return (measure_type === 'c') ? ((this.value == 1) ? 'ON' : ((this.value == 0) ? 'OFF' : '')) : this.value + (unit ? ' ' + unit : '');
          }
        },
        offset: (n == 1) ? 50 : undefined,
        max: (measure_type === 'c') ? 1.5 : undefined,
        min: (measure_type === 'c') ? -0.5 : undefined,
        tickPositions: (measure_type === 'c') ? [-0.5, 0, 1, 1.5] : undefined,
        startOnTick: (measure_type === 'c') ? false : true,
        endOnTick: (measure_type === 'c') ? false : true,
        opposite: n % 2,
        plotLines: (alarm_value || warning_value || low_threshold || high_threshold) ? [{ color: '#DF5353', dashStyle: 'shortdash', value: alarm_value, width: 1, zIndex: 5 }, { color: '#DDDF0D', dashStyle: 'shortdash', value: warning_value, width: 1, zIndex: 5 }, { color: '#DF5353', dashStyle: 'shortdash', value: low_threshold, width: 1, zIndex: 5 }, { color: '#DF5353', dashStyle: 'shortdash', value: high_threshold, width: 1, zIndex: 5 }] : undefined
      };
  }

  public createData(date: Date, value: string, decimals: number, heatmap: boolean, time_aggregation: string): any {
    return heatmap ? [ (time_aggregation === 'HOUR') ? new Date(date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate() + ' 00:00').getTime() : ((time_aggregation === 'DAY') ? new Date(date.getFullYear() + '-' + (date.getMonth() + 1) + '-01 00:00:00').getTime() : new Date(date.getFullYear() + '-01-01 00:00').getTime()), (time_aggregation === 'HOUR') ? date.getHours() : ((time_aggregation === 'DAY') ? date.getDate() : date.getMonth() + 1), parseFloat(parseFloat(value).toFixed(decimals)) ] : [ date.getTime(), parseFloat(parseFloat(value).toFixed(decimals)) ];
  }

  public createSerie(data_array: any[], name: string, yAxisIndex: number, decimals: number, heatmap: boolean, measure_type: string, time_aggregation: string): any {
    let timeChart = this;
    return heatmap ?
      {
        data: data_array,
        nullColor: '#EFEFEF',
        turboThreshold: 1000000,
        colsize: (time_aggregation === 'HOUR') ? 24 * 36e5 : ((time_aggregation === 'DAY') ? 24 * 30 * 36e5 : 24 * 365 * 36e5),
        name: name,
        tooltip: {
          pointFormatter: function () {
            return ((time_aggregation === 'HOUR') ? timeChart.httpUtils.getLocaleDateString(this.x) + ' ' + this.y + ':00' : ((time_aggregation === 'DAY') ? timeChart.httpUtils.getMonthString(this.x) + ', ' + this.y : new Date(this.x).getFullYear() + ', ' + timeChart.months[this.y - 1])) + ': <b>' + ((measure_type === 'c') ? ((this.value == 1) ? 'ON' : ((this.value == 0) ? 'OFF' : '')) : this.value.toFixed(decimals)) + '</b>';
          }
        }
      }
    :
      {
        data: data_array,
        name: name,
        yAxis: yAxisIndex,
        tooltip: {
          pointFormatter: function () {
            return name + ': <b>' + ((measure_type === 'c') ? ((this.y == 1) ? 'ON' : ((this.y == 0) ? 'OFF' : '')) : this.y.toFixed(decimals)) + '</b></td>';
          }
        }
      }
  }
}
