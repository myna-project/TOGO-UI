import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  templateUrl: './message-dialog.component.html'
})
export class MessageDialogComponent implements OnInit {

  type: string = 'error';
  title: string;
  message: string;
  buttonText: string;

  constructor(public dialogRef: MatDialogRef<MessageDialogComponent>, @Inject(MAT_DIALOG_DATA) private data: MessageDialogModel) {
    if (this.data.type)
      this.type = this.data.type;
    this.title = this.data.title;
    this.message = this.data.message;
    this.buttonText = this.data.buttonText;
  }

  ngOnInit() {}
}

export class MessageDialogModel {

  constructor(public type: string, public title: string, public message: string, public buttonText: string) {}
}
