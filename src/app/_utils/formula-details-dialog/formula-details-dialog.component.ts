import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

export interface FormulaDetailsDialogData {
  details: any[];
}

@Component({
  templateUrl: './formula-details-dialog.component.html',
})
export class FormulaDetailsDialogComponent {

  details: any[];

  constructor(public dialogRef: MatDialogRef<FormulaDetailsDialogData>, @Inject(MAT_DIALOG_DATA) private data: FormulaDetailsDialogData) {}

  ngOnInit() {
    this.details = this.data.details;
  }
}
