import { FlatTreeControl } from '@angular/cdk/tree';
import { Location } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatTreeFlatDataSource, MatTreeFlattener } from '@angular/material/tree';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { forkJoin } from 'rxjs';

import { Client } from '../../_models/client';
import { Drain } from '../../_models/drain';
import { DrainControl } from '../../_models/draincontrol';
import { DrainControlDetail } from '../../_models/draincontroldetail';
import { Feed } from '../../_models/feed';
import { Formula } from '../../_models/formula';
import { Organization } from '../../_models/organization';
import { TreeItemFlatNode, TreeItemNode } from '../../_models/treenode';

import { ClientsService } from '../../_services/clients.service';
import { DrainsService } from '../../_services/drains.service';
import { DrainControlsService } from '../../_services/draincontrols.service';
import { FeedsService } from '../../_services/feeds.service';
import { FormulasService } from '../../_services/formulas.service';
import { OrganizationsService } from '../../_services/organizations.service';

import { DrainsTreeDialogComponent } from '../../_utils/drains-tree-dialog/drains-tree-dialog.component';
import { FormulasTreeDialogComponent } from '../../_utils/formulas-tree-dialog/formulas-tree-dialog.component';
import { HttpUtils } from '../../_utils/http.utils';
import { OrganizationsTree } from '../../_utils/tree/organizations-tree';

import { MatDialog } from '@angular/material/dialog';

@Component({
  templateUrl: './draincontrol-detail.component.html',
  styleUrls: ['./draincontrol-detail.component.scss'],
  providers: [OrganizationsTree]
})
export class DrainControlComponent implements OnInit {

  isLoading: boolean = true;
  isSaving: boolean = false;
  isDeleting: boolean = false;
  control: DrainControl = new DrainControl();
  ctrl: DrainControl = new DrainControl();
  allOrgs: Organization[];
  allFormulas: Formula[];
  allFeeds: Feed[];
  energyClients: Client[];
  allDrains: Drain[];
  allTypes: string[] = [ 'MISSING', 'MEASUREDIFF', 'THRESHOLD' ];
  invalidCron: boolean = false;
  secondsMinutes: number[] = Array.from({ length: 60 }, (_, index) => index);
  everySecondsMinutes: number[] = Array.from({ length: 60 }, (_, index) => index + 1);
  missingEverySecond: boolean = false;
  missingStartingSecond: boolean = false;
  missingSelectedSeconds: boolean = false;
  missingFromSecond: boolean = false;
  missingToSecond: boolean = false;
  endSecondGreater: boolean = false;
  missingEveryMinute: boolean = false;
  missingStartingMinute: boolean = false;
  missingSelectedMinutes: boolean = false;
  missingFromMinute: boolean = false;
  missingToMinute: boolean = false;
  endMinuteGreater: boolean = false;
  hours: number[] = Array.from({ length: 24 }, (_, index) => index);
  everyHours: number[] = Array.from({ length: 24 }, (_, index) => index + 1);
  missingEveryHour: boolean = false;
  missingStartingHour: boolean = false;
  missingSelectedHours: boolean = false;
  missingFromHour: boolean = false;
  missingToHour: boolean = false;
  endHourGreater: boolean = false;
  everyMonthDays: number[] = Array.from({ length: 31 }, (_, index) => index + 1);
  missingEveryDayMonth: boolean = false;
  missingStartingDayMonth: boolean = false;
  missingSelectedDaysMonth: boolean = false;
  missingBeforeDays: boolean = false;
  missingNearestDay: boolean = false;
  everyWeekDays: number[] = Array.from({ length: 7 }, (_, index) => index + 1);
  missingEveryDayWeek: boolean = false;
  missingStartingDayWeek: boolean = false;
  missingSelectedDaysWeek: boolean = false;
  missingLastDayWeek: boolean = false;
  missingDayCounter: boolean = false;
  missingWeekdayCounter: boolean = false;
  everyMonths: number[] = Array.from({ length: 12 }, (_, index) => index + 1);
  missingEveryMonth: boolean = false;
  missingStartingMonth: boolean = false;
  missingSelectedMonths: boolean = false;
  missingFromMonth: boolean = false;
  missingToMonth: boolean = false;
  endMonthGreater: boolean = false;
  dataDetails: any = { orgs: [], clients: [], feeds: [], drains: [], formulas: [] };
  waitingMeasures: any = {};
  measuresAggregations: any[] = [];
  controlForm: FormGroup;
  group: any = {};
  backRoute: string = 'draincontrols';

  flatNodeMap = new Map<TreeItemFlatNode, TreeItemNode>();
  nestedNodeMap = new Map<TreeItemNode, TreeItemFlatNode>();
  treeControl: FlatTreeControl<TreeItemFlatNode>;
  treeFlattener: MatTreeFlattener<TreeItemNode, TreeItemFlatNode>;
  dataSource: MatTreeFlatDataSource<TreeItemNode, TreeItemFlatNode>;

  constructor(private drainControlsService: DrainControlsService, private orgsService: OrganizationsService, private clientsService: ClientsService, private feedsService: FeedsService, private drainsService: DrainsService, private formulasService: FormulasService, private organizationsTree: OrganizationsTree, private route: ActivatedRoute, private router: Router, private location: Location, private dialog: MatDialog, private httpUtils: HttpUtils, private translate: TranslateService) {}

