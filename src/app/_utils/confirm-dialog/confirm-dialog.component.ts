import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  templateUrl: './confirm-dialog.component.html'
})
export class ConfirmDialogComponent implements OnInit {

  message: string;
  confirmButtonText: string;
  cancelButtonText: string;

  constructor(public dialogRef: MatDialogRef<ConfirmDialogComponent>, @Inject(MAT_DIALOG_DATA) private data: ConfirmDialogModel) {
    this.message = this.data.message;
    this.confirmButtonText = this.data.confirmButtonText;
    this.cancelButtonText = this.data.cancelButtonText;
  }

  ngOnInit() {}

  onConfirm(): void {
    this.dialogRef.close(true);
  }

  onDismiss(): void {
    this.dialogRef.close(false);
  }
}

export class ConfirmDialogModel {

  constructor(public message: string, public confirmButtonText: string, public cancelButtonText: string) {
  }
}
