import { Component, Inject, OnInit } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { IPepGenericFormDataView, IPepGenericFormValueChange } from "@pepperi-addons/ngx-composite-lib/generic-form";
import { PepAddonService, PepLayoutService, PepScreenSizeType } from '@pepperi-addons/ngx-lib';
import { PepDialogService } from '@pepperi-addons/ngx-lib/dialog';
import { Collection } from "@pepperi-addons/papi-sdk/dist/entities";
import { ProfileFiltersFormService } from "src/services/profile-filters-form.service";
import { FilterObject, FilterRule } from "../../../../../shared/types";

@Component({
    selector: 'profile-filters-form',
    templateUrl: './profile-filters-form.component.html',
    styleUrls: ['./profile-filters-form.component.scss']
})
export class ProfileFiltersFormComponent implements OnInit {
    formValidationChange($event: boolean) {
        this.saveDisabled = !$event;
    }

    mode: 'Edit' | 'Add'
    screenSize: PepScreenSizeType;
    profileFiltersTitle: string;
    profileFiltersFormService: ProfileFiltersFormService;
    saveDisabled: boolean = false;

    constructor(
        public layoutService: PepLayoutService,
        private dialogRef: MatDialogRef<ProfileFiltersFormComponent>,
        public translate: TranslateService,
        public dialogService: PepDialogService,
        public router: Router,
        public activatedRoute: ActivatedRoute,
        public pepAddonService: PepAddonService,
        @Inject(MAT_DIALOG_DATA) public incoming: { filterObjectList: FilterObject[], filterRuleList: FilterRule[], resourceList: Collection[], filterRule?: FilterRule }
    ) {
        this.layoutService.onResize$.subscribe(size => {
            this.screenSize = size;
        });

        this.profileFiltersTitle = incoming?.filterRule ? `Edit Profile-Filter` : `Create new Profile-Filter`;
        this.profileFiltersFormService = new ProfileFiltersFormService(this.pepAddonService, incoming.filterRuleList, incoming.filterObjectList, incoming.resourceList, incoming.filterRule);
    }

    dataSource: FilterRule;
    dataView: IPepGenericFormDataView


    updateDataView() {
        this.dataView = this.profileFiltersFormService.getDataView();
    }

    updateDataSource() {
        this.dataSource = this.profileFiltersFormService.getFilterRule();
        return {}
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
                break;
            case 'Resource':
                this.profileFiltersFormService.setResource($event.Value);
                this.updateDataView();
                break;
            case 'Filter':
                this.profileFiltersFormService.setFilter($event.Value);
                this.updateDataView();
                break;
        }
    }

    close(event: any) {
        this.dialogRef.close(event);
    }

    backClicked() {
        this.close(undefined);
    }

    async saveClicked() {
        const result = await this.profileFiltersFormService.save();
        this.close(undefined);
    }

    cancelClicked() {
        this.close(undefined);
    }
}