  ngOnInit() {
    this.measuresAggregations = this.httpUtils.getMeasuresAggregationsForMeasureType('f');
    this.createForm();
    this.route.paramMap.subscribe((params: any) => {
      var controlId = +params.get('id');
      this.orgsService.getOrganizations().subscribe({
        next: (orgs: Organization[]) => {
          this.allOrgs = orgs;
          if (controlId) {
            this.treeFlattener = new MatTreeFlattener(this.transformer, this.getLevel, this.isExpandable, this.getChildren);
            this.treeControl = new FlatTreeControl<TreeItemFlatNode>(this.getLevel, this.isExpandable);
            this.dataSource = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener);

            forkJoin([this.formulasService.getFormulas(), this.clientsService.getClients(), this.feedsService.getFeeds(), this.drainsService.getDrains(), this.drainControlsService.getDrainControl(controlId)]).subscribe({
              next: (results: any) => {
                this.allFormulas = results[0];
                this.allFormulas = this.allFormulas.filter((formula: Formula) => formula.operators.filter(o => o === 'SEMICOLON').length === 1);
                this.energyClients = results[1].filter((c: Client) => c.energy_client);
                this.allFeeds = results[2];
                this.allDrains = results[3];
                this.ctrl = Object.assign({}, results[4]);
                this.control = results[4];
                if (this.control.cron_second.match("/")) {
                  let seconds = this.control.cron_second.split("/");
                  this.control.starting_second = +seconds[0];
                  this.control.every_second = +seconds[1];
                  this.control.cron_second = '/';
                } else if (this.control.cron_second.match("-")) {
                  let seconds = this.control.cron_second.split("-");
                  this.control.from_second = +seconds[0];
                  this.control.to_second = +seconds[1];
                  this.control.cron_second = '-';
                } else {
                  let seconds = this.control.cron_second.split(",");
                  seconds.forEach(second => {
                    if (this.control.selected_seconds && (this.control.selected_seconds.length > 0))
                      this.control.selected_seconds.push(+second);
                    else
                      this.control.selected_seconds = [+second];
                  });
                  this.control.cron_second = 'n';
                }
                if (this.control.cron_minute.match("/")) {
                  let minutes = this.control.cron_minute.split("/");
                  this.control.starting_minute = +minutes[0];
                  this.control.every_minute = +minutes[1];
                  this.control.cron_minute = '/';
                } else if (this.control.cron_minute.match("-")) {
                  let minutes = this.control.cron_minute.split("-");
                  this.control.from_minute = +minutes[0];
                  this.control.to_minute = +minutes[1];
                  this.control.cron_minute = '-';
                } else if (!(this.control.cron_minute.charAt(0) === '*')) {
                  let minutes = this.control.cron_minute.split(",");
                  minutes.forEach(minute => {
                    if (this.control.selected_minutes && (this.control.selected_minutes.length > 0))
                      this.control.selected_minutes.push(+minute);
                    else
                      this.control.selected_minutes = [+minute];
                  });
                  this.control.cron_minute = 'n';
                }
                if (this.control.cron_hour.match("/")) {
                  let hours = this.control.cron_hour.split("/");
                  this.control.starting_hour = +hours[0];
                  this.control.every_hour = +hours[1];
                  this.control.cron_hour = '/';
                } else if (this.control.cron_hour.match("-")) {
                  let hours = this.control.cron_hour.split("-");
                  this.control.from_hour = +hours[0];
                  this.control.to_hour = +hours[1];
                  this.control.cron_hour = '-';
                } else if (!(this.control.cron_hour.charAt(0) === '*')) {
                  let hours = this.control.cron_hour.split(",");
                  hours.forEach(hour => {
                    if (this.control.selected_hours && (this.control.selected_hours.length > 0))
                      this.control.selected_hours.push(+hour);
                    else
                      this.control.selected_hours = [+hour];
                  });
                  this.control.cron_hour = 'n';
                }
                this.control.cron_day = '*';
                if (this.control.cron_day_month.match("/")) {
                  let days = this.control.cron_day_month.split("/");
                  this.control.starting_day_month = +days[0];
                  this.control.every_day_month = +days[1];
                  this.control.cron_day = 'M/';
                } else if (this.control.cron_day_month.charAt(0) === 'L') {
                  this.control.cron_day = this.control.cron_day_month;
                  if (this.control.cron_day_month.match("-")) {
                    let days = this.control.cron_day_month.split("-");
                    this.control.days_before = +days[1];
                    this.control.cron_day = '-';
                  }
                } else if (this.control.cron_day_month.match("W")) {
                  let days = this.control.cron_day_month.split("W");
                  this.control.nearest_day = +days[0];
                  this.control.cron_day = 'W';
                } else if (!(this.control.cron_day_month.charAt(0) === '*') && !(this.control.cron_day_month.charAt(0) === '?')) {
                  let days = this.control.cron_day_month.split(",");
                  days.forEach(day => {
                    if (this.control.selected_days_month && (this.control.selected_days_month.length > 0))
                      this.control.selected_days_month.push(+day);
                    else
                      this.control.selected_days_month = [+day];
                  });
                  this.control.cron_day = 'Mn';
                }
                if (this.control.cron_day_week.match("/")) {
                  let days = this.control.cron_day_week.split("/");
                  this.control.starting_day_week = days[0];
                  this.control.every_day_week = +days[1];
                  this.control.cron_day = 'W/';
                } else if (this.control.cron_day_week.match("L")) {
                  let days = this.control.cron_day_week.split("L");
                  this.control.last_weekday = days[0];
                  this.control.cron_day = 'nL';
                } else if (this.control.cron_day_week.match("#")) {
                  let days = this.control.cron_day_week.split("#");
                  this.control.day_counter = days[1];
                  this.control.weekday_counter = days[0];
                  this.control.cron_day = '#';
                } else if (!(this.control.cron_day_week.charAt(0) === '*') && !(this.control.cron_day_week.charAt(0) === '?')) {
                  let days = this.control.cron_day_week.split(",");
                  days.forEach(day => {
                    if (this.control.selected_days_week && (this.control.selected_days_week.length > 0))
                      this.control.selected_days_week.push(day);
                    else
                      this.control.selected_days_week = [day];
                  });
                  this.control.cron_day = 'Wn';
                }
                if (this.control.cron_month.match("/")) {
                  let months = this.control.cron_month.split("/");
                  this.control.starting_month = +months[0];
                  this.control.every_month = +months[1];
                  this.control.cron_month = '/';
                } else if (this.control.cron_month.match("-")) {
                  let months = this.control.cron_month.split("-");
                  this.control.from_month = +months[0];
                  this.control.to_month = +months[1];
                  this.control.cron_month = '-';
                } else if (!(this.control.cron_month.charAt(0) === '*')) {
                  let months = this.control.cron_month.split(",");
                  months.forEach(month => {
                    if (this.control.selected_months && (this.control.selected_months.length > 0))
                      this.control.selected_months.push(month);
                    else
                      this.control.selected_months = [month];
                  });
                  this.control.cron_month = 'n';
                }
                this.createForm();
                if (this.control.details) {
                  this.control.details.forEach(detail => {
                    if (detail.drain_id) {
                      this.organizationsTree.selectDrain(this.dataDetails, this.allOrgs, this.energyClients, this.allFeeds, this.allDrains, detail.drain_id);
                      if (this.control.type === 'MEASUREDIFF')
                        this.waitingMeasures['d_' + detail.drain_id] = detail.waiting_measures;
                      this.createDetailControl(detail);
                    } else {
                      this.organizationsTree.selectFormula(this.dataDetails, this.allOrgs, this.energyClients, this.allFormulas, detail.formula_id);
                      if (this.control.type === 'MEASUREDIFF')
                        this.waitingMeasures['f_' + detail.formula_id] = detail.waiting_measures;
                      this.createDetailControl(detail);
                    }
                  });
                  this.buildDetailTree();
                }
                this.isLoading = false;
              },
              error: (error: any) => {
                if (error.status !== 401) {
                  const dialogRef = this.httpUtils.errorDialog(error);
                  dialogRef.afterClosed().subscribe((_value: any) => {
                    this.router.navigate([this.backRoute]);
                  });
                }
              }
            });
          } else {
            this.isLoading = false;
          }
        },
        error: (error: any) => {
          if (error.status !== 401) {
            const dialogRef = this.httpUtils.errorDialog(error);
            dialogRef.afterClosed().subscribe((_value: any) => {
              this.router.navigate([this.backRoute]);
            });
          }
        }
      });
    });
  }

  getLevel = (node: TreeItemFlatNode) => node.level;

  isExpandable = (node: TreeItemFlatNode) => node.expandable;

  getChildren = (node: TreeItemNode): TreeItemNode[] => node.children;

  hasChild = (_: number, _nodeData: TreeItemFlatNode) => _nodeData.expandable;

  transformer = (node: TreeItemNode, level: number) => {
    const existingNode = this.nestedNodeMap.get(node);
    const flatNode = existingNode && existingNode.item === node.item ? existingNode : new TreeItemFlatNode();
    flatNode.id = node.id;
    flatNode.type = node.type;
    flatNode.item = node.item;
    flatNode.full_name = node.full_name;
    flatNode.level = level;
    flatNode.code = node.code;
    flatNode.expandable = node.children && node.children.length > 0;
    this.flatNodeMap.set(flatNode, node);
    this.nestedNodeMap.set(node, flatNode);
    this.treeControl.expand(flatNode);
    return flatNode;
  }

  buildDetailTree() {
    this.dataSource.data = this.organizationsTree.getTreeData(this.dataDetails.orgs, [], this.dataDetails.clients, this.dataDetails.feeds, this.dataDetails.drains, this.dataDetails.formulas, [], [], [], []);
  }

  get name() { return this.controlForm.get('name'); }
  get organization() { return this.controlForm.get('organization'); }
  get type() { return this.controlForm.get('type'); }
  get mail_receivers() { return this.controlForm.get('mail_receivers'); }
  get cron_second() { return this.controlForm.get('cron_second'); }
  get every_second() { return this.controlForm.get('every_second'); }
  get starting_second() { return this.controlForm.get('starting_second'); }
  get selected_seconds() { return this.controlForm.get('selected_seconds'); }
  get from_second() { return this.controlForm.get('from_second'); }
  get to_second() { return this.controlForm.get('to_second'); }
  get cron_minute() { return this.controlForm.get('cron_minute'); }
  get every_minute() { return this.controlForm.get('every_minute'); }
  get starting_minute() { return this.controlForm.get('starting_minute'); }
  get selected_minutes() { return this.controlForm.get('selected_minutes'); }
  get from_minute() { return this.controlForm.get('from_minute'); }
  get to_minute() { return this.controlForm.get('to_minute'); }
  get cron_hour() { return this.controlForm.get('cron_hour'); }
  get every_hour() { return this.controlForm.get('every_hour'); }
  get starting_hour() { return this.controlForm.get('starting_hour'); }
  get selected_hours() { return this.controlForm.get('selected_hours'); }
  get from_hour() { return this.controlForm.get('from_hour'); }
  get to_hour() { return this.controlForm.get('to_hour'); }
  get cron_day() { return this.controlForm.get('cron_day'); }
  get every_day_month() { return this.controlForm.get('every_day_month'); }
  get starting_day_month() { return this.controlForm.get('starting_day_month'); }
  get selected_days_month() { return this.controlForm.get('selected_days_month'); }
  get every_day_week() { return this.controlForm.get('every_day_week'); }
  get starting_day_week() { return this.controlForm.get('starting_day_week'); }
  get selected_days_week() { return this.controlForm.get('selected_days_week'); }
  get last_weekday() { return this.controlForm.get('last_weekday'); }
  get days_before() { return this.controlForm.get('days_before'); }
  get nearest_day() { return this.controlForm.get('nearest_day'); }
  get day_counter() { return this.controlForm.get('day_counter'); }
  get weekday_counter() { return this.controlForm.get('weekday_counter'); }
  get cron_month() { return this.controlForm.get('cron_month'); }
  get every_month() { return this.controlForm.get('every_month'); }
  get starting_month() { return this.controlForm.get('starting_month'); }
  get selected_months() { return this.controlForm.get('selected_months'); }
  get from_month() { return this.controlForm.get('from_month'); }
  get to_month() { return this.controlForm.get('to_month'); }
  get last_minutes() { return this.controlForm.get('last_minutes'); }
  get delta() { return this.controlForm.get('delta'); }
  get aggregation() { return this.controlForm.get('aggregation'); }
  get low_threshold() { return this.controlForm.get('low_threshold'); }
  get high_threshold() { return this.controlForm.get('high_threshold'); }
  get active() { return this.controlForm.get('active'); }

  createForm() {
    let patterns = this.httpUtils.getPatterns();
    this.group['name'] = new FormControl(this.control.name, [ Validators.required ]);
    this.group['organization'] = new FormControl({ value: this.control.org_id ? this.allOrgs.filter(org => (org.id === this.control.org_id))[0] : undefined, disabled: (this.control.id !== undefined) }, [ Validators.required ]);
    this.group['type'] = new FormControl({ value: this.control.type, disabled: (this.control.id !== undefined) }, [ Validators.required ]);
    this.group['mail_receivers'] = new FormControl(this.control.mail_receivers, [ Validators.required ]);
    this.group['cron_second'] = new FormControl(this.control.cron_second, [ Validators.required ]);
    this.group['every_second'] = new FormControl(this.control.every_second, []);
    this.group['starting_second'] = new FormControl(this.control.starting_second, []);
    this.group['selected_seconds'] = new FormControl(this.control.selected_seconds, []);
    this.group['from_second'] = new FormControl(this.control.from_second, []);
    this.group['to_second'] = new FormControl(this.control.to_second, []);
    this.group['cron_minute'] = new FormControl(this.control.cron_minute, [ Validators.required ]);
    this.group['every_minute'] = new FormControl(this.control.every_minute, []);
    this.group['starting_minute'] = new FormControl(this.control.starting_minute, []);
    this.group['selected_minutes'] = new FormControl(this.control.selected_minutes, []);
    this.group['from_minute'] = new FormControl(this.control.from_minute, []);
    this.group['to_minute'] = new FormControl(this.control.to_minute, []);
    this.group['cron_hour'] = new FormControl(this.control.cron_hour, [ Validators.required ]);
    this.group['every_hour'] = new FormControl(this.control.every_hour, []);
    this.group['starting_hour'] = new FormControl(this.control.starting_hour, []);
    this.group['selected_hours'] = new FormControl(this.control.selected_hours, []);
    this.group['from_hour'] = new FormControl(this.control.from_hour, []);
    this.group['to_hour'] = new FormControl(this.control.to_hour, []);
    this.group['cron_day'] = new FormControl(this.control.cron_day, [ Validators.required ]);
    this.group['every_day_month'] = new FormControl(this.control.every_day_month, []);
    this.group['starting_day_month'] = new FormControl(this.control.starting_day_month, []);
    this.group['selected_days_month'] = new FormControl(this.control.selected_days_month, []);
    this.group['every_day_week'] = new FormControl(this.control.every_day_week, []);
    this.group['starting_day_week'] = new FormControl(this.control.starting_day_week, []);
    this.group['selected_days_week'] = new FormControl(this.control.selected_days_week, []);
    this.group['last_weekday'] = new FormControl(this.control.last_weekday, []);
    this.group['days_before'] = new FormControl(this.control.days_before, []);
    this.group['nearest_day'] = new FormControl(this.control.nearest_day, []);
    this.group['day_counter'] = new FormControl(this.control.day_counter, []);
    this.group['weekday_counter'] = new FormControl(this.control.weekday_counter, []);
    this.group['cron_month'] = new FormControl(this.control.cron_month, [ Validators.required ]);
    this.group['every_month'] = new FormControl(this.control.every_month, []);
    this.group['starting_month'] = new FormControl(this.control.starting_month, []);
    this.group['selected_months'] = new FormControl(this.control.selected_months, []);
    this.group['from_month'] = new FormControl(this.control.from_month, []);
    this.group['to_month'] = new FormControl(this.control.to_month, []);
    this.group['last_minutes'] = new FormControl(undefined, [ Validators.pattern(patterns.positiveInteger) ]);
    this.group['delta'] = new FormControl(undefined, [ Validators.pattern(patterns.positivePerc) ]);
    this.group['aggregation'] = new FormControl(undefined, []);
    this.group['low_threshold'] = new FormControl(undefined, [ Validators.pattern(patterns.positiveNegativeFloat) ]);
    this.group['high_threshold'] = new FormControl(undefined, [ Validators.pattern(patterns.positiveNegativeFloat) ]);
    this.group['active'] = new FormControl(undefined, []);
    this.controlForm = new FormGroup(this.group);
    this.controlForm.get('cron_second').valueChanges.subscribe((cron: string) => {
      this.missingEverySecond = ((cron === '/') && !this.every_second.value) ? true : false;
      this.missingStartingSecond = ((cron === '/') && (this.starting_second.value === null)) ? true : false;
      this.missingSelectedSeconds = ((cron === 'n') && (!this.selected_seconds.value || (this.selected_seconds.value.length == 0))) ? true : false;
      this.missingFromSecond = ((cron === '-') && (this.from_second.value === null)) ? true : false;
      this.missingToSecond = ((cron === '-') && (this.to_second.value === null)) ? true : false;
      this.invalidCron = this.checkCron();
    });
    this.controlForm.get('every_second').valueChanges.subscribe((s: string) => {
      this.missingEverySecond = ((this.cron_second.value === '/') && !s) ? true : false;
      this.invalidCron = this.checkCron();
    });
    this.controlForm.get('starting_second').valueChanges.subscribe((s: string) => {
      this.missingStartingSecond = ((this.cron_second.value === '/') && (s === null)) ? true : false;
      this.invalidCron = this.checkCron();
    });
    this.controlForm.get('selected_seconds').valueChanges.subscribe((s: string) => {
      this.missingSelectedSeconds = ((this.cron_second.value === 'n') && (!s || (s.length == 0))) ? true : false;
      this.invalidCron = this.checkCron();
    });
    this.controlForm.get('from_second').valueChanges.subscribe((s: string) => {
      let endSecond = this.controlForm.get('to_second').value;
      this.missingFromSecond = ((this.cron_second.value === '-') && (s === null)) ? true : false;
      if (endSecond) {
        this.endSecondGreater = (s > endSecond);
      }
      this.invalidCron = this.checkCron();
    });
    this.controlForm.get('to_second').valueChanges.subscribe((s: string) => {
      let startSecond = this.controlForm.get('from_second').value;
      this.missingToSecond = ((this.cron_second.value === '-') && (s === null)) ? true : false;
      if (startSecond) {
        this.endSecondGreater = ( startSecond > s);
      }
      this.invalidCron = this.checkCron();
    });
    this.controlForm.get('cron_minute').valueChanges.subscribe((cron: string) => {
      this.missingEveryMinute = ((cron === '/') && !this.every_minute.value) ? true : false;
      this.missingStartingMinute = ((cron === '/') && (this.starting_minute.value === null)) ? true : false;
      this.missingSelectedMinutes = ((cron === 'n') && (!this.selected_minutes.value || (this.selected_minutes.value.length == 0))) ? true : false;
      this.missingFromMinute = ((cron === '-') && (this.from_minute.value === null)) ? true : false;
      this.missingToMinute = ((cron === '-') && (this.to_minute.value === null)) ? true : false;
      this.invalidCron = this.checkCron();
    });
    this.controlForm.get('every_minute').valueChanges.subscribe((m: string) => {
      this.missingEveryMinute = ((this.cron_minute.value === '/') && !m) ? true : false;
      this.invalidCron = this.checkCron();
    });
    this.controlForm.get('starting_minute').valueChanges.subscribe((m: string) => {
      this.missingStartingMinute = ((this.cron_minute.value === '/') && (m === null)) ? true : false;
      this.invalidCron = this.checkCron();
    });
    this.controlForm.get('selected_minutes').valueChanges.subscribe((m: string) => {
      this.missingSelectedMinutes = ((this.cron_minute.value === 'n') && (!m || (m.length == 0))) ? true : false;
      this.invalidCron = this.checkCron();
    });
    this.controlForm.get('from_minute').valueChanges.subscribe((m: string) => {
      let endMinute = this.controlForm.get('to_minute').value;
      this.missingFromMinute = ((this.cron_minute.value === '-') && (m === null)) ? true : false;
      if (endMinute) {
        this.endMinuteGreater = (m >= endMinute);
      }
      this.invalidCron = this.checkCron();
    });
    this.controlForm.get('to_minute').valueChanges.subscribe((m: string) => {
      let startMinute = this.controlForm.get('from_minute').value;
      this.missingToMinute = ((this.cron_minute.value === '-') && (m === null)) ? true : false;
      if (startMinute) {
        this.endMinuteGreater = (startMinute >= m);
      }
      this.invalidCron = this.checkCron();
    });
    this.controlForm.get('cron_hour').valueChanges.subscribe((cron: string) => {
      this.missingEveryHour = ((cron === '/') && !this.every_hour.value) ? true : false;
      this.missingStartingHour = ((cron === '/') && (this.starting_hour.value === null)) ? true : false;
      this.missingSelectedHours = ((cron === 'n') && (!this.selected_hours.value || (this.selected_hours.value.length == 0))) ? true : false;
      this.missingFromHour = ((cron === '-') && (this.from_hour.value === null)) ? true : false;
      this.missingToHour = ((cron === '-') && (this.to_hour.value === null)) ? true : false;
      this.invalidCron = this.checkCron();
    });
    this.controlForm.get('every_hour').valueChanges.subscribe((h: string) => {
      this.missingEveryHour = ((this.cron_hour.value === '/') && !h) ? true : false;
      this.invalidCron = this.checkCron();
    });
    this.controlForm.get('starting_hour').valueChanges.subscribe((h: string) => {
      this.missingStartingHour = ((this.cron_hour.value === '/') && (h === null)) ? true : false;
      this.invalidCron = this.checkCron();
    });
    this.controlForm.get('selected_hours').valueChanges.subscribe((h: string) => {
      this.missingSelectedHours = ((this.cron_hour.value === 'n') && (!h || (h.length == 0))) ? true : false;
      this.invalidCron = this.checkCron();
    });
    this.controlForm.get('from_hour').valueChanges.subscribe((h: string) => {
      let endHour = this.controlForm.get('to_hour').value;
      this.missingFromHour = ((this.cron_hour.value === '-') && (h === null)) ? true : false;
      if (endHour) {
        this.endHourGreater = (h >= endHour);
      }
      this.invalidCron = this.checkCron();
    });
    this.controlForm.get('to_hour').valueChanges.subscribe((h: string) => {
      let startHour = this.controlForm.get('from_hour').value;
      this.missingToHour = ((this.cron_hour.value === '-') && (h === null)) ? true : false;
      if (startHour) {
        this.endHourGreater = (startHour >= h);
      }
      this.invalidCron = this.checkCron();
    });
    this.controlForm.get('cron_day').valueChanges.subscribe((cron: string) => {
      this.missingEveryDayWeek = ((cron === 'W/') && !this.every_day_week.value) ? true : false;
      this.missingStartingDayWeek = ((cron === 'W/') && !this.starting_day_week.value) ? true : false;
      this.missingEveryDayMonth = ((cron === 'M/') && !this.every_day_month.value) ? true : false;
      this.missingStartingDayMonth = ((cron === 'M/') && !this.starting_day_month.value) ? true : false;
      this.missingSelectedDaysWeek = ((cron === 'Wn') && (!this.selected_days_week.value || (this.selected_days_week.value.length == 0))) ? true : false;
      this.missingSelectedDaysMonth = ((cron === 'Mn') && (!this.selected_days_month.value || (this.selected_days_month.value.length == 0))) ? true : false;
      this.missingLastDayWeek = ((cron === 'nL') && !this.last_weekday.value) ? true : false;
      this.missingBeforeDays = ((cron === '-') && !this.days_before.value) ? true : false;
      this.missingNearestDay = ((cron === 'W') && !this.nearest_day.value) ? true : false;
      this.missingDayCounter = ((cron === '#') && !this.day_counter.value) ? true : false;
      this.missingWeekdayCounter = ((cron === '#') && !this.weekday_counter.value) ? true : false;
      this.invalidCron = this.checkCron();
    });
    this.controlForm.get('every_day_week').valueChanges.subscribe((d: string) => {
      this.missingEveryDayWeek = ((this.cron_day.value === 'W/') && !d) ? true : false;
      this.invalidCron = this.checkCron();
    });
    this.controlForm.get('starting_day_week').valueChanges.subscribe((d: string) => {
      this.missingStartingDayWeek = ((this.cron_day.value === 'W/') && !d) ? true : false;
      this.invalidCron = this.checkCron();
    });
    this.controlForm.get('every_day_month').valueChanges.subscribe((d: string) => {
      this.missingEveryDayMonth = ((this.cron_day.value === 'M/') && !d) ? true : false;
      this.invalidCron = this.checkCron();
    });
    this.controlForm.get('starting_day_month').valueChanges.subscribe((d: string) => {
      this.missingStartingDayMonth = ((this.cron_day.value === 'M/') && !d) ? true : false;
      this.invalidCron = this.checkCron();
    });
    this.controlForm.get('selected_days_week').valueChanges.subscribe((d: string) => {
      this.missingSelectedDaysWeek = ((this.cron_day.value === 'Wn') && (!d || (d.length == 0))) ? true : false;
      this.invalidCron = this.checkCron();
    });
    this.controlForm.get('selected_days_month').valueChanges.subscribe((d: string) => {
      this.missingSelectedDaysMonth = ((this.cron_day.value === 'Mn') && (!d || (d.length == 0))) ? true : false;
      this.invalidCron = this.checkCron();
    });
    this.controlForm.get('last_weekday').valueChanges.subscribe((d: string) => {
      this.missingLastDayWeek = ((this.cron_day.value === 'nL') && !d) ? true : false;
      this.invalidCron = this.checkCron();
    });
    this.controlForm.get('days_before').valueChanges.subscribe((d: string) => {
      this.missingBeforeDays = ((this.cron_day.value === '-') && !d) ? true : false;
      this.invalidCron = this.checkCron();
    });
    this.controlForm.get('nearest_day').valueChanges.subscribe((d: string) => {
      this.missingNearestDay = ((this.cron_day.value === 'W') && !d) ? true : false;
      this.invalidCron = this.checkCron();
    });
    this.controlForm.get('day_counter').valueChanges.subscribe((d: string) => {
      this.missingDayCounter = ((this.cron_day.value === '#') && !d) ? true : false;
      this.invalidCron = this.checkCron();
    });
    this.controlForm.get('weekday_counter').valueChanges.subscribe((d: string) => {
      this.missingWeekdayCounter = ((this.cron_day.value === '#') && !d) ? true : false;
      this.invalidCron = this.checkCron();
    });
    this.controlForm.get('cron_month').valueChanges.subscribe((cron: string) => {
      this.missingEveryMonth = ((cron === '/') && !this.every_month.value) ? true : false;
      this.missingStartingMonth = ((cron === '/') && !this.starting_month.value) ? true : false;
      this.missingSelectedMonths = ((cron === 'n') && (!this.selected_months.value || (this.selected_months.value.length == 0))) ? true : false;
      this.missingFromMonth = ((cron === '-') && !this.from_month.value) ? true : false;
      this.missingToMonth = ((cron === '-') && !this.to_month.value) ? true : false;
      this.invalidCron = this.checkCron();
    });
    this.controlForm.get('every_month').valueChanges.subscribe((m: string) => {
      this.missingEveryMonth = ((this.cron_month.value === '/') && !m) ? true : false;
      this.invalidCron = this.checkCron();
    });
    this.controlForm.get('starting_month').valueChanges.subscribe((m: string) => {
      this.missingStartingMonth = ((this.cron_month.value === '/') && !m) ? true : false;
      this.invalidCron = this.checkCron();
    });
    this.controlForm.get('selected_months').valueChanges.subscribe((m: string) => {
      this.missingSelectedMonths = ((this.cron_month.value === 'n') && (!m || (m.length == 0))) ? true : false;
      this.invalidCron = this.checkCron();
    });
    this.controlForm.get('from_month').valueChanges.subscribe((m: string) => {
      let endMonth = this.controlForm.get('to_month').value;
      this.missingFromMonth = ((this.cron_month.value === '-') && !m) ? true : false;
      if (endMonth) {
        this.endMonthGreater = (+m >= +endMonth);
      }
      this.invalidCron = this.checkCron();
    });
    this.controlForm.get('to_month').valueChanges.subscribe((m: string) => {
      let startMonth = this.controlForm.get('from_month').value;
      this.missingToMonth = ((this.cron_month.value === '-') && !m) ? true : false;
      if(startMonth) {
        this.endMonthGreater = (+startMonth >= +m);
      }
      this.invalidCron = this.checkCron();
    });
    this.controlForm.get('last_minutes').valueChanges.subscribe((minute: number) => {
      if (this.ctrl.details) {
        this.ctrl.details.forEach(detail => {
          detail.last_minutes = minute;
          this.controlForm.patchValue({ ['last_minutes_' + (detail.drain_id ? 'd_' + detail.drain_id : 'f_' + detail.formula_id)]: minute });
        });
      }
    });
    this.controlForm.get('delta').valueChanges.subscribe((delta: number) => {
      if (this.ctrl.details) {
        this.ctrl.details.forEach(detail => {
          detail.delta = delta;
          this.controlForm.patchValue({ ['delta_' + (detail.drain_id ? 'd_' + detail.drain_id : 'f_' + detail.formula_id)]: delta });
        });
      }
    });
    this.controlForm.get('aggregation').valueChanges.subscribe((aggregation: string) => {
      if (this.ctrl.details) {
        this.ctrl.details.forEach(detail => {
          detail.aggregation = aggregation;
          this.controlForm.patchValue({ ['aggregation_' + (detail.drain_id ? 'd_' + detail.drain_id : 'f_' + detail.formula_id)]: aggregation });
        });
      }
    });
    this.controlForm.get('low_threshold').valueChanges.subscribe((low_threshold: number) => {
      if (this.ctrl.details) {
        this.ctrl.details.forEach(detail => {
          detail.low_threshold = low_threshold;
          this.controlForm.patchValue({ ['low_threshold_' + (detail.drain_id ? 'd_' + detail.drain_id : 'f_' + detail.formula_id)]: low_threshold });
        });
      }
    });
    this.controlForm.get('high_threshold').valueChanges.subscribe((high_threshold: number) => {
      if (this.ctrl.details) {
        this.ctrl.details.forEach(detail => {
          detail.high_threshold = high_threshold;
          this.controlForm.patchValue({ ['high_threshold_' + (detail.drain_id ? 'd_' + detail.drain_id : 'f_' + detail.formula_id)]: high_threshold });
        });
      }
    });
    this.controlForm.get('active').valueChanges.subscribe((active: boolean) => {
      if (this.ctrl.details) {
        this.ctrl.details.forEach(detail => {
          detail.active = active;
          this.controlForm.patchValue({ ['active_' + (detail.drain_id ? 'd_' + detail.drain_id : 'f_' + detail.formula_id)]: active });
        });
      }
    });
  }

  createDetailControl(detail: DrainControlDetail): void {
    let patterns = this.httpUtils.getPatterns();
    let key = detail.drain_id ? 'd_' + detail.drain_id : 'f_' + detail.formula_id;
    this.group['last_minutes_' + key] = new FormControl(detail ? detail.last_minutes : 60, [ Validators.required, Validators.pattern(patterns.positiveInteger) ]);
    if (this.control.type === 'MEASUREDIFF') {
      this.group['delta_' + key] = new FormControl(detail ? detail.delta : 100, [ Validators.required, Validators.pattern(patterns.positivePerc) ]);
    }
    if (this.control.type === 'THRESHOLD') {
      this.group['aggregation_' + key] = new FormControl(detail ? detail.aggregation : 'AVG', [ Validators.required ]);
      this.group['low_threshold_' + key] = new FormControl(detail ? detail.low_threshold : undefined, [ Validators.pattern(patterns.positiveNegativeFloat) ]);
      this.group['high_threshold_' + key] = new FormControl(detail ? detail.high_threshold : undefined, [ Validators.pattern(patterns.positiveNegativeFloat) ]);
    }
    this.group['active_' + key] = new FormControl(detail ? detail.active : true, []);
  }

  compareObjects(o1: any, o2: any): boolean {
    return (o2 != null) && (o1.id === o2.id);
  }

  checkCron(): boolean {
    return this.missingEverySecond || this.missingStartingSecond || this.missingSelectedSeconds || this.missingFromSecond || this.missingToSecond || this.endSecondGreater || this.missingEveryMinute || this.missingStartingMinute || this.missingSelectedMinutes || this.missingFromMinute || this.missingToMinute || this.endMinuteGreater || this.missingEveryHour || this.missingStartingHour || this.missingSelectedHours || this.missingFromHour || this.missingToHour || this.endHourGreater || this.missingEveryDayWeek || this.missingStartingDayWeek || this.missingEveryDayMonth || this.missingStartingDayMonth || this.missingSelectedDaysWeek || this.missingSelectedDaysMonth || this.missingLastDayWeek || this.missingBeforeDays || this.missingNearestDay || this.missingDayCounter || this.missingWeekdayCounter || this.missingEveryMonth || this.missingStartingMonth || this.missingSelectedMonths || this.missingFromMonth || this.missingToMonth || this.endMonthGreater;
  }

  addDrains(): void {
    let controlOrgs: Organization[] = [this.allOrgs.find(o => o.id === this.control.org_id)];
    controlOrgs = this.httpUtils.getChildrenOrganizations(this.allOrgs, this.allOrgs.find(o => o.id === this.control.org_id), controlOrgs);
    const dialogRef = this.dialog.open(DrainsTreeDialogComponent, { width: '75%', data: { orgs: controlOrgs, clients: this.energyClients, feeds: this.allFeeds, drains: this.allDrains, formulas: [] } });
    dialogRef.afterClosed().subscribe((result: any[]) => {
      if (result) {
        let component = this;
        result.forEach(function (drain: any) {
          let newDetail: DrainControlDetail = new DrainControlDetail();
          newDetail.drain_id = drain.id;
          newDetail.active = true;
          newDetail.delta = (component.control.type === 'MEASUREDIFF') ? 100 : null;
          component.createDetailControl(newDetail);
          if (component.ctrl.details)
            component.ctrl.details.push(newDetail);
          else
            component.ctrl.details = [newDetail];
          component.organizationsTree.selectDrain(component.dataDetails, component.allOrgs, component.energyClients, component.allFeeds, component.allDrains, drain.id);
        });
        this.buildDetailTree();
      }
    });
  }

  removeDrain(drain_id: number): void {
    const dialogRef = this.httpUtils.confirmDelete(this.translate.instant('DRAINCONTROL.REMOVEDETAILCONFIRM'));
    dialogRef.afterClosed().subscribe((dialogResult: any) => {
      if (dialogResult) {
        this.organizationsTree.removeDrain(this.dataDetails, drain_id);
        this.buildDetailTree();
      }
    });
  }

  addFormulas(): void {
    let component = this;
    let data = { orgs: [], clients: [], formulas: [] };
    this.allFormulas.forEach((formula: Formula) => {
      this.organizationsTree.selectFormula(data, component.allOrgs.filter(o => o.id === this.control.org_id), component.energyClients.filter(c => c.org_id === this.control.org_id), component.allFormulas, formula.id);
    });
    const dialogRef = this.dialog.open(FormulasTreeDialogComponent, { width: '75%', data: { orgs: data.orgs, clients: data.clients, formulas: data.formulas } });
    dialogRef.afterClosed().subscribe((result: any[]) => {
      if (result) {
        let component = this;
        result.forEach(function (formula: any) {
          let newDetail: DrainControlDetail = new DrainControlDetail();
          newDetail.formula_id = formula.id;
          newDetail.active = true;
          newDetail.delta = (component.control.type === 'MEASUREDIFF') ? 100 : null;
          component.createDetailControl(newDetail);
          if (component.ctrl.details)
            component.ctrl.details.push(newDetail);
          else
            component.ctrl.details = [newDetail];
          component.organizationsTree.selectFormula(component.dataDetails, component.allOrgs, component.energyClients, component.allFormulas, formula.id);
        });
        this.buildDetailTree();
      }
    });
  }

  removeFormula(formula_id: number): void {
    const dialogRef = this.httpUtils.confirmDelete(this.translate.instant('DRAINCONTROL.REMOVEDETAILCONFIRM'));
    dialogRef.afterClosed().subscribe((dialogResult: any) => {
      if (dialogResult) {
        this.organizationsTree.removeFormula(this.dataDetails, formula_id);
        this.buildDetailTree();
      }
    });
  }

  clearWaitingMeasures(id: number, type: string): void {
    const dialogRef = this.httpUtils.confirmDelete(this.translate.instant(id ? 'DRAINCONTROL.CLEARSINGLEWAITINGMEASURECONFIRM' : 'DRAINCONTROL.CLEARWAITINGMEASURECONFIRM'));
    dialogRef.afterClosed().subscribe((dialogResult: any) => {
      if (dialogResult) {
        this.isSaving = true;
        this.ctrl.details.forEach(detail => {
          if ((id === undefined) || ((type === 'drain') && (id === detail.drain_id)) || ((type === 'formula') && (id === detail.formula_id)))
            detail.waiting_measures = 0;
        });
        this.drainControlsService.updateDrainControl(this.ctrl).subscribe({
          next: (_response: any) => {
            this.isSaving = false;
            this.httpUtils.successSnackbar(this.translate.instant('DRAINCONTROL.CLEARED'));
            if (id !== undefined)
              delete this.waitingMeasures[((type === 'drain') ? 'd_' : 'f_') + id];
            else
              this.waitingMeasures = {};
          },
          error: (error: any) => {
            this.isSaving = false;
            if (error.status !== 401)
              this.httpUtils.errorDialog(error);
          }
        });
      }
    });
  }

  save(): void {
    this.isSaving = true;
    let newControl: DrainControl = new DrainControl();
    newControl.name = this.name.value;
    newControl.mail_receivers = this.mail_receivers.value;
    if (this.cron_second.value === "/") {
      newControl.cron_second = this.starting_second.value + '/' + this.every_second.value;
    } else if (this.cron_second.value === "-") {
      newControl.cron_second = this.from_second.value + '-' + this.to_second.value;
    } else {
      newControl.cron_second = this.selected_seconds.value.toString();
    }
    newControl.cron_minute = '*';
    if (this.cron_minute.value === "/") {
      newControl.cron_minute = this.starting_minute.value + '/' + this.every_minute.value;
    } else if (this.cron_minute.value === "-") {
      newControl.cron_minute = this.from_minute.value + '-' + this.to_minute.value;
    } else if (this.cron_minute.value !== '*') {
      newControl.cron_minute = this.selected_minutes.value.toString();
    }
    newControl.cron_hour = '*';
    if (this.cron_hour.value === "/") {
      newControl.cron_hour = this.starting_hour.value + '/' + this.every_hour.value;
    } else if (this.cron_hour.value === "-") {
      newControl.cron_hour = this.from_hour.value + '-' + this.to_hour.value;
    } else if (this.cron_hour.value !== '*') {
      newControl.cron_hour = this.selected_hours.value.toString();
    }
    newControl.cron_day_month = '?';
    newControl.cron_day_week = '*';
    if (this.cron_day.value === "W/") {
      newControl.cron_day_month = '?';
      newControl.cron_day_week = this.starting_day_week.value + '/' + this.every_day_week.value;
    } else if (this.cron_day.value === "M/") {
      newControl.cron_day_month = this.starting_day_month.value + '/' + this.every_day_month.value;
      newControl.cron_day_week = '?';
    } else if (this.cron_day.value === "Wn") {
      newControl.cron_day_month = '?';
      newControl.cron_day_week = this.selected_days_week.value.toString();
    } else if (this.cron_day.value === "Mn") {
      newControl.cron_day_month = this.selected_days_month.value.toString();
      newControl.cron_day_week = '?';
    } else if ((this.cron_day.value === "L") || (this.cron_day.value === "LW")) {
      newControl.cron_day_month = this.cron_day.value;
      newControl.cron_day_week = '?';
    } else if (this.cron_day.value === "nL") {
      newControl.cron_day_month = '?';
      newControl.cron_day_week = this.last_weekday.value + 'L';
    } else if (this.cron_day.value === "-") {
      newControl.cron_day_month = 'L-' + this.days_before.value;
      newControl.cron_day_week = '?';
    } else if (this.cron_day.value === "W") {
      newControl.cron_day_month = this.nearest_day.value + 'W';
      newControl.cron_day_week = '?';
    } else if (this.cron_day.value === "#") {
      newControl.cron_day_month = '?';
      newControl.cron_day_week = this.weekday_counter.value + '#' + this.day_counter.value;
    }
    newControl.cron_month = '*';
    if (this.cron_month.value === "/") {
      newControl.cron_month = this.starting_month.value + '/' + this.every_month.value;
    } else if (this.cron_month.value === "-") {
      newControl.cron_month = this.from_month.value + '-' + this.to_month.value;
    } else if (this.cron_month.value !== '*') {
      newControl.cron_month = this.selected_months.value.toString();
    }
    let component = this;
    if (this.dataDetails && this.dataDetails.drains) {
      this.dataDetails.drains.forEach(function (drain: any) {
        let newDetail: DrainControlDetail = new DrainControlDetail();
        newDetail.drain_id = drain.id;
        newDetail.aggregation = 'AVG';
        newDetail.last_minutes = component.controlForm.get('last_minutes_d_' + drain.id).value;
        if (component.control.type === 'MEASUREDIFF')
          newDetail.delta = component.controlForm.get('delta_d_' + drain.id).value;
        if (component.control.type === 'THRESHOLD') {
          newDetail.aggregation = component.controlForm.get('aggregation_d_' + drain.id).value;
          newDetail.low_threshold = component.controlForm.get('low_threshold_d_' + drain.id).value;
          newDetail.high_threshold = component.controlForm.get('high_threshold_d_' + drain.id).value;
        }
        newDetail.active = component.controlForm.get('active_d_' + drain.id).value;
        if (newControl.details && newControl.details.length > 0)
          newControl.details.push(newDetail);
        else
          newControl.details = [newDetail];
      });
    }
    if (this.dataDetails && this.dataDetails.formulas) {
      this.dataDetails.formulas.forEach(function (formula: any) {
        let newDetail: DrainControlDetail = new DrainControlDetail();
        newDetail.formula_id = formula.id;
        newDetail.aggregation = 'AVG';
        newDetail.last_minutes = component.controlForm.get('last_minutes_f_' + formula.id).value;
        if (component.control.type === 'MEASUREDIFF')
          newDetail.delta = component.controlForm.get('delta_f_' + formula.id).value;
        if (component.control.type === 'THRESHOLD') {
          newDetail.aggregation = component.controlForm.get('aggregation_f_' + formula.id).value;
          newDetail.low_threshold = component.controlForm.get('low_threshold_f_' + formula.id).value;
          newDetail.high_threshold = component.controlForm.get('high_threshold_f_' + formula.id).value;
        }
        newDetail.active = component.controlForm.get('active_f_' + formula.id).value;
        if (newControl.details && newControl.details.length > 0)
          newControl.details.push(newDetail);
        else
          newControl.details = [newDetail];
      });
    }
    if (this.control.id !== undefined) {
      newControl.id = this.control.id;
      newControl.org_id = this.control.org_id;
      newControl.type = this.control.type;
      this.drainControlsService.updateDrainControl(newControl).subscribe({
        next: (_response: any) => {
          this.isSaving = false;
          this.httpUtils.successSnackbar(this.translate.instant('DRAINCONTROL.SAVED'));
          this.router.navigate([this.backRoute]);
        },
        error: (error: any) => {
          this.isSaving = false;
          if (error.status !== 401)
            this.httpUtils.errorDialog(error);
        }
      });
    } else {
      newControl.org_id = this.organization.value ? this.organization.value.id : undefined;
      newControl.type = this.type.value;
      this.drainControlsService.createDrainControl(newControl).subscribe({
        next: (response: any) => {
          this.isSaving = false;
          this.ctrl = Object.assign({}, response);
          this.httpUtils.successSnackbar(this.translate.instant('DRAINCONTROL.SAVED'));
          this.router.navigate(['draincontrol/' + response.id]);
        },
        error: (error: any) => {
          this.isSaving = false;
          if (error.status !== 401)
            this.httpUtils.errorDialog(error);
        }
      });
    }
  }

  delete(): void {
    const dialogRef = this.httpUtils.confirmDelete(this.translate.instant('DRAINCONTROL.DELETECONFIRM'));
    dialogRef.afterClosed().subscribe((dialogResult: any) => {
      if (dialogResult) {
        this.isDeleting = true;
        this.drainControlsService.deleteDrainControl(this.control).subscribe({
          next: (_response: any) => {
            this.isDeleting = false;
            this.httpUtils.successSnackbar(this.translate.instant('DRAINCONTROL.DELETED'));
            this.router.navigate([this.backRoute]);
          },
          error: (error: any) => {
            this.isDeleting = false;
            if (error.status !== 401)
              this.httpUtils.errorDialog(error);
          }
        });
      }
    });
  }

  goBack(): void {
    this.location.back();
  }
}
