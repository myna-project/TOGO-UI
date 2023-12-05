import { Location } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { forkJoin } from 'rxjs';

import { Client } from '../../_models/client';
import { Drain } from '../../_models/drain';
import { Feed } from '../../_models/feed';
import { Organization } from '../../_models/organization';

import { ClientsService } from '../../_services/clients.service';
import { DrainsService } from '../../_services/drains.service';
import { FeedsService } from '../../_services/feeds.service';
import { OrganizationsService } from '../../_services/organizations.service';

import { HttpUtils } from '../../_utils/http.utils';

@Component({
  templateUrl: './drain-detail.component.html',
  styleUrls: ['./drain-detail.component.scss']
})
export class DrainComponent implements OnInit {

  isLoading: boolean = true;
  isSaving: boolean = false;
  isDeleting: boolean = false;
  org: Organization = new Organization();
  c: Client = new Client();
  f: Feed = new Feed();
  allOrgs: Organization[];
  allClients: Client[];
  orgClients: Client[];
  feedsForClient: Feed[] = [];
  drain: Drain = new Drain();
  drainsForFeed: Drain[] = [];
  drainForm: FormGroup;
  measureTypes: any[] = [{ id: 'b', name: 'b - Float' }, { id: 'B', name: 'B - Float' }, { id: 'c', name: 'c - Float' }, { id: 'C', name: 'C - Bitfield' }, { id: 'd', name: 'd - Float' }, { id: 'f', name: 'f - Float' }, { id: 'h', name: 'h - Float' }, { id: 'H', name: 'H - Float' }, { id: 'i', name: 'i - Float' }, { id: 'I', name: 'I - Float' }, { id: 'q', name: 'q - Float' }, { id: 'Q', name: 'Q - Float' }, { id: 's', name: 's - String' }];
  backRoute: string = 'clients';

