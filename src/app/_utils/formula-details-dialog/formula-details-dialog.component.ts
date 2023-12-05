import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { Formula } from '../../_models/formula';

export interface FormulaDetailsDialogData {
  formula: Formula;
}

@Component({
  templateUrl: './formula-details-dialog.component.html',
})
export class FormulaDetailsDialogComponent {

  formula: Formula;

  constructor(public dialogRef: MatDialogRef<FormulaDetailsDialogData>, @Inject(MAT_DIALOG_DATA) private data: FormulaDetailsDialogData) {}

  ngOnInit() {
    this.formula = this.data.formula;
  }
}
