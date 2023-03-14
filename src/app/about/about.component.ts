import { Component, OnInit } from '@angular/core';

import { AboutService } from '../_services/about.service';

import { HttpUtils } from '../_utils/http.utils';

@Component({
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.scss']
})
export class AboutComponent implements OnInit {

  isLoading: boolean = true;
  time: string;
  version: string;

  constructor(private aboutService: AboutService, private httpUtils: HttpUtils) {}

  ngOnInit() {
    this.aboutService.getVersion().subscribe((params: any) => {
      this.version = params.version;
      this.time = this.httpUtils.getLocaleDateTimeString(params.buildtime);
      this.isLoading = false;
    });
  }
}
