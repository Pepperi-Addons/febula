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
import { UtilsService } from "../../../services/utils.service";

interface ResourceAndProfilePair {
    Resource: Collection;
    Profile: FilterRule;
}

interface ResourceProfileAndSyncRule {
    Resource: Collection;
    Profile: FilterRule;
    FilterObjects: FilterObject[]; // Of all fields of a resource
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
    private readonly SYNC_RULE_ERROR = 'ERROR in filter chain';

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
    
    private addMockedData() {
        const CORE_RESOURCES_ADDON_UUID = 'bla_bla';
        const FiltersForTests: FilterObject[] = [
            {
                Key: 'CurrentUser',
                Name: 'CurrentUser',
                Resource: 'users',
                Field: 'Key',
                AddonUUID: '',
            },
            {
                Key: 'ConnectedAccounts',
                Name: 'ConnectedAccounts',
                Resource: 'account_users',
                Field: 'Account',
                PreviousFilter: 'CurrentUser',
                PreviousField: 'User',
            },
            {
                Key: 'AssignedProfile',
                Name: 'AssignedProfile',
                Resource: 'users',
                Field: 'Profile',
                PreviousFilter: 'CurrentUser',
                PreviousField: 'Key',
            },
            {
                Key: 'AssignedRole',
                Name: 'AssignedRole',
                Resource: 'users',
                Field: 'Role',
                PreviousFilter: 'CurrentUser',
                PreviousField: 'Key',
            },
            {
                Key: 'RolesUnderMyHierarchy',
                Name: 'RolesUnderMyHierarchy',
                Resource: 'roles_roles',
                Field: 'Role',
                PreviousFilter: 'AssignedRole',
                PreviousField: 'Role',
            },
            {
                Key: 'UsersUnderMyHierarchy',
                Name: 'RolesUnderMyHierarchy',
                Resource: 'users',
                Field: 'Key',
                PreviousFilter: 'RolesUnderMyHierarchy',
                PreviousField: 'Role',
            },
            {
                Key: 'AccountsUnderMyHierarchy',
                Name: 'AccountsUnderMyHierarchy',
                Resource: 'account_users',
                Field: 'Account',
                PreviousFilter: 'UsersUnderMyHierarchy',
                PreviousField: 'User',
            },
            {
                Key: 'AssignedUsers',
                Name: 'AssignedUsers',
                Resource: 'assigned_users',
                Field: 'Subordinate',
                PreviousField: 'Manager',
                PreviousFilter: 'CurrentUser',
            },
            {
                Key: 'AccountUnderMyHierarchy',
                Name: 'name',
                Resource: 'account_users',
                Field: 'Account',
                PreviousField: 'User',
                PreviousFilter: 'AssignedUsers',
            },
            {
                Key: 'bFilter',
                Name: 'bFilter',
                Resource: 'b',
                Field: 'Key',
                PreviousField: 'userRef',
                PreviousFilter: 'CurrentUser',
            },
            {
                Key: 'cFilter',
                Name: 'cFilter',
                Resource: 'c',
                Field: 'Key',
                PreviousField: 'bRef',
                PreviousFilter: 'bFilter',
            },
            {
                Key: 'AssignedDivision',
                Name: 'AssignedDivision',
                Resource: 'user_divisions',
                Field: 'divisionRef',
                PreviousField: 'userRef',
                PreviousFilter: 'CurrentUser',
            },
            {
                Key: 'ManagerAssignedDivision',
                Name: 'ManagerAssignedDivision',
                Resource: 'user_divisions',
                Field: 'divisionRef',
                PreviousField: 'userRef',
                PreviousFilter: 'AssignedUsers',
            },
            {
                Key: 'AssignedDivision_non_associative',
                Name: 'AssignedDivision_non_associative',
                Resource: 'user_divisions_non_associative',
                Field: 'divisionRef',
                PreviousField: 'userRef',
                PreviousFilter: 'CurrentUser',
            },
            {
                Key: 'DivisionsToAssignedDivision_non_associative',
                Name: 'DivisionsToAssignedDivision_non_associative',
                Resource: 'toDivisions',
                Field: 'Key',
                PreviousField: 'divisionRef',
                PreviousFilter: 'AssignedDivision_non_associative',
            },
        ];
        const ProfileFiltersForTests: FilterRule[] = [
            {
                Key: '1',
                EmployeeType: 1,
                Resource: 'users',
                Filter: 'CurrentUser',
                PermissionSet: 'Sync',
            },
            {
                Key: '2',
                EmployeeType: 1,
                Resource: 'accounts',
                Filter: 'ConnectedAccounts',
                PermissionSet: 'Sync',
            },
            {
                Key: '3',
                EmployeeType: 2,
                Resource: 'users',
                Filter: 'AssignedUsers',
                PermissionSet: 'Sync',
            },
            {
                Key: '4',
                EmployeeType: 2,
                Resource: 'accounts',
                Filter: 'AccountUnderMyHierarchy',
                PermissionSet: 'Sync',
            },
            {
                Key: '5',
                EmployeeType: 1,
                Resource: 'b',
                Filter: 'bFilter',
                PermissionSet: 'Sync',
            },
            {
                Key: '6',
                EmployeeType: 1,
                Resource: 'c',
                Filter: 'cFilter',
                PermissionSet: 'Sync',
            },
            {
                Key: '7',
                EmployeeType: 1,
                Resource: 'Divisions',
                Filter: 'AssignedDivision',
                PermissionSet: 'Sync',
            },
            {
                Key: '8',
                EmployeeType: 2,
                Resource: 'Divisions',
                Filter: 'ManagerAssignedDivision',
                PermissionSet: 'Sync',
            },
            {
                Key: '9',
                EmployeeType: 3,
                Resource: 'Divisions',
                Filter: 'AssignedDivision_non_associative',
                PermissionSet: 'Sync',
            },
            {
                Key: '10',
                EmployeeType: 3,
                Resource: 'toDivisions',
                Filter: 'DivisionsToAssignedDivision_non_associative',
                PermissionSet: 'Sync',
            },
            {
                Key: '11',
                EmployeeType: 1,
                Resource: 'profiles',
                Filter: 'AssignedProfile',
                PermissionSet: 'Sync',
            },
            {
                Key: '12',
                EmployeeType: 3,
                Resource: 'accounts',
                Filter: 'AccountsUnderMyHierarchy',
                PermissionSet: 'Sync',
            },
        ];
        const ResourcesForTests: Collection[] = [
            {
                Name: 'assigned_users',
                AddonUUID: CORE_RESOURCES_ADDON_UUID,
                Fields: {
                    Manager: {
                        Type: 'Resource',
                        Resource: 'users',
                        AddonUUID: CORE_RESOURCES_ADDON_UUID,
                        Mandatory: false,
                        Description: ""
                    },
                    Subordinate: {
                        Type: 'Resource',
                        Resource: 'users',
                        AddonUUID: CORE_RESOURCES_ADDON_UUID,
                        Mandatory: false,
                        Description: ""
                    },
                },
                SyncData: {
                    Sync: true,
                    Associative: {
                        FieldID1: 'Manager',
                        FieldID2: 'Subordinate',
                    },
                },
            },
            {
                Name: 'account_users',
                AddonUUID: CORE_RESOURCES_ADDON_UUID,
                Fields: {
                    Account: {
                        Type: 'Resource',
                        Resource: 'accounts',
                        AddonUUID: CORE_RESOURCES_ADDON_UUID,
                        Mandatory: false,
                        Description: ""
                    },
                    User: {
                        Type: 'Resource',
                        Resource: 'users',
                        AddonUUID: CORE_RESOURCES_ADDON_UUID,
                        Mandatory: false,
                        Description: ""
                    },
                },
                SyncData: {
                    Sync: true,
                    Associative: {
                        FieldID1: 'Account',
                        FieldID2: 'User',
                    },
                },
            },
            {
                Name: 'accounts',
                AddonUUID: CORE_RESOURCES_ADDON_UUID,
                SyncData: {
                    Sync: true,
                },
            },
            {
                Name: 'users',
                AddonUUID: CORE_RESOURCES_ADDON_UUID,
                SyncData: {
                    Sync: true,
                },
                Fields: {
                    Profile: {
                        Type: 'Resource',
                        Resource: 'profiles',
                        AddonUUID: CORE_RESOURCES_ADDON_UUID,
                        Mandatory: false,
                        Description: ""
                    },
                    Role: {
                        Type: 'Resource',
                        Resource: 'roles',
                        AddonUUID: CORE_RESOURCES_ADDON_UUID,
                        Mandatory: false,
                        Description: ""
                    },
                },
            },
            {
                Name: 'profiles',
                AddonUUID: CORE_RESOURCES_ADDON_UUID,
                SyncData: {
                    Sync: true,
                },
            },
            {
                Name: 'roles',
                AddonUUID: CORE_RESOURCES_ADDON_UUID,
                SyncData: {
                    Sync: true,
                },
            },
            {
                Name: 'roles_roles',
                AddonUUID: CORE_RESOURCES_ADDON_UUID,
                SyncData: {
                    Sync: true,
                    Associative: {
                        FieldID1: 'Role',
                        FieldID2: 'ParentRole',
                    },
                },
                Fields: {
                    Role: {
                        Type: 'Resource',
                        Resource: 'roles',
                        AddonUUID: CORE_RESOURCES_ADDON_UUID,
                        Mandatory: false,
                        Description: ""
                    },
                    ParentRole: {
                        Type: 'Resource',
                        Resource: 'roles',
                        AddonUUID: CORE_RESOURCES_ADDON_UUID,
                        Mandatory: false,
                        Description: ""
                    },
                },
            },
            {
                Name: 'a',
                AddonUUID: CORE_RESOURCES_ADDON_UUID,
                SyncData: {
                    Sync: true,
                },
                Fields: {
                    bRef: {
                        Type: 'Resource',
                        ApplySystemFilter: true,
                        Resource: 'b',
                        AddonUUID: CORE_RESOURCES_ADDON_UUID,
                        Mandatory: false,
                        Description: ""
                    },
                },
            },
            {
                Name: 'b',
                AddonUUID: CORE_RESOURCES_ADDON_UUID,
                Fields: {
                    userRef: {
                        Type: 'Resource',
                        ApplySystemFilter: true,
                        Resource: 'users',
                        AddonUUID: CORE_RESOURCES_ADDON_UUID,
                        Mandatory: false,
                        Description: ""
                    },
                },
                SyncData: {
                    Sync: true,
                },
            },
            {
                Name: 'c',
                AddonUUID: CORE_RESOURCES_ADDON_UUID,
                Fields: {
                    bRef: {
                        Type: 'Resource',
                        ApplySystemFilter: true,
                        Resource: 'b',
                        AddonUUID: CORE_RESOURCES_ADDON_UUID,
                        Mandatory: false,
                        Description: ""
                    },
                },
                SyncData: {
                    Sync: true,
                },
            },
            {
                Name: 'Divisions',
                AddonUUID: CORE_RESOURCES_ADDON_UUID,
                SyncData: {
                    Sync: true,
                },
            },
            {
                Name: 'user_divisions',
                AddonUUID: CORE_RESOURCES_ADDON_UUID,
                Fields: {
                    userRef: {
                        Type: 'Resource',
                        ApplySystemFilter: true,
                        Resource: 'users',
                        AddonUUID: CORE_RESOURCES_ADDON_UUID,
                        Mandatory: false,
                        Description: ""
                    },
                    divisionRef: {
                        Type: 'Resource',
                        ApplySystemFilter: true,
                        Resource: 'Divisions',
                        AddonUUID: CORE_RESOURCES_ADDON_UUID,
                        Mandatory: false,
                        Description: ""
                    },
                },
                SyncData: {
                    Sync: true,
                    Associative: {
                        FieldID1: 'divisionRef',
                        FieldID2: 'userRef',
                    },
                },
            },
            {
                Name: 'user_divisions_non_associative',
                AddonUUID: CORE_RESOURCES_ADDON_UUID,
                Fields: {
                    userRef: {
                        Type: 'Resource',
                        ApplySystemFilter: true,
                        Resource: 'users',
                        AddonUUID: CORE_RESOURCES_ADDON_UUID,
                        Mandatory: false,
                        Description: ""
                    },
                    divisionRef: {
                        Type: 'Resource',
                        ApplySystemFilter: true,
                        Resource: 'Divisions',
                        AddonUUID: CORE_RESOURCES_ADDON_UUID,
                        Mandatory: false,
                        Description: ""
                    },
                },
                SyncData: {
                    Sync: true,
                },
            },
            {
                Name: 'toDivisions',
                AddonUUID: CORE_RESOURCES_ADDON_UUID,
                SyncData: {
                    Sync: true,
                },
                Fields: {
                    divisionRef: {
                        Type: 'Resource',
                        ApplySystemFilter: true,
                        Resource: 'Divisions',
                        AddonUUID: CORE_RESOURCES_ADDON_UUID,
                        Mandatory: false,
                        Description: ""
                    },
                },
            },
            {
                Name: 'toDivisionstoDivisionstoDivisions',
                AddonUUID: CORE_RESOURCES_ADDON_UUID,
                SyncData: {
                    Sync: true,
                },
                Fields: {
                    divisionsRef: {
                        Type: 'Resource',
                        ApplySystemFilter: true,
                        Resource: 'Divisions',
                        AddonUUID: CORE_RESOURCES_ADDON_UUID,
                        Mandatory: false,
                        Description: ""
                    },
                    accountRef: {
                        ApplySystemFilter: true,
                        Type: 'Resource',
                        Resource: 'accounts',
                        AddonUUID: CORE_RESOURCES_ADDON_UUID,
                        Mandatory: false,
                        Description: ""
                    },
                },
            },
        ];

        this.resources.push(...ResourcesForTests);
        this.filterRules.push(...ProfileFiltersForTests);
        this.filterObjects.push(...FiltersForTests);

        this.filterObjects.forEach((filterObject) => {
            this.filterObjectsMap.set(filterObject.Key, filterObject);
            this.filterKeyToNameMap.set(filterObject.Key, filterObject.Name);
        });
    }

