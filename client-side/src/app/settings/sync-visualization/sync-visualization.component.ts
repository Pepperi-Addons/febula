import { Component, Input, OnInit, Output, EventEmitter, OnChanges, SimpleChanges } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { TranslateService } from '@ngx-translate/core';
import { PepAddonService, PepLayoutService, PepScreenSizeType } from '@pepperi-addons/ngx-lib';
import { PepSelectionData } from '@pepperi-addons/ngx-lib/list';
import { IPepGenericListDataSource, IPepGenericListActions } from "@pepperi-addons/ngx-composite-lib/generic-list";
import { FebulaService } from "../../../services/febula.service";
import { FilterObject, FilterRule, PermissionSetValues } from "../../../../../shared/types";
import { PepDialogData, PepDialogService } from "@pepperi-addons/ngx-lib/dialog";
import { FilterFormComponent } from "../filter-form/filter-form.component";
import { config } from "../../app.config";
import { Collection } from "@pepperi-addons/papi-sdk/dist/entities";

interface ResourceAndProfilePair {
    Resource: Collection;
    Profile: FilterRule;
}

interface ResourceProfileAndSyncRule {
    Resource: Collection;
    Profile: FilterRule;
    FilterObject: FilterObject;
}

interface ListData {
    ResourceName: string;
    Profile: string;
    SyncRuleText: string;
}

// TODO: delete all unused code!
@Component({
    selector: 'sync-visualization',
    templateUrl: './sync-visualization.component.html',
    styleUrls: ['./sync-visualization.component.scss']
})
export class SyncVisualizationComponent implements OnInit, OnChanges {
    @Input() permissionType: PermissionSetValues;
    @Input() filterRules: FilterRule[];
    @Input() resources: Collection[];
    @Input() filterObjects: FilterObject[];
    @Input() filterKeyToNameMap: Map<string, string>;
    @Output() changesEvent: EventEmitter<any> = new EventEmitter<any>();

    screenSize: PepScreenSizeType;
    febulaService: FebulaService;
    filterObjectsMap: Map<string, FilterObject> = new Map<string, FilterObject>();
    listDataSource: IPepGenericListDataSource = this.getDataSource();

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
        this.febulaService = new FebulaService(this.pepAddonService);
    }

    public getDataSource() {
        return {
            init: async (state) => {
                // TODO: Combine into a single call
                const searchedSyncedResources = this.getSearchedSyncedResources(state.searchString);
                const resourceAndProfile = this.addProfileToResource(searchedSyncedResources);
                const resourceAndProfileWithSyncRule = this.addSyncRuleToResource(resourceAndProfile);
                const listData = this.buildListData(resourceAndProfileWithSyncRule);
                debugger;
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
                                FieldID: 'ResourceName',
                                Type: 'TextBox',
                                Title: 'Collection',
                                Mandatory: true,
                                ReadOnly: true
                            },
                            {
                                FieldID: 'Profile',
                                Type: 'TextBox',
                                Title: 'Profile',
                                Mandatory: true,
                                ReadOnly: true
                            },
                            {
                                FieldID: 'SyncRuleText',
                                Type: 'TextBox',
                                Title: 'Sync Rule',
                                Mandatory: true,
                                ReadOnly: true
                            },
                        ],
                        Columns: [
                            {
                                Width: 15
                            },
                            {
                                Width: 15
                            },
                            {
                                Width: 70
                            },
                        ],
                        FrozenColumnsCount: 0,
                        MinimumColumnWidth: 0
                    },
                    items: listData,
                    totalCount: listData.length
                }
            }
        } as IPepGenericListDataSource;
    }

    ngOnInit() {
        this.updateFilterObjectsMap(this.filterObjects);
    }

    ngOnChanges(changes: SimpleChanges) {
        this.updateFilterObjectsMap(this.filterObjects);
        this.listDataSource = this.getDataSource();
    }

    private updateFilterObjectsMap(filterObjects: FilterObject[]): void {
        filterObjects.forEach(filterObject => {
            this.filterObjectsMap.set(filterObject.Key, filterObject);
        });
    }

    private getSearchedSyncedResources(searchText?: string): Collection[] {
        let filterObjectsToReturn: Collection[];

        if (searchText === undefined) {
            filterObjectsToReturn = this.resources;
        } else {
            filterObjectsToReturn = this.resources.filter(resource => {
                return resource.Name.toLowerCase().includes(searchText.toLowerCase())
            });
        }

        //order by resource name
        filterObjectsToReturn.sort((a, b) => {
            return a.Name.localeCompare(b.Name);
        });

        return filterObjectsToReturn;
    }

    /**
     * Foreach resource find all filter profiles that are related to it
     * @returns An array of resource and profile rule pair.
     */
    private addProfileToResource(resources: Collection[]): ResourceAndProfilePair[] {
        const resourceAndProfile: ResourceAndProfilePair[] = [];
        const syncFilters = this.filterRules.filter((filterRule) => filterRule.PermissionType === this.permissionType);

        // Foreach resource find all filter profiles that are related to it
        resources.forEach((resource) => {
            const resourceFilterProfiles = syncFilters.filter((filterRule) => filterRule.Resource === resource.Name);
            resourceFilterProfiles.forEach((resourceFilterProfile) => {
                resourceAndProfile.push({
                    Resource: resource,
                    Profile: resourceFilterProfile,
                });
            });
        });

        return resourceAndProfile;
    }

    private addSyncRuleToResource(resourceAndProfilePair: ResourceAndProfilePair[]): ResourceProfileAndSyncRule[] {
        const resourceProfileAndSyncRule: ResourceProfileAndSyncRule[] = [];

        resourceAndProfilePair.forEach((resourceAndProfile) => {
            const filtersObjects = this.filterObjects.filter((filterObject) => filterObject.Key === resourceAndProfile.Profile.Filter);
            debugger;
            filtersObjects.forEach((filterObject) => {
                resourceProfileAndSyncRule.push({
                    Resource: resourceAndProfile.Resource,
                    Profile: resourceAndProfile.Profile,
                    FilterObject: filterObject,
                });
            });
        });

        return resourceProfileAndSyncRule;
    }

    private buildListData(resourceProfileAndSyncRule: ResourceProfileAndSyncRule[]): ListData[] {
        const listData: ListData[] = [];

        resourceProfileAndSyncRule.forEach((resourceProfileAndSyncRule) => {
            listData.push({
                ResourceName: resourceProfileAndSyncRule.Resource.Name,
                Profile: this.getProfileName(resourceProfileAndSyncRule.Profile.EmployeeType),
                SyncRuleText: this.getSyncRuleText(resourceProfileAndSyncRule),
            });
        });

        return listData;
    }

    private getSyncRuleText(resourceProfileAndSyncRule: ResourceProfileAndSyncRule): string {
        if (this.isLocked(resourceProfileAndSyncRule.FilterObject)) { // TODO: how can I know if this is a system filter?
            return `${resourceProfileAndSyncRule.FilterObject.Field} is ${resourceProfileAndSyncRule.FilterObject.Name}`;
        } else {
            return 'else';
        }
    }

    // TODO: was copied, move to a shared location
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

    // TODO: was copied, move to a shared location
    private isLocked(filterObject: FilterObject) {
        return filterObject.AddonUUID !== undefined;
    }

    public emitChangesEvent() {
        this.changesEvent.emit({ action: "filterObjectChange" });
    }
}
