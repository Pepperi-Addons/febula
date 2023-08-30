import { Component, Input, OnInit, Output, EventEmitter, SimpleChanges, OnChanges } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { TranslateService } from '@ngx-translate/core';
import { PepAddonService, PepLayoutService, PepScreenSizeType } from '@pepperi-addons/ngx-lib';
import { PepSelectionData } from '@pepperi-addons/ngx-lib/list';
import { IPepGenericListDataSource, IPepGenericListActions } from "@pepperi-addons/ngx-composite-lib/generic-list";
import { FomoService } from "src/services/fomo.service";
import { FilterObject, FilterRule, PermissionSetValues } from "../../../../../shared/types";
import { PepDialogData, PepDialogService } from "@pepperi-addons/ngx-lib/dialog";
import { ProfileFiltersFormComponent } from "../profile-filters-form/profile-filters-form.component";
import { Collection } from "@pepperi-addons/papi-sdk/dist/entities";


@Component({
    selector: 'profile-filters-list',
    templateUrl: './profile-filters-list.component.html',
    styleUrls: ['./profile-filters-list.component.scss']
})
export class ProfileFiltersListComponent implements OnInit ,OnChanges {
    @Input() permissionType: PermissionSetValues;
    @Input() filterRules: FilterRule[];
    @Input() resources: Collection[];
    @Input() filterObjects: FilterObject[];
    @Input() filterKeyToNameMap: Map<string, string>;
    @Output() changesEvent: EventEmitter<any> = new EventEmitter<any>();

    screenSize: PepScreenSizeType;
    fomoService: FomoService;
    filterRulesMap: Map<string, FilterRule> = new Map<string, FilterRule>();
    title: string
    permissionFilterRules: FilterRule[] = [];


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
        this.title = `${this.permissionType}-Filters`
    }

    ngOnChanges(changes: SimpleChanges) { 
        this.listDataSource = this.getDataSource();
    }

    emitChangesEvent() { ;
        this.changesEvent.emit({action:"filterRuleChange"});
    }

    private openAttachmentDialog(callback: (value: any) => void, data?: { filterRule: FilterRule }) {
        //this.listDataSource = this.getDataSource(true); // update all different resources so form will have the latest data
        this.updateFilterRules();
        const config = this.dialogService.getDialogConfig({}, 'large');

        config.data = new PepDialogData({
            content: ProfileFiltersFormComponent,
        })
        this.dialogService.openDialog(ProfileFiltersFormComponent, { ...data, filterRuleList: this.permissionFilterRules, filterObjectList: this.filterObjects, resourceList: this.resources, permissionType: this.permissionType }, config).afterClosed().subscribe((value) => {
            if (value) {
                console.log(JSON.stringify(value));
                this.emitChangesEvent();
                this.listDataSource = this.getDataSource();
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

    updateFilterRules() {
        this.permissionFilterRules = this.filterRules.filter(filterRule => filterRule.PermissionSet === this.permissionType);
        this.updateFilterRulesMap(this.filterRules);
    }

    getSearchedFilterRules(searchText?: string): FilterRule[] {
        this.updateFilterRules();

        let filterRulesToReturn;

        if (!searchText) {
            filterRulesToReturn = this.permissionFilterRules;
        }
        else filterRulesToReturn = this.permissionFilterRules.filter(filterRule => {
            return (filterRule.Resource.toLowerCase().includes(searchText.toLowerCase())) ||
                (this.getFilterName(filterRule.Filter).toLowerCase().includes(searchText.toLowerCase()));
        });

        //order by Resource and EmployeeType
        filterRulesToReturn.sort((a, b) => {
            if (a.Resource.toLowerCase() > b.Resource.toLowerCase()) {
                return 1;
            }
            else if (a.Resource.toLowerCase() < b.Resource.toLowerCase()) {
                return -1;
            }
            else {
                return a.EmployeeType - b.EmployeeType;
            }
        }
        );

        return filterRulesToReturn;
    }

    getDataSource() {
        return {
            init: async (state) => {
                const searchedFilterRules = this.getSearchedFilterRules(state.searchString);
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
                    totalCount: this.permissionFilterRules.length
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
            this.emitChangesEvent();
            this.listDataSource = this.getDataSource();
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
