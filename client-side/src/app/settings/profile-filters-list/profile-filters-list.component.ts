import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { TranslateService } from '@ngx-translate/core';
import { PepAddonService, PepLayoutService, PepScreenSizeType } from '@pepperi-addons/ngx-lib';
import { PepSelectionData } from '@pepperi-addons/ngx-lib/list';
import { IPepGenericListDataSource, IPepGenericListActions } from "@pepperi-addons/ngx-composite-lib/generic-list";
import { FomoService } from "src/services/fomo.service";
import { FilterObject, FilterRule } from "../../../../../shared/types";
import { PepDialogData, PepDialogService } from "@pepperi-addons/ngx-lib/dialog";
import { ProfileFiltersFormComponent } from "../profile-filters-form/profile-filters-form.component";
import { Collection } from "@pepperi-addons/papi-sdk/dist/entities";


@Component({
    selector: 'profile-filters-list',
    templateUrl: './profile-filters-list.component.html',
    styleUrls: ['./profile-filters-list.component.scss']
})
export class ProfileFiltersListComponent implements OnInit {

    screenSize: PepScreenSizeType;
    fomoService: FomoService;
    filterRulesMap: Map<string, FilterRule> = new Map<string, FilterRule>();
    filterRules?: FilterRule[] = undefined;
    filterObjects?: FilterObject[] = undefined;
    resources?: Collection[] = undefined;
    filterKeyToNameMap: Map<string, string> = new Map<string, string>();


    constructor(
        public router: Router,
        public route: ActivatedRoute,
        public layoutService: PepLayoutService,
        public translate: TranslateService,
        public pepAddonService: PepAddonService,
        private dialogService: PepDialogService,

    ) {
        this.layoutService.onResize$.subscribe(size => {
            this.screenSize = size;
        });
        this.fomoService = new FomoService(this.pepAddonService);
    }

    ngOnInit() {
    }


    private async openAttachmentDialog(callback: (value: any) => void, data?: { filterRule: FilterRule }) {
        //this.listDataSource = this.getDataSource(true); // update all different resources so form will have the latest data
        await this.updateFilterObjects();
        await this.updateResources();
        await this.updateFilterRules();
        const config = this.dialogService.getDialogConfig({}, 'large');

        config.data = new PepDialogData({
            content: ProfileFiltersFormComponent,
        })
        this.dialogService.openDialog(ProfileFiltersFormComponent, { ...data, filterRuleList: this.filterRules, filterObjectList: this.filterObjects, resourceList: this.resources }, config).afterClosed().subscribe((value) => {
            if (value) {
                console.log(JSON.stringify(value));
                this.listDataSource = this.getDataSource(true);
                callback(value);
            }
        });
    }

    private getProfileName(employeeType: number) {
        switch (employeeType) {
            case 1:
                return 'Admin';
            case 2:
                return 'Rep';
            case 3:
                return 'Buyer';
            default:
                return 'Unknown';
        }
    }

    private getFilterName(filterKey: string) {
        return this.filterKeyToNameMap.get(filterKey);
    }

    buttonClick($event: any) {
        console.log(`buttonClick: ${JSON.stringify($event)}`);
        this.openAttachmentDialog((value) => {
            console.log(`callback from dialog: ${JSON.stringify(value)}`);
        });
    }

    updateFilterRulesMap(filterRules: FilterRule[]) {
        filterRules.forEach(filterRule => {
            this.filterRulesMap.set(filterRule.Key, filterRule);
        });
    }

    updateFilterKeyToNameMap(filterObjects: FilterObject[]) {
        filterObjects.forEach(filterObject => {
            this.filterKeyToNameMap.set(filterObject.Key, filterObject.Name);
        });
    }

    async updateFilterObjectNames(keyList: string[]) {
        const filterObjects = await this.fomoService.getFilterObjectsByKeys(keyList);
        this.updateFilterKeyToNameMap(filterObjects);
    }

