import { Component, Inject, OnInit } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { IPepGenericFormDataView, IPepGenericFormValueChange } from "@pepperi-addons/ngx-composite-lib/generic-form";
import { PepAddonService, PepLayoutService, PepScreenSizeType } from '@pepperi-addons/ngx-lib';
import { PepDialogService } from '@pepperi-addons/ngx-lib/dialog';
import { Collection } from "@pepperi-addons/papi-sdk/dist/entities";
import { FilterFormService } from "src/services/filter-form.service";
import { FilterObject } from "../../../../../shared/types";

@Component({
    selector: 'filter-form',
    templateUrl: './filter-form.component.html',
    styleUrls: ['./filter-form.component.scss']
})
export class FilterFormComponent implements OnInit {
    formValidationChange($event: boolean) {
        this.saveDisabled = !$event;
    }

    mode: 'Edit' | 'Add'
    screenSize: PepScreenSizeType;
    filterTitle: string;
    filterFormService: FilterFormService;
    saveDisabled: boolean = false;

    constructor(
        public layoutService: PepLayoutService,
        private dialogRef: MatDialogRef<FilterFormComponent>,
        public translate: TranslateService,
        public dialogService: PepDialogService,
        public router: Router,
        public activatedRoute: ActivatedRoute,
        public pepAddonService: PepAddonService,
        @Inject(MAT_DIALOG_DATA) public incoming: { filterObjectList: FilterObject[], resourceList: Collection[], filterObject: FilterObject }
    ) {
        this.layoutService.onResize$.subscribe(size => {
            this.screenSize = size;
        });
        this.filterTitle = incoming.filterObject ? `Edit Filter ${incoming.filterObject.Name}` : "Create new Filter";
        this.filterFormService = new FilterFormService(this.pepAddonService, incoming.filterObjectList, incoming.resourceList, incoming.filterObject);
    }

    dataSource: FilterObject;
    dataView: IPepGenericFormDataView


    updateDataView() {
        this.dataView = this.filterFormService.getDataView();
    }

    updateDataSource() {
        this.dataSource = this.filterFormService.getFilterObject();
    }

    ngOnInit() {
        this.filterFormService.init();
        this.updateDataSource();
        this.updateDataView();
    }


    valueChange($event: IPepGenericFormValueChange) {
        console.log($event);
        // switch case for ApiName
        switch ($event.ApiName) {
            case 'Name':
                this.filterFormService.setName($event.Value);
                break;
            case 'Resource':
                this.filterFormService.setResource($event.Value);
                this.updateDataView();
                break;
            case 'Field':
                this.filterFormService.setField($event.Value);
                this.updateDataView();
                break;
            case 'PreviousField':
                this.filterFormService.setPreviousField($event.Value);
                this.updateDataView();
                break;
            case 'PreviousFilter':
                this.filterFormService.setPreviousFilter($event.Value);
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
        const result = await this.filterFormService.save();
        this.close(result);
    }

    cancelClicked() {
        this.close(undefined);
    }
}