  constructor(private orgsService: OrganizationsService, private clientsService: ClientsService, private feedsService: FeedsService, private drainsService: DrainsService, private route: ActivatedRoute, private router: Router, private location: Location, private httpUtils: HttpUtils, private translate: TranslateService) {}

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
            this.org = this.allOrgs.find(o => o.id === orgId);
            this.orgClients = this.allClients.filter(c => c.org_id === orgId);
            this.backRoute = 'organization/' + this.org.id + '/clients';
            var clientId = +params.get('clientId');
            if (clientId) {
              this.c = this.orgClients.find(c => c.id === clientId);
              this.backRoute = 'organization/' + this.org.id + '/client/' + this.c.id + '/drains';
              this.clientsService.getFeedsForClient(this.c).subscribe({
                next: (feeds: Feed[]) => {
                  this.feedsForClient = feeds;
                  var drainId = +params.get('id');
                  if (drainId) {
                    this.drainsService.getDrain(drainId).subscribe({
                      next: (drain: Drain) => {
                        this.drain = drain;
                        if (this.drain.feed_id) {
                          this.f = this.feedsForClient.find(f => (f.id === this.drain.feed_id));
                          this.feedsService.getDrainsForFeed(this.drain.feed_id).subscribe({
                            next: (drains: Drain[]) => {
                              this.drainsForFeed = drains.filter(d => (d.id !== this.drain.id));
                              this.createForm();
                              this.isLoading = false;
                            },
                            error: (error: any) => {
                              {
                                if (error.status !== 401) {
                                  const dialogRef = this.httpUtils.errorDialog(error);
                                  dialogRef.afterClosed().subscribe((_value: any) => {
                                    this.router.navigate([this.backRoute]);
                                  });
                                }
                              }
                            }
                          });
                        }
                      },
                      error: (error: any) => {
                        if (error.status !== 401) {
                          const dialogRef = this.httpUtils.errorDialog(error);
                          dialogRef.afterClosed().subscribe((_value: any) => {
                            this.router.navigate([this.backRoute]);
                          });
                        }
                      }
                    })
                  } else {
                    this.createForm();
                    this.isLoading = false;
                  }
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
    this.orgsService.getOrganizations().subscribe({
      next: (orgs: Organization[]) => {
        this.allOrgs = orgs;
        this.clientsService.getClients().subscribe({
          next: (clients: Client[]) => {
            clients.sort((a, b) => a.name < b.name ? -1 : (a.name > b.name) ? 1 : 0);
            this.allClients = clients;
            this.route.paramMap.subscribe((params: any) => {
              var orgId = +params.get('orgId');
              if (orgId) {
                this.org = this.allOrgs.find(o => o.id === orgId);
                this.orgClients = this.allClients.filter(c => c.org_id === orgId);
                this.backRoute = 'organization/' + this.org.id + '/clients';
                var clientId = +params.get('clientId');
                if (clientId) {
                  this.c = this.orgClients.find(c => c.id === clientId);
                  this.backRoute = 'organization/' + this.org.id + '/client/' + this.c.id + '/drains';
                  this.clientsService.getFeedsForClient(this.c).subscribe({
                    next: (feeds: Feed[]) => {
                      this.feedsForClient = feeds;
                      var drainId = +params.get('id');
                      if (drainId) {
                        this.drainsService.getDrain(drainId).subscribe({
                          next: (drain: Drain) => {
                            this.drain = drain;
                            if (this.drain.feed_id) {
                              this.f = this.feedsForClient.find(f => (f.id === this.drain.feed_id));
                              this.feedsService.getDrainsForFeed(this.drain.feed_id).subscribe({
                                next: (drains: Drain[]) => {
                                  this.drainsForFeed = drains.filter(d => (d.id !== this.drain.id));
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
                            }
                          },
                          error: (error: any) => {
                            if (error.status !== 401) {
                              const dialogRef = this.httpUtils.errorDialog(error);
                              dialogRef.afterClosed().subscribe((_value: any) => {
                                this.router.navigate([this.backRoute]);
                              });
                            }
                          }
                        })
                      } else {
                        this.createForm();
                        this.isLoading = false;
                      }
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

  get organization() { return this.drainForm.get('organization'); }
  get client() { return this.drainForm.get('client'); }
  get feed() { return this.drainForm.get('feed'); }
  get name() { return this.drainForm.get('name'); }
  get measure_id() { return this.drainForm.get('measure_id'); }
  get measure_unit() { return this.drainForm.get('measure_unit'); }
  get measure_type() { return this.drainForm.get('measure_type'); }
  get decimals() { return this.drainForm.get('decimals'); }
  get incremental() { return this.drainForm.get('incremental'); }
  get client_default_drain() { return this.drainForm.get('client_default_drain'); }
  get positive_negative_value() { return this.drainForm.get('positive_negative_value'); }
  get base_drain() { return this.drainForm.get('base_drain'); }
  get coefficient() { return this.drainForm.get('coefficient'); }
  get diff_drain() { return this.drainForm.get('diff_drain'); }

  createForm() {
    let patterns = this.httpUtils.getPatterns();
    this.drainForm = new FormGroup({
      'organization': new FormControl({ value: this.org.id ? this.org : undefined, disabled: this.disabledCondition() }, [ Validators.required ]),
      'client': new FormControl({ value: this.c.id ? this.c : undefined, disabled: this.disabledCondition() }, [ Validators.required ]),
      'feed': new FormControl(((this.feedsForClient !== undefined) && this.drain.feed_id) ? this.feedsForClient.find(f => (f.id === this.drain.feed_id)) : undefined, [ Validators.required ]),
      'name': new FormControl({ value: this.drain.name, disabled: this.disabledCondition() }, [ Validators.required ]),
      'measure_id': new FormControl({ value: this.drain.measure_id, disabled: this.disabledCondition() }, [ Validators.required ]),
      'measure_unit': new FormControl({ value: this.drain.measure_unit, disabled: this.disabledCondition() }, []),
      'measure_type': new FormControl({ value: this.drain.measure_type ? this.measureTypes.filter(t => (t.id === this.drain.measure_type))[0] : undefined, disabled: this.disabledCondition() }, [ Validators.required ]),
      'decimals': new FormControl(this.drain.decimals, [ Validators.pattern(patterns.positiveInteger) ]),
      'incremental': new FormControl((this.drain.type === 'inc') ? true : false, []),
      'client_default_drain': new FormControl((this.drain.client_default_drain != null) ? this.drain.client_default_drain : false, []),
      'positive_negative_value': new FormControl(this.drain.positive_negative_value ? this.drain.positive_negative_value : false, []),
      'base_drain': new FormControl(this.drain.base_drain_id ? this.drainsForFeed.filter(d => (d.id === this.drain.base_drain_id))[0] : '', []),
      'coefficient': new FormControl({ value: this.drain.coefficient, disabled: ((this.drain.base_drain_id === null) || (this.drain.base_drain_id === undefined)) }, [ Validators.pattern(patterns.positiveNegativeFloat) ]),
      'diff_drain': new FormControl(this.drain.diff_drain_id ? this.drainsForFeed.filter(d => (d.id === this.drain.diff_drain_id))[0] : '',  [])
    });
    this.drainForm.get('organization').valueChanges.subscribe((o: Organization) => {
      this.drainForm.patchValue({ client: undefined, feed: undefined, base_drain: '', coefficient: undefined });
      this.orgClients = this.allClients.filter(client => (client.org_id == o.id));
      this.drainsForFeed = [];
    });
    this.drainForm.get('client').valueChanges.subscribe((c: Client) => {
      this.drainForm.patchValue({ feed: undefined, base_drain: '', coefficient: undefined });
      if (c) {
        this.clientsService.getFeedsForClient(c).subscribe({
          next: (feeds: Feed[]) => {
            this.feedsForClient = feeds;
            this.drainsForFeed = [];
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
    });
    this.drainForm.get('feed').valueChanges.subscribe((feed: Feed) => {
      if (feed) {
        this.feedsService.getDrainsForFeed(feed.id).subscribe({
          next: (drains: Drain[]) => {
            this.drainsForFeed = drains.filter(d => (d.id !== this.drain.id));
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
    });
    this.drainForm.get('base_drain').valueChanges.subscribe((d: Drain) => {
      if (d) {
        this.coefficient.enable();
      } else {
        this.coefficient.disable();
        this.drainForm.patchValue({ coefficient: undefined });
      }
    });
  }

  disabledCondition(): boolean {
    let disable = false;
    if (this.drain.id && this.f.id) {
      let clients = this.allClients.filter(c => (this.f.client_ids.indexOf(c.id) > -1));
      if (clients) {
        clients.forEach(client => {
          if ((client.type === 'WOLF') || (client.type === 'WOLF_MANAGED'))
            disable = true;
        });
      }
    }
    return disable;
  }

  compareObjects(o1: any, o2: any): boolean {
    return (o2 != null) && (o1.id === o2.id);
  }

  save(): void {
    this.isSaving = true;
    let newDrain: Drain = new Drain();
    newDrain.name = this.name.value;
    newDrain.feed_id = this.feed.value ? this.feed.value.id : undefined;
    newDrain.measure_id = this.measure_id.value;
    newDrain.measure_unit = this.measure_unit.value;
    newDrain.measure_type = this.measure_type.value ? this.measure_type.value.id : undefined;
    newDrain.type = this.incremental.value ? 'inc' : '';
    newDrain.decimals = this.decimals.value;
    newDrain.client_default_drain = this.client_default_drain.value;
    newDrain.positive_negative_value = this.positive_negative_value.value ? this.positive_negative_value.value : false;
    newDrain.base_drain_id = this.base_drain.value ? this.base_drain.value.id : undefined;
    newDrain.coefficient = this.coefficient.value;
    newDrain.diff_drain_id = this.diff_drain.value ? this.diff_drain.value.id : undefined;
    if (this.drain.id !== undefined) {
      newDrain.id = this.drain.id;
      this.drainsService.updateDrain(newDrain).subscribe({
        next: (_response: Drain) => {
          this.isSaving = false;
          this.httpUtils.successSnackbar(this.translate.instant('DRAIN.SAVED'));
          this.router.navigate([this.backRoute]);
        },
        error: (error: any) => {
          this.isSaving = false;
          if (error.status !== 401)
            this.httpUtils.errorDialog(error);
        }
      });
    } else {
      this.drainsService.createDrain(newDrain).subscribe({
        next: (_response: Drain) => {
          this.isSaving = false;
          this.httpUtils.successSnackbar(this.translate.instant('DRAIN.SAVED'));
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
    const dialogRef = this.httpUtils.confirmDelete(this.translate.instant('DRAIN.DELETECONFIRM'));
    dialogRef.afterClosed().subscribe((dialogResult: any) => {
      if (dialogResult) {
        this.isDeleting = true;
        this.drainsService.deleteDrain(this.drain).subscribe({
          next: (_response: any) => {
            this.isDeleting = false;
            this.httpUtils.successSnackbar(this.translate.instant('DRAIN.DELETED'));
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