    public getDataSource() {
        return {
            init: async (state) => {
                // TODO: Combine into a single call
                this.addMockedData();
                const searchedSyncedResources = this.getSearchedSyncedResources(state.searchString);
                const resourceAndProfile = this.addProfileToResource(searchedSyncedResources);
                const resourceAndProfileWithSyncRule = this.addFilterObjectToResourceAndProfile(resourceAndProfile);
                const listData = this.buildListData(resourceAndProfileWithSyncRule);
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

    private addFilterObjectToResourceAndProfile(resourceAndProfilePair: ResourceAndProfilePair[]): ResourceProfileAndSyncRule[] {
        const resourceProfileAndSyncRule: ResourceProfileAndSyncRule[] = [];

        resourceAndProfilePair.forEach((resourceAndProfile) => {
            const filtersObjects = this.filterObjects.filter((filterObject) => filterObject.Key === resourceAndProfile.Profile.Filter);
            // filtersObjects.forEach((filterObject) => {
                resourceProfileAndSyncRule.push({
                    Resource: resourceAndProfile.Resource,
                    Profile: resourceAndProfile.Profile,
                    FilterObjects: filtersObjects,
                });
            // });
        });

        return resourceProfileAndSyncRule;
    }

    private buildListData(resourceProfileAndSyncRule: ResourceProfileAndSyncRule[]): ListData[] {
        const listData: ListData[] = [];

        resourceProfileAndSyncRule.forEach((resourceProfileAndSyncRule) => {
            listData.push({
                ResourceName: resourceProfileAndSyncRule.Resource.Name,
                Profile: UtilsService.getProfileName(resourceProfileAndSyncRule.Profile.EmployeeType),
                SyncRuleText: this.getSyncRuleText(resourceProfileAndSyncRule),
            });
        });

        return listData;
    }

    private getSyncRuleText(resourceProfileAndSyncRule: ResourceProfileAndSyncRule): string {
        const syncRuleTextPerField: string[] = [];

        if (resourceProfileAndSyncRule.FilterObjects.length > 1) {
            debugger;
            console.log('ERROR: more than one filter object');
        }

        resourceProfileAndSyncRule.FilterObjects.forEach((filterObject) => {
            const syncRuleText = [];
            this.recursiveGetSyncRuleText(filterObject, syncRuleText);
            syncRuleTextPerField.push(syncRuleText.join(' → '));
        });

        // TODO: handle SYNC_RULE_ERROR
        return syncRuleTextPerField.join(' →→ ');
    }

    /**
     * @param syncRuleTextPerField each element is a filter in the chain.
     * @returns an array of sync rule texts per field.
     */
    private recursiveGetSyncRuleText(filterObject: FilterObject, syncRuleText: string[]): void {
        
        // Base case - the filter is a system filter
        if (UtilsService.isLocked(filterObject)) {
            syncRuleText.push(`${filterObject.Field} is ${filterObject.Name}`);
        } else {
            // If the filter is not a system filter, recursive call
            const nextFilter = this.filterObjectsMap.get(filterObject.PreviousFilter);
            if (filterObject === undefined) {
                syncRuleText.push(this.SYNC_RULE_ERROR);
            } else {
                syncRuleText.push(`${filterObject.Field} in ${filterObject.Name}`);
                this.recursiveGetSyncRuleText(nextFilter, syncRuleText);
            }
        }
    }

    public emitChangesEvent() {
        this.changesEvent.emit({ action: "filterObjectChange" });
    }
}
