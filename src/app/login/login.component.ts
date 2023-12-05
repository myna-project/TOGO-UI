import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { first } from 'rxjs/operators';

import { AuthenticationService } from '../_services/authentication.service';
import { UsersService } from '../_services/users.service';

import { AppComponent } from '../app.component';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {

  loginForm: FormGroup;
  isLoading: boolean = false;
  loginError: boolean = false;

  constructor(public myapp: AppComponent, private router: Router, private authService: AuthenticationService, private usersService: UsersService) {
    if (this.authService.getCurrentUser())
      this.router.navigate(['/dashboard']);
  }

  ngOnInit() {
    this.loginForm = new FormGroup({
      'username': new FormControl('', [ Validators.required ]),
      'password': new FormControl('', [ Validators.required ])
    });
  }

  get username() { return this.loginForm.get('username'); }
  get password() { return this.loginForm.get('password'); }

  login() {
    this.isLoading = true;
    this.authService.login(this.username.value, this.password.value).pipe(first()).subscribe({
      next: (data: any) => {
        localStorage.setItem('currentUser', JSON.stringify({ 'username': this.username.value, 'is_logged': true, 'is_admin': (data.headers.get('isAdmin') == 'true') ? true : false }));
        this.usersService.getUsersByUsername(this.username.value).subscribe({
          next: (resp: any) => {
            const user = resp.filter((u: any) => u.username === this.username.value)[0];
            localStorage.setItem('currentUser', JSON.stringify({ 'username': this.username.value, 'lang': user.lang, 'avatar': user.avatar, 'style': user.style, 'is_logged': true, 'is_admin': (data.headers.get('isAdmin') === 'true') ? true : false, 'default_dashboard_id': user.default_dashboard_id, 'dashboard_ids': user.dashboard_ids ? user.dashboard_ids : [], 'default_start': user.default_start, 'default_end': user.default_end, 'drain_tree_depth': user.drain_tree_depth }));
            this.isLoading = false;
            this.myapp.initializeDashboardId();
            this.router.navigate(['/dashboard']);
          },
          error: (_error: any) => {
            this.loginError = true;
            this.loginForm.reset();
            this.isLoading = false;
          }
        });
      },
      error: (_error: any) => {
        this.loginError = true;
        this.loginForm.reset();
        this.isLoading = false;
      }
    });
  }
}
