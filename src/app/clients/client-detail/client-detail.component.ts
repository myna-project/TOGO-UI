import { Location } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { DomSanitizer } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { forkJoin } from 'rxjs';

import { Client } from '../../_models/client';
import { ClientCategory } from '../../_models/clientcategory';
import { Organization } from '../../_models/organization';

import { ClientsService } from '../../_services/clients.service';
import { ClientCategoriesService } from '../../_services/clientcategories.service';
import { OrganizationsService } from '../../_services/organizations.service';

import { HttpUtils } from '../../_utils/http.utils';

@Component({
  templateUrl: './client-detail.component.html',
  styleUrls: ['./client-detail.component.scss']
})
export class ClientComponent implements OnInit {

  isLoading: boolean = true;
  isSaving: boolean = false;
  isDeleting: boolean = false;
  org: Organization = new Organization();
  client: Client = new Client();
  allOrgs: Organization[];
  allCategories: ClientCategory[];
  allClients: Client[];
  parentClients: Client[];
  controllerClients: Client[];
  clientTypes: string[] = [];
  client_image: any;
  client_image_show: any;
  clientForm: FormGroup;
  backRoute: string = 'clients';

  constructor(private orgsService: OrganizationsService, private clientCategoriesService: ClientCategoriesService, private clientsService: ClientsService, private route: ActivatedRoute, private router: Router, private location: Location, private sanitizer: DomSanitizer, private httpUtils: HttpUtils, private translate: TranslateService) {}

