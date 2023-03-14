import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';

import { Role } from '../../_models/role';
import { User } from '../../_models/user';

import { RolesService } from '../../_services/roles.service';
import { UsersService } from '../../_services/users.service';

import { HttpUtils } from '../../_utils/http.utils';

@Component({
  templateUrl: './users-list.component.html',
  styleUrls: ['./users-list.component.scss']
})
export class UsersComponent implements OnInit {

  isLoading: boolean = true;
  users: User[];
  filteredUsers: User[];
  roles: Role[];

  constructor(private usersService: UsersService, private rolesService: RolesService, private router: Router, private httpUtils: HttpUtils) {}

  ngOnInit(): void {
    forkJoin(this.usersService.getUsers(), this.rolesService.getRoles()).subscribe(
      (results: any) => {
        this.users = results[0];
        this.roles = results[1];
        this.filteredUsers = this.users;
        this.users.forEach(
          (user) => {
            var role = this.roles.find(role => role.id == user.role_ids[0]);
            user.main_role = role.name;
          }
        );
        this.isLoading = false;
      },
      (error: any) => {
        this.httpUtils.errorDialog(error);
      }
    );
  }

  search(term: string): void {
    this.isLoading = true;
    this.filteredUsers = this.users.filter(function(user) {
      return (user.username.toLowerCase().indexOf(term.toLowerCase()) >= 0) || (user.email.toLowerCase().indexOf(term.toLowerCase()) >= 0);
    });
    this.isLoading = false;
  }

  edit(id: number): void {
    this.router.navigate(['user/' + id]);
  }
}
