import { Component, AfterViewInit, ElementRef, HostListener, OnDestroy, ViewChild } from '@angular/core';
import { Buffer } from 'buffer';

import * as moment from 'moment';

import { MeasuresService } from '../_services/measures.service';

import { HttpUtils } from '../_utils/http.utils';

import { environment } from '../../environments/environment';

@Component({
  templateUrl: './synopticdashboard.component.html'
})
export class SynopticDashboardComponent implements AfterViewInit, OnDestroy {

  @ViewChild('canvas', { static: false }) public canvas: ElementRef;

  @HostListener('window:resize', ['$event'])
  onResize(_event: any) {
    this.setupCanvas();
  }

  image: any = new Image();
  interval: any;
  canvasElementRef: HTMLCanvasElement;
  cx: CanvasRenderingContext2D;
  last_updated: string;

  constructor(private measuresService: MeasuresService, private httpUtils: HttpUtils) {}

  ngAfterViewInit(): void {
    this.canvasElementRef = this.canvas.nativeElement;
    this.setupCanvas();
    this.interval = setInterval(() => {
      this.setupCanvas();
    }, 180000);
  }

  ngOnDestroy() {
    clearInterval(this.interval);
  }

  setupCanvas(): void {
    this.canvasElementRef.width = window.screen.width * 0.95;
    this.cx = this.canvasElementRef.getContext('2d');
    this.image.onload = () => {
      this.canvasElementRef.height = this.canvasElementRef.width * (this.image.height / this.image.width) - 150;
      const svg = /\.svg$/g;
      if (environment.synopticImage.match(svg)) {
        this.canvasElementRef.height = window.screen.height * 0.95;
      }
      this.cx.drawImage(this.image, 0, 0, this.canvasElementRef.width, this.canvasElementRef.height);

      let end_time = new Date(moment().toISOString());
      environment.synopticData.forEach(data => {
        this.cx.beginPath();
        let x = this.canvasElementRef.width * data.x / 100;
        let y = this.canvasElementRef.height * data.y / 100;
        let width = this.canvasElementRef.width * data.width / 100;
        let height = this.canvasElementRef.height * data.height / 100;

        let svgData = '<svg class="mh6 vat" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + data.imgWidth + ' ' + data.imgHeight + '" width="' + data.imgWidth + '" height="' + data.imgHeight + '">';
        svgData += '<style> .mh6 { max-height: 6rem } .vat { vertical-align: top } .ff { font-family: Verdana, sans-serif } .lsxs { letter-spacing: 0.2em } </style>';
        svgData += '<rect x="1" y="1" width="' + (data.imgWidth/3 - 2) + '" height="' + (data.imgHeight - 2) + '" stroke="black" stroke-width="1px" fill="' + data.titleBGColor + '"/>';
        svgData += '<rect x="' + data.imgWidth/3 + '" y="1" width="' + (data.imgWidth * 2/3 - 2) + '" height="' + (data.imgHeight - 2) + '" stroke="black" stroke-width="1px" fill="' + data.linesBGColor + '"/>';
        let k = 0;
        data.title.forEach(function (t: any) {
          svgData += '<text class="ff lsxs" font-size="' + t.size + '" font-weight="' + t.weight + '" text-anchor="middle" x="' + data.imgWidth/6 + '" y="'+ ((data.title.length == 1) ? data.imgHeight/2 : ((data.title.length == 2) ? data.imgHeight * ((k + 1)/(data.title.length + 1) + 0.005) : data.imgHeight * ((k + 1)/(data.title.length) - 0.1))) + '">' + t.line + '</text>';
          k++;
        });
        let start_time: Date = new Date(moment().add(data.lastN * -1, (data.last == 'HOUR') ? 'hour' : 'month').toISOString());
        this.measuresService.getMeasures(data.drains, '', '', data.aggregations, data.operations, this.httpUtils.getDateTimeForUrl(start_time, true), this.httpUtils.getDateTimeForUrl(end_time, true), data.timeAggregation).subscribe({
          next: (measures: any[]) => {
            let i = 0;
            measures.forEach(m => {
              let lineY = ((data.lines.length == 1) ? data.imgHeight/2 : ((data.lines.length == 2) ? data.imgHeight * ((i + 1)/(data.lines.length) + 0.005) : data.imgHeight * ((i + 1)/(data.lines.length) - 0.1)));
              svgData += '<text class="ff lsxs" font-size="' + data.lines[i].descriptionSize + '" font-weight="' + data.lines[i].weight + '" x="' + (data.imgWidth/3 + 3) + '" y="'+ lineY + '" fill="' + data.lines[i].color + '">' + data.lines[i].description + '</text>';
              svgData += '<text class="ff lsxs" font-size="' + data.lines[i].unitSize + '" font-weight="' + data.lines[i].weight + '" x="' + (data.imgWidth * 0.67) + '" y="'+ lineY + '" fill="' + data.lines[i].color + '" text-anchor="middle">' + m.unit + '</text>';
              svgData += '<text class="ff lsxs" font-size="' + data.lines[i].valueSize + '" font-weight="' + data.lines[i].weight + '" x="' + (data.imgWidth - 3) + '" y="'+ lineY + '" fill="' + data.lines[i].color + '" text-anchor="end">' + ((m.measures.length > 0) ? parseFloat(m.measures[m.measures.length - 1].value.toString()).toFixed(2) : '-') + '</text>';
              i++;
            });
            svgData += '</svg>';
            const svg64 = Buffer.from(svgData, 'binary').toString('base64');

            let svgImage = new Image();
            svgImage.onload = () => {
              this.cx.drawImage(svgImage, x, y, width, height);
            };
            svgImage.src = 'data:image/svg+xml;base64,' + svg64;
            this.last_updated = this.httpUtils.getLocaleDateTimeString(moment().toISOString());
          },
          error: (error: any) => {
            if (error.status !== 401)
              this.httpUtils.errorDialog(error);
          }
        });
      });
    };

    this.image.src = './assets/img/' + environment.synopticImage;
  }
}