    async updateFilterRules() {
        try {
            this.filterRules = await this.fomoService.getFilterRules();
            this.updateFilterRulesMap(this.filterRules);
            const keyList = this.filterRules.map(filterRule => filterRule.Filter);
            const uniqueKeys = Array.from(new Set(keyList));
            await this.updateFilterObjectNames(uniqueKeys);
        }
        catch (ex) {
            console.error(`updateFilterRules: ${ex}`);
            throw ex;
        }
    }

    async updateResources() {
        try {
            this.resources = await this.fomoService.getResources();
        }
        catch (ex) {
            console.error(`updateResources: ${ex}`);
            throw ex;
        }
    }

    async updateFilterObjects() {
        try {
            this.filterObjects = await this.fomoService.getFilterObjects();
        }
        catch (ex) {
            console.error(`updateFilterObjects: ${ex}`);
            throw ex;
        }
    }

    async getSearchedFilterRules(force: boolean, searchText?: string): Promise<FilterRule[]> {
        try {
            if (this.filterRules === undefined || force) {
                await this.updateFilterRules();
            }
            if (this.filterObjects === undefined || force) {
                await this.updateFilterObjects();
            }
            if (this.resources === undefined) {
                await this.updateResources();
            }
        }
        catch (ex) {
            console.error(`Error in getSearchedFilterObjects: ${ex}`);
            throw ex;
        }
        if (!searchText) {
            return this.filterRules;
        }
        return this.filterRules.filter(filterRule => {
            return filterRule.Resource.toLowerCase().includes(searchText.toLowerCase());
        });
    }

    getDataSource(force: boolean = false) {
        return {
            init: async (state) => {
                const searchedFilterRules = await this.getSearchedFilterRules(force, state.searchString);
                return {
                    dataView: {
                        Context: {
                            Name: '',
                            Profile: { InternalID: 0 },
                            ScreenSize: 'Landscape'
                        },
                        Type: 'Grid',
                        Title: '',
                        Fields: [
                            {
                                FieldID: 'Profile',
                                Type: 'TextBox',
                                Title: 'Profile',
                                Mandatory: true,
                                ReadOnly: true
                            },
                            {
                                FieldID: 'Resource',
                                Type: 'TextBox',
                                Title: 'Resource',
                                Mandatory: true,
                                ReadOnly: true
                            },
                            {
                                FieldID: 'FilterName',
                                Type: 'TextBox',
                                Title: 'Filter',
                                Mandatory: true,
                                ReadOnly: true
                            }
                        ],
                        Columns: [
                            {
                                Width: 25
                            },
                            {
                                Width: 25
                            },
                            {
                                Width: 25
                            }
                        ],
                        FrozenColumnsCount: 0,
                        MinimumColumnWidth: 0
                    },
                    items: searchedFilterRules.map(filterRule => {
                        return {
                            ...filterRule,
                            Profile: this.getProfileName(filterRule.EmployeeType),
                            FilterName: this.getFilterName(filterRule.Filter)
                        }
                    }),
                    totalCount: this.filterRules.length
                }
            }
        } as IPepGenericListDataSource;
    }
    listDataSource: IPepGenericListDataSource = this.getDataSource();

    editAction = {
        title: this.translate.instant("Edit"),
        handler: async (data) => {
            const filterRuleKey = data?.rows[0];
            const filterRule = this.filterRulesMap.get(filterRuleKey);
            this.openAttachmentDialog((value) => {
                console.log(`callback from dialog: ${JSON.stringify(value)}`);
            }, { filterRule: filterRule });
        }
    }

    deleteAction = {
        title: this.translate.instant("Delete"),
        handler: async (data) => {
            const filterRuleKeys = data?.rows;
            await this.fomoService.deleteFilterRules(filterRuleKeys);
            this.listDataSource = this.getDataSource(true);
        }
    }

    actions: IPepGenericListActions = {
        get: async (data: PepSelectionData) => {
            if (data.rows.length == 1) {
                return [
                    this.editAction,
                    this.deleteAction
                ]
            }
            else if (data.rows.length > 1) {
                return [
                    this.deleteAction
                ]
            }
            else return []
        }
    }
}
