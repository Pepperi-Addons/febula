import { Component, Inject, OnInit } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { IPepGenericFormDataView, IPepGenericFormValueChange } from "@pepperi-addons/ngx-composite-lib/generic-form";
import { PepAddonService, PepLayoutService, PepScreenSizeType } from '@pepperi-addons/ngx-lib';
import { PepDialogService } from '@pepperi-addons/ngx-lib/dialog';
import { FilterFormService } from "src/services/filter-form.service";
import { FilterRule } from "../../../../../shared/types";

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
    //TODO future task
    //profileFiltersFormService: FilterFormService;
    saveDisabled: boolean = false;

    constructor(
        public layoutService: PepLayoutService,
        private dialogRef: MatDialogRef<ProfileFiltersFormComponent>,
        public translate: TranslateService,
        public dialogService: PepDialogService,
        public router: Router,
        public activatedRoute: ActivatedRoute,
        public pepAddonService: PepAddonService,
        @Inject(MAT_DIALOG_DATA) public incoming?: { profileFilter: FilterRule }
    ) {
        this.layoutService.onResize$.subscribe(size => {
            this.screenSize = size;
        });

        this.profileFiltersTitle = incoming?.profileFilter ? `Edit Profile-Filter` : `Create new Profile-Filter`;
        //TODO future task
        //this.filterFormService = new FilterFormService(this.pepAddonService, incoming?.filterObject);
    }

    dataSource: FilterRule;
    dataView: IPepGenericFormDataView


    updateDataView() {
        //TODO future task
        //this.dataView = this.filterFormService.getDataView();
        return {
            "Type": "Form",
            "Hidden": false,
            "Columns": [],
            "Context": {
                "Object": {
                    "Resource": "transactions",
                    "InternalID": 0,
                    "Name": "Object Name"
                },
                "Name": "Context Name",
                "ScreenSize": "Tablet",
                "Profile": {
                    "InternalID": 0,
                    "Name": "Profile Name"
                }
            },
            "Fields": [
            ],
            "Rows": []
        }
    }

    updateDataSource() {
        //TODO future task
        //this.dataSource = this.filterFormService.getFilterObject();
        return {}
    }

    async ngOnInit() {
        //TODO future task
        //await this.filterFormService.init();
        this.updateDataSource();
        this.updateDataView();
    }


    async valueChange($event: IPepGenericFormValueChange) {
        console.log($event);
        // switch case for ApiName
        //TODO future task
        // switch ($event.ApiName) {
        //     case 'Name':
        //         await this.filterFormService.setName($event.Value);
        //         break;
        //     case 'Resource':
        //         await this.filterFormService.setResource($event.Value);
        //         this.updateDataView();
        //         break;
        //     case 'Field':
        //         await this.filterFormService.setField($event.Value);
        //         this.updateDataView();
        //         break;
        //     case 'PreviousField':
        //         await this.filterFormService.setPreviousField($event.Value);
        //         this.updateDataView();
        //         break;
        //     case 'PreviousFilter':
        //         await this.filterFormService.setPreviousFilter($event.Value);
        //         this.updateDataView();
        //         break;
        // }
    }

    close(event: any) {
        this.dialogRef.close(event);
    }

    backClicked() {
        this.close(undefined);
    }

    async saveClicked() {
        //TODO future task
        //const result = await this.filterFormService.save();
        this.close(undefined);
    }

    cancelClicked() {
        this.close(undefined);
    }
}