  ngOnInit() {
    this.createForm();
    this.route.paramMap.subscribe((params: any) => {
      var orgId = +params.get('orgId');
      var clientId = +params.get('id');
      forkJoin([this.orgsService.getOrganizations(), this.clientsService.getClients(), this.clientCategoriesService.getClientCategories(), this.clientsService.getClientTypes()]).subscribe({
        next: (results: any) => {
          this.allOrgs = results[0];
          this.allClients = results[1];
          this.allCategories = results[2];
          this.clientTypes = results[3];
          if (orgId) {
            this.org = this.allOrgs.filter(org => org.id == orgId)[0];
            this.client.org_id = orgId;
            this.backRoute = 'organization/' + orgId + '/clients';
          }
          this.allClients.sort((a, b) => a.name < b.name ? -1 : (a.name > b.name) ? 1 : 0);
          this.setClientsForSelect(this.org);
          this.createForm();
          if (clientId) {
            this.clientsService.getClient(clientId).subscribe({
              next: (client: Client) => {
                this.client = client;
                this.setClientsForSelect(this.org);
                if (this.client.image)
                  this.client_image_show = this.sanitizer.bypassSecurityTrustUrl('data:image/jpg;base64,' + this.client.image);
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
    });
  }

  get organization() { return this.clientForm.get('organization'); }
  get name() { return this.clientForm.get('name'); }
  get category() { return this.clientForm.get('category'); }
  get parent() { return this.clientForm.get('parent'); }
  get controller() { return this.clientForm.get('controller'); }
  get type() { return this.clientForm.get('type'); }
  get computer_client() { return this.clientForm.get('computer_client'); }
  get energy_client() { return this.clientForm.get('energy_client'); }
  get device_id() { return this.clientForm.get('device_id'); }
  get active() { return this.clientForm.get('active'); }

  createForm() {
    this.clientForm = new FormGroup({
      'organization': new FormControl({ value: this.client.org_id ? this.allOrgs.filter(org => (org.id === this.client.org_id))[0] : undefined, disabled: this.disabledCondition() }, [ Validators.required ]),
      'name': new FormControl({ value: this.client.name, disabled: this.disabledCondition() }, [ Validators.required ]),
      'category': new FormControl(this.client.category_id ? this.allCategories.filter(category => (category.id === this.client.category_id))[0] : undefined, []),
      'parent': new FormControl(this.client.parent_id ? this.parentClients.filter(client => (client.id === this.client.parent_id))[0] : '', []),
      'controller': new FormControl({ value: this.client.controller_id ? this.controllerClients.filter(client => (client.id === this.client.controller_id))[0] : '', disabled: this.disabledCondition() }, []),
      'type': new FormControl({ value: this.client.type ? this.client.type : 'GENERIC', disabled: this.disabledCondition() }, [ Validators.required ]),
      'computer_client': new FormControl({ value: this.client.computer_client, disabled: this.disabledCondition() }, []),
      'energy_client': new FormControl(this.client.energy_client, []),
      'device_id': new FormControl({ value: this.client.device_id, disabled: this.disabledCondition() }, []),
      'active': new FormControl({ value: this.client.active, disabled: this.disabledCondition() }, [])
    });
    this.clientForm.get('organization').valueChanges.subscribe((o: Organization) => {
      this.setClientsForSelect(o);
    });
    this.clientForm.get('type').valueChanges.subscribe((type: string) => {
      this.client.type = type;
    });
    this.clientForm.get('computer_client').valueChanges.subscribe((c: boolean) => {
      this.client.computer_client = c;
      if (!c)
        this.clientForm.patchValue({ controller: undefined });
    });
    this.clientForm.get('energy_client').valueChanges.subscribe((e: boolean) => {
      this.client.energy_client = e;
      if (!e)
        this.clientForm.patchValue({ parent: undefined });
    });
  }

  compareObjects(o1: any, o2: any): boolean {
    return (o2 != null) && (o1.id === o2.id);
  }

  disabledCondition(): boolean {
    return ((this.client.computer_client) && ((this.client.type === 'WOLF') || (this.client.type === 'WOLF_MANAGED')));
  }

  onSelectImage(event: any) {
    if (event.target.files && event.target.files[0]) {
      var reader = new FileReader();

      reader.onload = (event) => {
        this.client_image_show = event.target.result;
      }

      reader.onloadend = (_e) => {
        this.client_image = reader.result;
        this.client_image = this.client_image.substring(this.client_image.lastIndexOf(",") + 1);
      }

      reader.readAsDataURL(event.target.files[0]);
    }
  }

  setClientsForSelect(o: Organization) {
    this.parentClients = this.allClients.filter(client => (client.energy_client && (client.org_id === o.id)));
    this.controllerClients = this.allClients.filter(client => (client.computer_client && (client.org_id === o.id)));
    if (this.client && this.client.id) {
      this.parentClients = this.parentClients.filter(client => (client.id != this.client.id));
      this.controllerClients = this.controllerClients.filter(client => (client.id != this.client.id));
    }
  }

  save(): void {
    this.isSaving = true;
    let newClient: Client = new Client();
    newClient.org_id = this.organization.value ? this.organization.value.id : undefined;
    newClient.name = this.name.value;
    newClient.category_id = this.category.value ? this.category.value.id : undefined;
    newClient.image = this.client_image;
    newClient.parent_id = this.parent.value ? this.parent.value.id : undefined;
    newClient.controller_id = this.controller.value ? this.controller.value.id : undefined;
    newClient.type = this.type.value;
    newClient.computer_client = this.computer_client.value ? this.computer_client.value : false;
    newClient.energy_client = this.energy_client.value ? this.energy_client.value : false;
    newClient.device_id = this.device_id.value ? this.device_id.value : false;
    newClient.active = this.active.value;
    if (this.client.id !== undefined) {
      newClient.id = this.client.id;
      this.clientsService.updateClient(newClient).subscribe({
        next: (_response: Client) => {
          this.isSaving = false;
          this.httpUtils.successSnackbar(this.translate.instant('CLIENT.SAVED'));
          this.router.navigate([this.backRoute]);
        },
        error: (error: any) => {
          this.isSaving = false;
          if (error.status !== 401)
            this.httpUtils.errorDialog(error);
        }
      });
    } else {
      this.clientsService.createClient(newClient).subscribe({
        next: (_response: Client) => {
          this.isSaving = false;
          this.httpUtils.successSnackbar(this.translate.instant('CLIENT.SAVED'));
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
    const dialogRef = this.httpUtils.confirmDelete(this.translate.instant('CLIENT.DELETECONFIRM'));
    dialogRef.afterClosed().subscribe((dialogResult: any) => {
      if (dialogResult) {
        this.isDeleting = true;
        this.clientsService.deleteClient(this.client).subscribe({
          next: (_response: any) => {
            this.isDeleting = false;
            this.httpUtils.successSnackbar(this.translate.instant('CLIENT.DELETED'));
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
