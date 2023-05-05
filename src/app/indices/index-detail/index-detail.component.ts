import { Location } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { forkJoin } from 'rxjs';

import { Formula } from '../../_models/formula';
import { Index } from '../../_models/index';
import { IndexGroup } from '../../_models/indexgroup';
import { Organization } from '../../_models/organization';

import { FormulasService } from '../../_services/formulas.service';
import { IndexGroupsService } from '../../_services/indexgroups.service';
import { IndicesService } from '../../_services/indices.service';
import { OrganizationsService } from '../../_services/organizations.service';

import { HttpUtils } from '../../_utils/http.utils';

@Component({
  templateUrl: './index-detail.component.html',
  styleUrls: ['./index-detail.component.scss']
})
export class IndexComponent implements OnInit {

  isLoading: boolean = true;
  isSaving: boolean = false;
  isDeleting: boolean = false;
  index: Index = new Index();
  org: Organization = new Organization();
  grp: IndexGroup = new IndexGroup();
  allOrgs: Organization[];
  allGroups: IndexGroup[];
  allFormulas: Formula[];
  orgGroups: IndexGroup[];
  orgFormulas: Formula[];
  lastSemicolon: boolean = true;
  indexForm: FormGroup;
  groupForm: any = {};
  elementCounter: number[] = [];
  counter: number = 0;
  backRoute: string = 'indices';

  constructor(private indicesService: IndicesService, private orgsService: OrganizationsService, private indexGroupsService: IndexGroupsService, private formulasService: FormulasService, private route: ActivatedRoute, private router: Router, private location: Location, private httpUtils: HttpUtils, private translate: TranslateService) {}

