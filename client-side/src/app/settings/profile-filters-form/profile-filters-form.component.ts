import { Component, Inject, OnInit } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { IPepGenericFormDataView, IPepGenericFormValueChange } from "@pepperi-addons/ngx-composite-lib/generic-form";
import { PepAddonService, PepLayoutService, PepScreenSizeType } from '@pepperi-addons/ngx-lib';
import { PepDialogService } from '@pepperi-addons/ngx-lib/dialog';
import { Collection } from "@pepperi-addons/papi-sdk/dist/entities";
import { ProfileFiltersFormService } from "src/services/profile-filters-form.service";
import { FilterObject, FilterRule, PermissionSetValues } from "../../../../../shared/types";

@Component({
    selector: 'profile-filters-form',
    templateUrl: './profile-filters-form.component.html',
    styleUrls: ['./profile-filters-form.component.scss']
})
export class ProfileFiltersFormComponent implements OnInit {
    formValidationChange($event: boolean) {
        //TODO there is a bug which causes the form to be not valid when it is valid
        //this.saveDisabled = !$event;
    }

    isProfileFilterValid(profileFilter: FilterRule): boolean {

        const isValidString = (str: string) => {
            return str !== undefined && str.length > 0;
        }

        const valid: boolean = profileFilter.EmployeeType !== undefined && isValidString(profileFilter.Resource) && isValidString(profileFilter.Filter);
        return valid;
    }


    mode: 'Edit' | 'Add'
    screenSize: PepScreenSizeType;
    profileFiltersTitle: string;
    profileFiltersFormService: ProfileFiltersFormService;
    saveDisabled: boolean = true;

    constructor(
        public layoutService: PepLayoutService,
        private dialogRef: MatDialogRef<ProfileFiltersFormComponent>,
        public translate: TranslateService,
        public dialogService: PepDialogService,
        public router: Router,
        public activatedRoute: ActivatedRoute,
        public pepAddonService: PepAddonService,
        @Inject(MAT_DIALOG_DATA) public incoming: { filterObjectList: FilterObject[], filterRuleList: FilterRule[], resourceList: Collection[], permissionType: PermissionSetValues, filterRule?: FilterRule }
    ) {
        this.layoutService.onResize$.subscribe(size => {
            this.screenSize = size;
        });
        this.profileFiltersTitle = incoming?.filterRule ? `Edit Profile-Filter` : `Create New Profile-Filter`;
        this.profileFiltersFormService = new ProfileFiltersFormService(this.pepAddonService, incoming.filterRuleList, incoming.filterObjectList, incoming.resourceList, incoming.filterRule, incoming.permissionType);
    }

    dataSource: FilterRule;
    dataView: IPepGenericFormDataView


    updateDataView() {
        this.dataView = this.profileFiltersFormService.getDataView();
    }

    updateDataSource() {
        this.dataSource = this.profileFiltersFormService.getFilterRule();
    }

    async ngOnInit() {
        await this.profileFiltersFormService.init();
        this.updateDataSource();
        this.updateDataView();
    }

    valueChange($event: IPepGenericFormValueChange) {
        console.log($event);
        switch ($event.ApiName) {
            case 'Profile':
                this.profileFiltersFormService.setProfile($event.Value);
                this.updateDataView();
                this.updateDataSource();
                break;
            case 'Resource':
                this.profileFiltersFormService.setResource($event.Value);
                this.updateDataView();
                this.updateDataSource();
                break;
            case 'FilterName':
                this.profileFiltersFormService.setFilter($event.Value);
                this.updateDataView();
                this.updateDataSource();
                break;
        }

        //TODO this should not be here but there is a bug in validation. to be removed when bug is fixed
        const profileFilterAfterChange = this.profileFiltersFormService.getFilterRule();
        this.saveDisabled = !this.isProfileFilterValid(profileFilterAfterChange);
    }

    close(event: any) {
        this.dialogRef.close(event);
    }

    backClicked() {
        this.close(undefined);
    }

    async saveClicked() {
        const result = await this.profileFiltersFormService.save();
        this.close(result);
    }

    cancelClicked() {
        this.close(undefined);
    }
}
