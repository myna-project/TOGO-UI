import { Location } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { DomSanitizer } from '@angular/platform-browser';
import { TranslateService } from '@ngx-translate/core';

import { AppComponent } from '../app.component';

import { User } from '../_models/user';

import { AuthenticationService } from '../_services/authentication.service';
import { UsersService } from '../_services/users.service';

import { HttpUtils } from '../_utils/http.utils';

@Component({
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {

  isLoading: boolean = true;
  isSaving: boolean = false;
  user: User = new User();
  user_avatar: any;
  user_avatar_show: any;
  profileForm: FormGroup;
  changePassword: boolean = false;
  drainTreeDepths: any[] = [];

  constructor(public myapp: AppComponent, private authService: AuthenticationService, private usersService: UsersService, private location: Location, private sanitizer: DomSanitizer, private httpUtils: HttpUtils, private translate: TranslateService) {}

  ngOnInit(): void {
    this.translate.get('PROFILE.ORG').subscribe( (org: string) => {
      this.drainTreeDepths.push({ id: 'org', description: org });
      this.translate.get('PROFILE.CLIENTFATHER').subscribe((clientFather: string) => {
        this.drainTreeDepths.push({ id: 'clientFather', description: clientFather });
        this.translate.get('PROFILE.CLIENTCHILD').subscribe((clientChild: string) => {
          this.drainTreeDepths.push({ id: 'clientChild', description: clientChild })
          this.translate.get('PROFILE.FEED').subscribe((feed: string) => {
            this.drainTreeDepths.push({ id: 'feed', description: feed });
            this.translate.get('PROFILE.DRAINS').subscribe((drain: string) => {
              this.drainTreeDepths.push({ id:'drain', description: drain })
            });
          });
        });
      });
    });

    this.createForm();
    let currentUser = this.authService.getCurrentUser();
    if (currentUser !== null) {
      this.usersService.getUsersByUsername(currentUser.username).subscribe({
        next: (users: User[]) => {
          this.user = users.filter(u => u.username === currentUser.username)[0];
          this.user.style = this.user.style ? this.user.style : 'purple';
          if (this.user.avatar)
            this.user_avatar_show = this.sanitizer.bypassSecurityTrustUrl('data:image/jpg;base64,' + this.user.avatar);
          this.createForm();
          this.isLoading = false;
        },
        error: (error: any) => {
          if (error.status !== 401) {
            const dialogRef = this.httpUtils.errorDialog(error);
            dialogRef.afterClosed().subscribe((_value: any) => {
              this.goBack();
            });
          }
        }
      });
    }
  }

  get name() { return this.profileForm.get('name'); }
  get surname() { return this.profileForm.get('surname'); }
  get lang() { return this.profileForm.get('lang'); }
  get old_password() { return this.profileForm.get('old_password'); }
  get password() { return this.profileForm.get('password'); }
  get confirmPassword() { return this.profileForm.get('confirmPassword'); }
  get default_start() { return this.profileForm.get('default_start'); }
  get default_end() { return this.profileForm.get('default_end'); }
  get drain_tree_depth() { return this.profileForm.get('drain_tree_depth'); }
  get dark_mode() { return this.profileForm.get('dark_mode'); }

  createForm() {
    this.profileForm = new FormGroup({
      'name': new FormControl({ value: this.user.name, disabled: true }, []),
      'surname': new FormControl({ value: this.user.surname, disabled: true }, []),
      'lang': new FormControl(this.user.lang, []),
      'default_start': new FormControl(this.user.default_start ? new Date(this.user.default_start) : undefined, []),
      'default_end': new FormControl(this.user.default_end ? new Date(this.user.default_end) : undefined, []),
      'drain_tree_depth': new FormControl(this.user.drain_tree_depth ? this.user.drain_tree_depth : 'org', [ Validators.required ]),
      'dark_mode': new FormControl(this.user.dark_theme ? this.user.dark_theme : false, [ Validators.required ])
    });
    if (this.changePassword) {
      this.profileForm.addControl('old_password', new FormControl('', [ Validators.required ]));
      this.profileForm.addControl('password', new FormControl('', [ Validators.required ]));
      this.profileForm.addControl('confirmPassword', new FormControl('', [ Validators.required ]));
      this.profileForm.setValidators([ this.passwordChangedValidator, this.passwordMatchValidator ]);
    }
    this.profileForm.get('dark_mode').valueChanges.subscribe((d: boolean) => {
      this.user.dark_theme = d;
      this.changeStyle(this.user.style);
    });
  }

  onPasswordInput() {
    if (this.password.value !== '') {
      if (this.profileForm.hasError('passwordNotChanged'))
        this.password.setErrors([{ 'passwordNotChanged': true }]);
      else
        this.password.setErrors(null);
    }

    if (this.profileForm.hasError('passwordMismatch'))
      this.confirmPassword.setErrors([{ 'passwordMismatch': true }]);
    else
      this.confirmPassword.setErrors(null);
  }

  passwordChangedValidator(frm: FormGroup) {
    return frm.controls['password'].value === frm.controls['old_password'].value ? { 'passwordNotChanged': true } : null;
  }

  passwordMatchValidator(frm: FormGroup) {
    return frm.controls['password'].value === frm.controls['confirmPassword'].value ? null : { 'passwordMismatch': true };
  }

  onSelectImage(event: any) {
    if (event.target.files && event.target.files[0]) {
      var reader = new FileReader();

      reader.onload = (event) => {
        this.user_avatar_show = event.target.result;
      }

      reader.onloadend = (_e) => {
        this.user_avatar = reader.result;
        this.user_avatar = this.user_avatar.substring(this.user_avatar.lastIndexOf(",") + 1);
        this.myapp.changeAvatar(this.user_avatar);
      }

      reader.readAsDataURL(event.target.files[0]);
    }
  }

  changeStyle(newStyle: string) {
    this.user.style = newStyle;
    this.myapp.changeStyle(this.user);
  }

  save(): void {
    this.isSaving = true;
    let newUser: User = this.profileForm.value;
    if (this.user.id !== undefined) {
      newUser.id = this.user.id;
      newUser.username = this.user.username;
      newUser.name = this.user.name;
      newUser.surname = this.user.surname;
      newUser.lang = this.profileForm.get('lang').value;
      newUser.email = this.user.email;
      newUser.enabled = this.user.enabled;
      newUser.role_ids = this.user.role_ids;
      newUser.avatar = this.user_avatar;
      newUser.default_start = this.default_start.value;
      newUser.default_end = this.default_end.value;
      newUser.drain_tree_depth = this.drain_tree_depth.value;
      newUser.style = this.user.style;
	  newUser.dark_theme = this.dark_mode.value;
      this.usersService.updateUser(newUser).subscribe({
        next: (_response: User) => {
          this.user = newUser;
          this.isSaving = false;
          if (this.user.lang)
            this.myapp.changeLanguage(this.user.lang);
          this.myapp.changeDefaultDatesAndDepth(newUser.default_start, newUser.default_end, newUser.drain_tree_depth);
          this.profileForm.markAsUntouched();
          this.httpUtils.successSnackbar(this.translate.instant('PROFILE.SAVED'));
        },
        error: (error: any) => {
          this.isSaving = false;
          if (error.status !== 401)
            this.httpUtils.errorDialog(error);
        }
      });
    }
  }

  goBack(): void {
    this.location.back();
  }
}