  ngOnInit() {
    this.createForm();
    this.route.paramMap.subscribe((params: any) => {
      var indexId = +params.get('id');
      forkJoin(this.orgsService.getOrganizations(), this.formulasService.getFormulas(), this.indexGroupsService.getIndexGroups()).subscribe(
        (results: any) => {
          this.allOrgs = results[0];
          this.allFormulas = results[1];
          this.allGroups = results[2];
          if (indexId) {
            this.indicesService.getIndex(indexId).subscribe(
              (index: Index) => {
                this.index = index;
                this.org = this.allOrgs.filter(o => (o.id === index.org_id))[0];
                if (index.group)
                  this.grp = this.allGroups.filter(group => (group.id === index.group.id))[0];
                this.orgGroups = this.allGroups.filter(group => (group.org_id === index.org_id));
                this.orgFormulas = this.allFormulas.filter(formula => formula.org_id === index.org_id);
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
          } else {
            this.createFormulaControls(null, this.counter, null);
            this.isLoading = false;
          }
        },
        (error: any) => {
          const dialogRef = this.httpUtils.errorDialog(error);
          dialogRef.afterClosed().subscribe((_value: any) => {
            this.router.navigate([this.backRoute]);
          });
        }
      );
    });
  }

  get name() { return this.indexForm.get('name'); }
  get organization() { return this.indexForm.get('organization'); }
  get group() { return this.indexForm.get('group'); }
  get coefficient() { return this.indexForm.get('coefficient'); }
  get measure_unit() { return this.indexForm.get('measure_unit'); }
  get decimals() { return this.indexForm.get('decimals'); }
  get min_value() { return this.indexForm.get('min_value'); }
  get max_value() { return this.indexForm.get('max_value'); }
  get warning_value() { return this.indexForm.get('warning_value'); }
  get alarm_value() { return this.indexForm.get('alarm_value'); }

  createForm() {
    let patterns = this.httpUtils.getPatterns();
    this.groupForm['name'] = new FormControl(this.index.name, [ Validators.required ]);
    this.groupForm['organization'] = new FormControl({ value: this.index.org_id ? this.allOrgs.filter(org => (org.id === this.index.org_id))[0] : undefined, disabled: this.disabledCondition()}, [ Validators.required ]);
    this.groupForm['group'] = new FormControl(this.index.group ? this.allGroups.filter(group => (group.id === this.index.group.id))[0] : undefined, []);
    this.groupForm['coefficient'] = new FormControl(this.index.coefficient, [ Validators.pattern(patterns.positiveNegativeFloat) ]);
    this.groupForm['measure_unit'] = new FormControl(this.index.measure_unit, []);
    this.groupForm['decimals'] = new FormControl(this.index.decimals, [ Validators.pattern(patterns.positiveInteger) ]);
    this.groupForm['min_value'] = new FormControl(this.index.min_value, [ Validators.pattern(patterns.positiveNegativeFloat) ]);
    this.groupForm['max_value'] = new FormControl(this.index.max_value, [ Validators.pattern(patterns.positiveNegativeFloat) ]);
    this.groupForm['warning_value'] = new FormControl(this.index.warning_value, [ Validators.pattern(patterns.positiveNegativeFloat) ]);
    this.groupForm['alarm_value'] = new FormControl(this.index.alarm_value, [ Validators.pattern(patterns.positiveNegativeFloat) ]);
    this.indexForm = new FormGroup(this.groupForm);
    if (this.index.formula_elements) {
      let k: number = 0;
      this.index.formula_elements.forEach(element => {
        this.createFormulaControls(element, this.counter, this.index.operators[k]);
        k++;
      });
    }
    this.indexForm.get('organization').valueChanges.subscribe((o: Organization) => {
      this.orgGroups = this.allGroups.filter(group => (group.org_id === o.id));
      this.orgFormulas = this.allFormulas.filter(formula => (formula.org_id === o.id));
      this.indexForm.patchValue({ group: undefined });
      this.elementCounter.forEach(i => {
        this.indexForm.get('formula_' + i).setValue(undefined);
      });
    });
  }

  createFormulaControls(element: any, i: number, operator: string): void {
    const patterns = this.httpUtils.getPatterns();
    this.groupForm['formula_' + i ] = new FormControl((element && element.formula_id) ? element.formula_id : undefined, [ Validators.required ]);
    this.groupForm['nSkip_' + i] = new FormControl((element && element.n_skip) ? element.n_skip : null, [ Validators.pattern(patterns.positiveInteger) ]);
    this.groupForm['skipPeriod_' + i] = new FormControl((element && element.skip_period) ? element.skip_period : '', []);
    this.groupForm['operator_' + i] = new FormControl(operator ? operator : 'SEMICOLON', [ Validators.required ]);
    this.indexForm.get('formula_' + i).valueChanges.subscribe((_value: any) => {
      this.indexForm.updateValueAndValidity();
    });
    this.indexForm.get('operator_' + i).valueChanges.subscribe((_value: any) => {
      this.checkLastSemicolon();
      this.indexForm.updateValueAndValidity();
    });
    this.elementCounter.push(this.counter);
    this.counter++;
    this.indexForm.updateValueAndValidity();
  }

  disabledCondition(): boolean {
    return this.index.id !== undefined;
  }

  checkLastSemicolon(): void {
    this.lastSemicolon = (this.indexForm.get('operator_' + (Math. max(... this.elementCounter))) && (this.indexForm.get('operator_' + (Math. max(... this.elementCounter))).value === 'SEMICOLON'));
  }

  addFormula(): void {
    this.createFormulaControls(null, this.counter, null);
    this.checkLastSemicolon();
  }

  deleteFormula(i: number): void {
    this.indexForm.removeControl('formula_' + i);
    this.indexForm.removeControl('nSkip_' + i);
    this.indexForm.removeControl('skipPeriod_' + i);
    this.indexForm.removeControl('operator_' + i);
    this.elementCounter.splice(this.elementCounter.indexOf(i), 1);
    this.checkLastSemicolon();
    this.indexForm.updateValueAndValidity();
  }

  compareObjects(o1: any, o2: any): boolean {
    return (o2 != null) && (o1.id === o2.id);
  }

  save(): void {
    this.isSaving = true;
    let newIndex: Index = new Index();
    newIndex.name = this.name.value;
    newIndex.org_id = this.organization.value ? this.organization.value.id : undefined;
    newIndex.group = this.group.value;
    newIndex.coefficient = this.coefficient.value;
    newIndex.measure_unit = this.measure_unit.value;
    newIndex.decimals = this.decimals.value;
    newIndex.min_value = this.min_value.value;
    newIndex.max_value = this.max_value.value;
    newIndex.warning_value = this.warning_value.value;
    newIndex.alarm_value = this.alarm_value.value;
    newIndex.formula_elements = [];
    newIndex.operators = [];
    this.elementCounter.forEach(n => {
      newIndex.formula_elements.push({ formula_id: this.indexForm.get('formula_' + n).value, n_skip: this.indexForm.get('nSkip_' + n).value, skip_period: (this.indexForm.get('skipPeriod_' + n).value != '') ? this.indexForm.get('skipPeriod_' + n).value : null });
      newIndex.operators.push(this.indexForm.get('operator_' + n).value);
    });
    if (newIndex.operators[newIndex.operators.length - 1] !== 'SEMICOLON')
      this.httpUtils.errorDialog({ status: 499, error: { errorCode: 8499 } });
    if (this.index.id !== undefined) {
      newIndex.id = this.index.id;
      this.indicesService.updateIndex(newIndex).subscribe(
        (_response: Index) => {
          this.isSaving = false;
          this.httpUtils.successSnackbar(this.translate.instant('INDEX.SAVED'));
          this.router.navigate([this.backRoute]);
        },
        (error: any) => {
          this.isSaving = false;
          this.httpUtils.errorDialog(error);
        }
      );
    } else {
      this.indicesService.createIndex(newIndex).subscribe(
        (_response: Index) => {
          this.isSaving = false;
          this.httpUtils.successSnackbar(this.translate.instant('INDEX.SAVED'));
          this.router.navigate([this.backRoute]);
        },
        (error: any) => {
          this.isSaving = false;
          this.httpUtils.errorDialog(error);
        }
      );
    }
  }

  delete(): void {
    const dialogRef = this.httpUtils.confirmDelete(this.translate.instant('INDEX.DELETECONFIRM'));
    dialogRef.afterClosed().subscribe((dialogResult: any) => {
      if (dialogResult) {
        this.isDeleting = true;
        this.indicesService.deleteIndex(this.index).subscribe(
          (_response: any) => {
            this.isDeleting = false;
            this.httpUtils.successSnackbar(this.translate.instant('INDEX.DELETED'));
            this.router.navigate([this.backRoute]);
          },
          (error: any) => {
            this.isDeleting = false;
            this.httpUtils.errorDialog(error);
          }
        );
      }
    });
  }

  goBack(): void {
    this.location.back();
  }
}
