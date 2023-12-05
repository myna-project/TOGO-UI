import { Location } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { forkJoin } from 'rxjs';

import { Client } from '../../_models/client';
import { Feed } from '../../_models/feed';
import { Organization } from '../../_models/organization';

import { ClientsService } from '../../_services/clients.service';
import { FeedsService } from '../../_services/feeds.service';
import { OrganizationsService } from '../../_services/organizations.service';

import { HttpUtils } from '../../_utils/http.utils';

@Component({
  templateUrl: './feed-detail.component.html',
  styleUrls: ['./feed-detail.component.scss']
})
export class FeedComponent implements OnInit {

  isLoading: boolean = true;
  isSaving: boolean = false;
  isDeleting: boolean = false;
  allOrgs: Organization[];
  allClients: Client[];
  energyClients: Client[];
  computerClients: Client[];
  org: Organization = new Organization();
  c: Client = new Client();
  energyClient: Client = new Client();
  computerClient: Client = new Client();
  feed: Feed = new Feed();
  feedForm: FormGroup;
  backRoute: string = 'clients';

  constructor(private orgsService: OrganizationsService, private clientsService: ClientsService, private feedsService: FeedsService, private route: ActivatedRoute, private router: Router, private location: Location, private httpUtils: HttpUtils, private translate: TranslateService) {}

  ngOnInit() {
    this.createForm();
    forkJoin([this.orgsService.getOrganizations(), this.clientsService.getClients()]).subscribe({
      next: (results: any) => {
        this.allOrgs = results[0];
        this.allClients = results[1];
        this.allClients.sort((a, b) => a.name < b.name ? -1 : (a.name > b.name) ? 1 : 0);
        this.route.paramMap.subscribe((params: any) => {
          var orgId = +params.get('orgId');
          if (orgId) {
            this.org = this.allOrgs.filter(o => o.id === orgId)[0];
            this.setClients(this.org);
            this.backRoute = 'organization/' + this.org.id + '/clients';
            var clientId = +params.get('clientId');
            if (clientId) {
              this.c = this.allClients.find(c => (c.id === clientId));
              if (this.c.energy_client)
                this.energyClient = this.c;
              if (this.c.computer_client)
                this.computerClient = this.c;
              this.backRoute = 'organization/' + this.org.id + '/client/' + this.c.id + '/drains';
              var feedId = +params.get('id');
              if (feedId) {
                this.feedsService.getFeed(feedId).subscribe({
                  next: (feed: Feed) => {
                    this.feed = feed;
                    if (this.feed.client_ids) {
                      this.feed.client_ids.forEach(id => {
                      let client: Client = this.allClients.find(c => c.id === id);
                      if (client.energy_client)
                        this.energyClient = client;
                      if (client.computer_client)
                        this.computerClient = client;
                      });
                    }
                    this.createForm();
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
                this.createForm();
                this.isLoading = false;
              }
            }
          }
        });
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
  }

  get organization() { return this.feedForm.get('organization'); }
  get energy_client() { return this.feedForm.get('energy_client'); }
  get computer_client() { return this.feedForm.get('computer_client'); }
  get description() { return this.feedForm.get('description'); }

  createForm() {
    this.feedForm = new FormGroup({
      'organization': new FormControl({ value: this.org.id ? this.org : undefined, disabled: this.disabledCondition() }, [ Validators.required ]),
      'energy_client': new FormControl(this.energyClient.id ? this.energyClient : undefined, [ Validators.required ]),
      'computer_client': new FormControl({ value: this.computerClient.id ? this.computerClient : undefined, disabled: this.disabledCondition() }),
      'description': new FormControl(this.feed.description, [ Validators.required ])
    });
    this.feedForm.get('organization').valueChanges.subscribe((o: Organization) => {
      this.feedForm.patchValue({ energy_client: undefined, computer_client: undefined });
      this.setClients(o);
    });
  }

  disabledCondition(): boolean {
    return ((this.computerClient.type === 'WOLF') || (this.computerClient.type === 'WOLF_MANAGED'));
  }

  compareObjects(o1: any, o2: any): boolean {
    return (o2 != null) && (o1.id === o2.id);
  }

  setClients(org: Organization) {
    this.energyClients = this.allClients.filter(c => (c.energy_client && (c.org_id === org.id)));
    this.computerClients = this.allClients.filter(c => (c.computer_client && (c.org_id === org.id)));
  }

  save(): void {
    this.isSaving = true;
    let newFeed: Feed = new Feed();
    newFeed.description = this.description.value;
    newFeed.client_ids = [];
    if (this.energy_client.value)
      newFeed.client_ids.push(this.energy_client.value.id);
    if (this.computer_client.value && (this.computer_client.value.id !== this.energy_client.value.id))
      newFeed.client_ids.push(this.computer_client.value.id);
    if (this.feed.id !== undefined) {
      newFeed.id = this.feed.id;
      this.feedsService.updateFeed(newFeed).subscribe({
        next: (_response: Feed) => {
          this.isSaving = false;
          this.httpUtils.successSnackbar(this.translate.instant('FEED.SAVED'));
          this.router.navigate([this.backRoute]);
        },
        error: (error: any) => {
          this.isSaving = false;
          if (error.status !== 401)
            this.httpUtils.errorDialog(error);
        }
      });
    } else {
      this.feedsService.createFeed(newFeed).subscribe({
        next: (_response: Feed) => {
          this.isSaving = false;
          this.httpUtils.successSnackbar(this.translate.instant('FEED.SAVED'));
          this.router.navigate([this.backRoute]);
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
    const dialogRef = this.httpUtils.confirmDelete(this.translate.instant('FEED.DELETECONFIRM'));
    dialogRef.afterClosed().subscribe((dialogResult: any) => {
      if (dialogResult) {
        this.isDeleting = true;
        this.feedsService.deleteFeed(this.feed).subscribe({
          next: (_response: any) => {
            this.isDeleting = false;
            this.httpUtils.successSnackbar(this.translate.instant('FEED.DELETED'));
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
