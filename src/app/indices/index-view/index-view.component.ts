import { Location } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';

import { Index } from '../../_models/index';
import { IndexGroup } from '../../_models/indexgroup';
import { Organization } from '../../_models/organization';

import { IndicesService } from '../../_services/indices.service';
import { OrganizationsService } from '../../_services/organizations.service';

import { TimeChart } from '../../_utils/chart/time-chart';
import { GaugeChart } from '../../_utils/chart/gauge-chart';
import { HttpUtils } from '../../_utils/http.utils';

@Component({
  templateUrl: './index-view.component.html',
  styleUrls: ['./index-view.component.scss']
})
export class IndexViewComponent implements OnInit {

  isLoading: boolean = true;
  isLoadingIndex: boolean = false;
  index: Index = new Index();
  org: Organization = new Organization();
  grp: IndexGroup = new IndexGroup();
  indexForm: FormGroup;
  periods: any[] = [];
  currentGauge: any;
  lastGauge: any;
  chart: any;
  backRoute: string = 'indices';

  constructor(private indicesService: IndicesService, private orgsService: OrganizationsService, private timeChart: TimeChart, private gaugeChart: GaugeChart, private route: ActivatedRoute, private router: Router, private location: Location, private httpUtils: HttpUtils, private translate: TranslateService) {}

  ngOnInit() {
    this.translate.get('TIME.MINUTE').subscribe((minute: string) => {
      this.periods.push({ id: 'MINUTE', description: minute });
      this.translate.get('TIME.HOUR').subscribe((hour: string) => {
        this.periods.push({ id: 'HOUR', description: hour });
        this.translate.get('TIME.DAY').subscribe((day: string) => {
          this.periods.push({ id: 'DAY', description: day });
          this.translate.get('TIME.MONTH').subscribe((month: string) => {
            this.periods.push({ id: 'MONTH', description: month });
            this.translate.get('TIME.YEAR').subscribe((year: string) => {
              this.periods.push({ id: 'YEAR', description: year });
            });
          });
        });
      });
    });

    this.createForm();
    this.route.paramMap.subscribe((params: any) => {
      var indexId = +params.get('id');
      if (indexId) {
        this.indicesService.calculateLastIndex(indexId, 'MONTH', 2).subscribe(
          (index: Index) => {
            this.index = index;
            if (index.group)
              this.grp = index.group;
            if (this.index.result[0].value)
              this.currentGauge = this.gaugeChart.createGaugeChart(this.loadGaugeOptions(parseFloat(this.index.result[0].value.toString()), this.index.min_value, this.index.max_value, this.translate.instant('INDEX.CURRENTVALUE'), '#F66BDA'));
            if (this.index.result[1].value)
              this.lastGauge = this.gaugeChart.createGaugeChart(this.loadGaugeOptions(parseFloat(this.index.result[1].value.toString()), this.index.min_value, this.index.max_value, this.translate.instant('INDEX.LASTMONTH'), '#A274F2'));
            this.orgsService.getOrganization(index.org_id).subscribe(
              (org: Organization) => {
                this.org = org;
                this.createForm();
                this.isLoading = false;
              },
              (error: any) => {
                const dialogRef = this.httpUtils.errorDialog(error);
                dialogRef.afterClosed().subscribe((_value: any) => {
                  this.router.navigate([this.backRoute]);
                });
              }
            );
          },
          (error: any) => {
            const dialogRef = this.httpUtils.errorDialog(error);
            dialogRef.afterClosed().subscribe((_value: any) => {
              this.router.navigate([this.backRoute]);
            });
          }
        );
      } else {
        this.router.navigate([this.backRoute]);
      }
    });
  }

  get number_periods() { return this.indexForm.get('number_periods'); }
  get period() { return this.indexForm.get('period'); }

  createForm() {
    let patterns = this.httpUtils.getPatterns();
    this.indexForm = new FormGroup({
      'number_periods': new FormControl('', [ Validators.required, Validators.pattern(patterns.positiveInteger) ]),
      'period': new FormControl('', [ Validators.required ])
    });
  }

  loadIndex(): void {
    this.isLoadingIndex = true;
    this.indicesService.calculateLastIndex(this.index.id, this.period.value, this.number_periods.value).subscribe(
      (index: Index) => {
        if (index.result) {
          let data_array = [];
          let component = this;
          index.result.forEach(measure => {
            if (!Number.isNaN(parseFloat(measure.value)))
              data_array.unshift(component.timeChart.createData(new Date(measure.at), measure.value.toString(), 2, false, 'NONE'));
          });
          let options = {};
          options['type'] = 'column';
          options['height'] = Math.max(400, window.screen.height * 0.7);
          options['y_axis'] = this.timeChart.createYAxis(undefined, 2, undefined, undefined, undefined, undefined, false, 'f', 'NONE');
          options['series'] = [this.timeChart.createSerie(data_array, this.index.name, 0, 2, false, 'f', 'NONE')];
          this.chart = this.timeChart.createTimeChart(options);
        }
        this.isLoadingIndex = false;
      },
      (error: any) => {
        const dialogRef = this.httpUtils.errorDialog(error);
        dialogRef.afterClosed().subscribe((_value: any) => {
          this.router.navigate([this.backRoute]);
        });
      }
    );
  }

  loadGaugeOptions(value: number, min_value: number, max_value: number, title: string, background_color: string): any {
    let options = {};
    options['title'] = title + ': ' + value.toFixed(2);
    options['background_color'] = background_color;
    options['width'] = 300;
    options['height'] = 300;
    options['value'] = value;
    options['min_value'] = min_value;
    options['max_value'] = max_value;
    options['unit'] = '';
    this.gaugeChart.setPlotBands(options, this.index.alarm_value, this.index.warning_value);
    return options;
  }

  goBack(): void {
    this.location.back();
  }
}
