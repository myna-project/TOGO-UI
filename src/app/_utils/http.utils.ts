import { Injectable } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateService } from '@ngx-translate/core';

import * as moment from 'moment';

import { Drain } from '../_models/drain';
import { Index } from '../_models/index';
import { Measures } from '../_models/measures';
import { Organization } from '../_models/organization';
import { User } from '../_models/user';

import { ConfirmDialogModel, ConfirmDialogComponent } from '../_utils/confirm-dialog/confirm-dialog.component';
import { MessageDialogModel, MessageDialogComponent } from '../_utils/message-dialog/message-dialog.component';

import { environment } from './../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class HttpUtils {

  measuresAggregations: any[] = [{ id: 'AVG', description: 'AVG', excludedMeasureType: [] }, { id: 'MAX', description: 'MAX', excludedMeasureType: [] }, { id: 'MIN', description: 'MIN', excludedMeasureType: [] }, { id: 'SUM', description: 'SUM', excludedMeasureType: ['c'] }];
  measuresOperations: any[] = [{ id: 'TIMES', description: '*', excludedMeasureType: ['c'] }, { id: 'DIVISION', description: '/', excludedMeasureType: ['c'] }, { id: 'PLUS', description: '+', excludedMeasureType: ['c'] }, { id: 'MINUS', description: '-', excludedMeasureType: ['c'] }, { id: 'SEMICOLON', description: ';', excludedMeasureType: [] }];
  chartAggregations: any[] = [{ id: 'None', description: 'NONE' }, { id: 'average', description: 'AVG' }, { id: 'high', description: 'MAX' }, { id: 'low', description: 'MIN' }];

  constructor(private dialog: MatDialog, private snackBar: MatSnackBar, private translate: TranslateService) {}

  public getTogoAPIUrl() {
    return (environment.sameDomain ? window.location.protocol + '//' + window.location.hostname + ':' + environment.port + '/' : environment.URL) + environment.contextPath;
  }

  public getAdminUrl() {
    let currentUser = <User>JSON.parse(localStorage.getItem('currentUser'));
    if (currentUser === null || currentUser === undefined) {
      return 'organization/';
    } else {
      return currentUser.is_admin ? 'admin/organization/' : 'organization/';
    }
  }

  public generateUriFilter(filter: Object) {
    let filters = '';
    if (filter !== null) {
      for (let key in filter) {
        if (filter.hasOwnProperty(key)) {
          if (filter[key] !== null && filter[key] !== undefined) {
            if (filters.length > 0) {
              filters += '&';
            } else {
              filters += '?';
            }
            filters += key.toString() + '=' + encodeURIComponent(filter[key]);
          }
        }
      }
    }
    return filters;
  }

  public successSnackbar(message: string) {
    this.snackBar.open(message, null, { duration: 2000, panelClass: 'notify-success' });
  }

  public confirmDelete(message: string): MatDialogRef<ConfirmDialogComponent, any> {
    const dialogData = new ConfirmDialogModel(message, this.translate.instant('DIALOG.CONFIRM'), this.translate.instant('DIALOG.CANCEL'));
    const dialogRef = this.dialog.open(ConfirmDialogComponent, { maxWidth: '400px', data: dialogData });
    return dialogRef;
  }

  public errorDialog(error: any): MatDialogRef<MessageDialogComponent, any> {
    let status = error.status;
    if ((error.status >= 400) && (error.status <= 500) && (error.error !== undefined))
      if (error.error.errorCode !== undefined)
        status = error.error.errorCode;
    const dialogData = new MessageDialogModel('error', this.translate.instant('DIALOG.ERROR') + ' ' + status, this.translate.instant('ERROR.' + status), 'OK');
    const dialogRef = this.dialog.open(MessageDialogComponent, { maxWidth: '400px', data: dialogData });
    return dialogRef;
  }

  public getPatterns(): any {
    return {
      positiveInteger: '^\\d*$',
      negativeInteger: '^-\\d*$',
      positiveNegativeInteger: '^-?\\d*$',
      positiveFloat: '^\\d*(\\.\\d{1,})?$',
      negativeFloat: '^-\\d*(\\.\\d{1,})?$',
      positiveNegativeFloat: '^-?\\d*(\\.\\d{1,})?$',
      positiveTwoDecimal: '^\\d*(\\.\\d{1,2})?$',
      negativeTwoDecimal: '^-\\d*(\\.\\d{1,2})?$',
      positiveNegativeTwoDecimal: '^-?\\d*(\\.\\d{1,2})?$',
      positivePerc: '^\\d{1,3}(\\.\\d{1,2})?$',
      negativePerc: '^-\\d{1,3}(\\.|\\d{1,2})?$',
      positiveNegativePerc: '^-?\\d{1,3}(\\.\\d{1,2})?$'
    }
  }

  public getLanguage() {
    let currentUser = <User>JSON.parse(localStorage.getItem('currentUser'));
    if (currentUser !== null && currentUser !== undefined)
      return currentUser.lang;
  }

  public getDateForForm(date: Date): string {
    let month: number = date.getMonth() + 1;
    let day: number = date.getDate();
    return date.getFullYear() + '-' + ((month < 10) ? '0' : '') + month + '-' + ((day < 10) ? '0' : '') + day;
  }

  public getDateTimeForUrl(date: Date, urlEncoding: boolean): string {
    let month: number = date.getMonth() + 1;
    let day: number = date.getDate();
    let hour: number = date.getHours();
    let minutes: number = date.getMinutes();
    let seconds: number = date.getSeconds();
    let offset: number = date.getTimezoneOffset() * -1;
    let offset_hour: number = Math.floor(offset/60);
    let offset_minute: number = (offset % 60) * 60;
    let offsetString: string = ((offset_hour <= 0) ? '-' : (urlEncoding ? '%2B' : '+'));
    if (offset_hour <= 0)
      offset_hour = offset_hour * -1;
    offsetString = offsetString + ((offset_hour < 10) ? '0' : '') + offset_hour + ((offset_minute < 10) ? '0' : '') + offset_minute;
    return date.getFullYear() + '-' + ((month < 10) ? '0' : '') + month + '-' + ((day < 10) ? '0' : '') + day + 'T' + ((hour < 10) ? '0' : '') + hour + ':' + ((minutes < 10) ? '0' : '') + minutes + ':' + ((seconds < 10) ? '0' : '') + seconds + offsetString;
  }

  public getMonthString(date: string): string {
    return (new Date(date)).toLocaleDateString(this.getLanguage(), { year: "numeric", month: "short" });
  }

  public getLocaleDateString(date: string): string {
    return (new Date(date)).toLocaleDateString(this.getLanguage(), { year: "numeric", month: "2-digit", day: "2-digit" });
  }

  public getLocaleDateTimeString(date: string): string {
    return (new Date(date)).toLocaleDateString(this.getLanguage(), { year: "numeric", month: "2-digit", day: "2-digit" }) + ' ' + (new Date(date)).toLocaleTimeString(this.getLanguage(), { hour: '2-digit', minute: '2-digit' });
  }

  public getLocaleDateTimeStringWithSeconds(date: string): string {
    return (new Date(date)).toLocaleDateString(this.getLanguage(), { year: "numeric", month: "2-digit", day: "2-digit" }) + ' ' + (new Date(date)).toLocaleTimeString(this.getLanguage(), { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }

  public hexToRgb(hex: string) {
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, (_m, r, g, b) => {
      return r + r + g + g + b + b;
    });
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  public getChildrenOrganizations(allOrgs: Organization[], parent: Organization, orgs: Organization[]): Organization[] {
    if (parent) {
      let children: Organization[] = allOrgs.filter(o => o.parent_id === parent.id);
      children.forEach((org: Organization) => {
        if (!orgs.find(o => o.id === org.id))
          orgs.push(org);
        this.getChildrenOrganizations(allOrgs, org, orgs);
      });
    }

    return orgs;
  }

  public getMeasuresAggregationsForMeasureType(type: string): any[] {
    return this.measuresAggregations.filter(aggregation => !aggregation.excludedMeasureType.includes(type));
  }

  public getMeasuresOperationsForMeasureType(type: string): any[] {
    return this.measuresOperations.filter(operation => !operation.excludedMeasureType.includes(type));
  }

  public getChartAggregations(): any[] {
    return this.chartAggregations;
  }

  public createCsvContent(seriesNames: string[], indices: Index[], measures: Measures[]): string {
    let csvData: any[] = [];
    let csvHeaders: string[] = ['Time'];
    let csvValues: any[] = [];
    let i: number = 0;
    if (indices && (indices.length > 0)) {
      indices.forEach((index: Index) => {
        if (index.result && (index.result.length > 0)) {
          if (!index.decimals && (index.decimals !== 0))
            index.decimals = 2;
          csvHeaders.push(index.name);
          index.result.forEach(measure => {
            if (!Number.isNaN(parseFloat(measure.value))) {
              let at = new Date(measure.at);
              let tv = csvValues.find(v => v.time == at.getTime());
              if (tv)
                tv.measures.push({ key: i, value: parseFloat(parseFloat(measure.value.toString()).toFixed(index.decimals)) });
              else
                csvValues.push({ time: at.getTime(), measures: [{ key: i, value: parseFloat(parseFloat(measure.value.toString()).toFixed(index.decimals)) }]});
            }
          })
        }
        i++;
      });
    }
    if (measures && (measures.length > 0)) {
      measures.forEach(m => {
        if (m.measures) {
          let drainColumnName = (((seriesNames.length > i) && seriesNames[i]) ? seriesNames[i] : m.drain_name) + ((m.unit && (m.unit !== '?')) ? ' (' + m.unit + ')' : '');
          if (!m.decimals && (m.decimals !== 0))
            m.decimals = 2;
          csvHeaders.push(drainColumnName);
          m.measures.forEach(measure => {
            if ((measure.value !== null) && (measure.value !== undefined) && !Number.isNaN(parseFloat(measure.value.toString()))) {
              let time = new Date(measure.time);
              let tv = csvValues.find(v => v.time == time.getTime());
              if (tv)
                tv.measures.push({ key: i, value: parseFloat(parseFloat(measure.value.toString()).toFixed(m.decimals)) });
              else
                csvValues.push({ time: time.getTime(), measures: [{ key: i, value: parseFloat(parseFloat(measure.value.toString()).toFixed(m.decimals)) }]});
            }
          });
        }
        i++;
      });
    }
    csvData[0] = csvHeaders;
    csvValues.sort((a, b) => a.time < b.time ? -1 : a.time > b.time ? 1 : 0);
    csvValues.forEach(tv => {
      let csvRow = [this.getLocaleDateTimeStringWithSeconds(tv.time)];
      for (let j = 0; j < i; j++) {
        let m = tv['measures'].find((v: any) => v.key === j);
        csvRow.push(m !== undefined ? m.value.toString().replace('.', ',') : '');
      }
      csvData.push(csvRow);
    });

    let csvContent = 'data:text/csv;charset=utf-8,';
    csvData.forEach(line => {
      csvContent += encodeURIComponent(line.join(";") + "\n");
    });

    return csvContent;
  }

  public createLinkToShare(costsDrain: Drain, dataDrain: any, indices: Index[], form: FormGroup): string {
    let queryParams: string = '';
    if (costsDrain)
      queryParams += 'costsDrain=' + costsDrain.id + '&';
    if (dataDrain && dataDrain.drainIds)
      queryParams += 'drainIds=' + dataDrain.drainIds.toString() + '&';
    if (dataDrain && dataDrain.nodeIds)
      queryParams += 'nodeIds=' + dataDrain.nodeIds.toString() + '&';
    if (dataDrain && dataDrain.excludeOutliers)
      queryParams += 'excludeOutliers=' + dataDrain.excludeOutliers.toString() + '&';
    if (dataDrain && dataDrain.positiveNegativeValues)
      queryParams += 'positiveNegativeValues=' + dataDrain.positiveNegativeValues.toString() + '&';
    if (dataDrain && dataDrain.aggregations)
      queryParams += 'aggregations=' + dataDrain.aggregations.toString() + '&';
    if (dataDrain && dataDrain.operations)
      queryParams += 'operations=' + dataDrain.operations.toString() + '&';
    if (dataDrain && dataDrain.legends)
      queryParams += 'legends=' + encodeURIComponent(dataDrain.legends.toString()) + '&';
    if (indices && (indices.length > 0)) {
      let indexIds: number[] = [];
      indices.forEach((index: Index) => {
        indexIds.push(index.id);
      })
      queryParams += 'indexIds=' + indexIds.toString() + '&';
    }
    let start_time = new Date(moment(form.get('startTime').value).toISOString());
    if (start_time)
      queryParams += 'startTime=' + this.getDateTimeForUrl(new Date(start_time), true) + '&';
    let end_time = new Date(moment(form.get('endTime').value).toISOString());
    if (end_time)
      queryParams += 'endTime=' + this.getDateTimeForUrl(new Date(end_time), true) + '&';
    if (form.get('timeAggregation') && form.get('timeAggregation').value)
      queryParams += 'timeAggregation=' + form.get('timeAggregation').value + '&';
    if (form.get('costsAggregation') && form.get('costsAggregation').value)
      queryParams += 'costsAggregation=' + form.get('costsAggregation').value + '&';
    if (form.get('chartType') && form.get('chartType').value)
      queryParams += 'chartType=' + form.get('chartType').value + '&';
    if (form.get('showMarkers') && form.get('showMarkers').value)
      queryParams += 'showMarkers=' + form.get('showMarkers').value + '&';
    if (form.get('chartAggregation') && form.get('chartAggregation').value)
      queryParams += 'chartAggregation=' + form.get('chartAggregation').value + '&';
    if (form.get('color1') && form.get('color1').value)
      queryParams += 'color1=' + encodeURIComponent(form.get('color1').value) + '&';
    if (form.get('color2') && form.get('color2').value)
      queryParams += 'color2=' + encodeURIComponent(form.get('color2').value) + '&';
    if (form.get('color3') && form.get('color3').value)
      queryParams += 'color3=' + encodeURIComponent(form.get('color3').value) + '&';
    if (form.get('warningValue') && form.get('warningValue').value)
      queryParams += 'warningValue=' + form.get('warningValue').value + '&';
    if (form.get('alarmValue') && form.get('alarmValue').value)
      queryParams += 'alarmValue=' + form.get('alarmValue').value + '&';

    return window.location.protocol + '//' + window.location.host + window.location.pathname + '#/' + (costsDrain ? 'costs' : 'measures') + '?' + queryParams;
  }
}
