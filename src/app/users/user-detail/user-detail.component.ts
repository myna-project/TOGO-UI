import { Location } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';

import { Role } from '../../_models/role';
import { User } from '../../_models/user';

import { RolesService } from '../../_services/roles.service';
import { UsersService } from '../../_services/users.service';

import { HttpUtils } from '../../_utils/http.utils';

@Component({
  templateUrl: './user-detail.component.html',
  styleUrls: ['./user-detail.component.scss']
})
export class UserComponent implements OnInit {

  isLoading: boolean = true;
  isSaving: boolean = false;
  isDeleting: boolean = false;
  allRoles: Role[];
  user: User = new User();
  userForm: FormGroup;
  backRoute: string = 'users';

  constructor(private usersService: UsersService, private rolesService: RolesService, private route: ActivatedRoute, private router: Router, private location: Location, private httpUtils: HttpUtils, private translate: TranslateService) {}

  ngOnInit(): void {
    this.createForm();
    this.route.paramMap.subscribe((params: any) => {
      var userId = params.get('id');
      if (userId) {
        this.usersService.getUser(userId).subscribe(
          (user: User) => {
            this.user = user;
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
        this.isLoading = false;
      }
    });
    this.rolesService.getRoles().subscribe(
      (roles: Role[]) => {
        this.allRoles = roles;
      },
      (error: any) => {
        const dialogRef = this.httpUtils.errorDialog(error);
        dialogRef.afterClosed().subscribe((_value: any) => {
          this.router.navigate([this.backRoute]);
        });
      }
    );
  }

  get username() { return this.userForm.get('username'); }
  get name() { return this.userForm.get('name'); }
  get surname() { return this.userForm.get('surname'); }
  get email() { return this.userForm.get('email'); }
  get password() { return this.userForm.get('password'); }
  get enabled() { return this.userForm.get('enabled'); }
  get role_ids() { return this.userForm.get('role_ids'); }

  createForm() {
    this.userForm = new FormGroup({
      'username': new FormControl(this.user.username, [ Validators.required, Validators.minLength(4) ]),
      'name': new FormControl(this.user.name, []),
      'surname': new FormControl(this.user.surname, []),
      'email': new FormControl(this.user.email, [ Validators.required, Validators.email ]),
      'password': new FormControl({ value: (this.user.id) ? 'fakepwd' : '', disabled: (this.user && this.user.id) ? true : false }, [ Validators.required ]),
      'enabled': new FormControl(this.user.enabled, []),
      'role_ids': new FormControl(this.user.role_ids, [ Validators.required ]),
    });
  }

  save(): void {
    this.isSaving = true;
    let newUser: User = this.userForm.value;
    if (this.user.id !== undefined) {
      newUser.id = this.user.id;
      newUser.lang = this.user.lang;
      newUser.avatar = this.user.avatar;
      newUser.style = this.user.style;
      this.usersService.updateUser(newUser).subscribe(
        (_response: User) => {
          this.isSaving = false;
          this.httpUtils.successSnackbar(this.translate.instant('USER.SAVED'));
          this.router.navigate([this.backRoute]);
        },
        (error: any) => {
          this.isSaving = false;
          this.httpUtils.errorDialog(error);
        }
      );
    } else {
      this.usersService.createUser(newUser).subscribe(
        (_response: User) => {
          this.isSaving = false;
          this.httpUtils.successSnackbar(this.translate.instant('USER.SAVED'));
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
    const dialogRef = this.httpUtils.confirmDelete(this.translate.instant('USER.DELETECONFIRM'));
    dialogRef.afterClosed().subscribe((dialogResult: any) => {
      if (dialogResult) {
        this.isDeleting = true;
        this.usersService.deleteUser(this.user).subscribe(
          (_response: any) => {
            this.isDeleting = false;
            this.httpUtils.successSnackbar(this.translate.instant('USER.DELETED'));
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

  manageJobs(): void {
    this.router.navigate(['user/' + this.user.id + '/jobs']);
  }

  goBack(): void {
    this.location.back();
  }
}
