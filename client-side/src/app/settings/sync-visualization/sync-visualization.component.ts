import { Collection, SchemeField } from "@pepperi-addons/papi-sdk/dist/entities";
import { PepDialogData, PepDialogService } from "@pepperi-addons/ngx-lib/dialog";
import { IPepGenericListDataSource, IPepGenericListParams } from "@pepperi-addons/ngx-composite-lib/generic-list";
import { PepAddonService, PepLayoutService, PepScreenSizeType, PepSessionService } from '@pepperi-addons/ngx-lib';
import { Component, Input, OnInit, Output, EventEmitter, OnChanges, SimpleChanges } from "@angular/core";
import { FilterObject, FilterRule, PermissionSetValues } from "../../../../../shared/types";
import { UtilsService } from "../../../services/utils.service";
import { ResourceAndEmployeeType, SyncRuleParameters, ReferenceFieldData, ListData } from "./types";
import { EMPLOYEE_TYPES } from "../../../types";

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
    filterObjectsMap: Map<string, FilterObject> = new Map<string, FilterObject>();
    listDataSource: IPepGenericListDataSource = this.getDataSource();
    private listData: ListData[];
    private readonly SYNC_RULE_ERROR = 'ERROR in filter chain';
    private readonly BI_OPEN = '<b><i>'
    private readonly BI_CLOSE = '</b></i>';

    constructor(
        private pepAddonService: PepAddonService,
        private layoutService: PepLayoutService,
        private dialogService: PepDialogService,
    ) {

        this.layoutService.onResize$.subscribe(size => {
            this.screenSize = size;
        });
        this.listData = [];
    }

    public getDataSource(): IPepGenericListDataSource {
        return {
            init: async (state: IPepGenericListParams) => {
                this.initDataSource(state.searchString);
                return {
                    dataView: {
                        Context: {
                            Name: 'SyncVisualizationGenericList',
                            Profile: { InternalID: 0 },
                            ScreenSize: 'Landscape'
                        },
                        Type: 'Grid',
                        Title: 'Sync Visualization',
                        Fields: [
                            {
                                FieldID: 'ResourceName',
                                Type: 'Link',
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
                                FieldID: 'ReferenceFields',
                                Type: "TextBox",
                                Title: 'Sync By Fields',
                                Mandatory: true,
                                ReadOnly: true,
                                Layout: {
                                    Size: {
                                        Width: 1,
                                        Height: 5
                                    }
                                }
                            },
                        ],
                        Columns: [
                            {
                                Width: 33
                            },
                            {
                                Width: 33
                            },
                            {
                                Width: 34
                            },
                        ],
                        FrozenColumnsCount: 0,
                        MinimumColumnWidth: 0
                    },
                    items: this.listData,
                    totalCount: this.listData.length
                }
            }
        };
    }

    ngOnInit(): void {
        this.updateFilterObjectsMap(this.filterObjects);
    }

    ngOnChanges(_changes: SimpleChanges) {
        this.updateFilterObjectsMap(this.filterObjects);
        this.listDataSource = this.getDataSource();
    }

    protected onResourceNameClick($event: any) {
        const rowData = this.listData.find((row) => row.ID === $event.id);

        if (rowData === undefined) {
            console.warn(`Could not find row with ID ${$event.id}`);
            return;
        }

        const dialogData = new PepDialogData({
            title: `${rowData.ResourceName} - ${rowData.Profile}`,
            content: rowData.SyncRuleText,
            actionsType: "close",
            showClose: false,
        });
        this.dialogService.openDefaultDialog(dialogData, {
            minWidth: "250px",
        });
    }

    private updateFilterObjectsMap(filterObjects: FilterObject[]): void {
        filterObjects.forEach(filterObject => {
            this.filterObjectsMap.set(filterObject.Key, filterObject);
        });
    }

    private initDataSource(searchString?: string): void {
        const resourceAndEmployeeType = this.getResourcesAndEmployeeTypes(searchString);
        const syncRuleParameters = this.getSyncRuleParameters(resourceAndEmployeeType);
        this.listData = this.buildListData(syncRuleParameters);
    }

    /**
     * Goes over all resources and employee types and creates a list of {@link ResourceAndEmployeeType}.
     * @param searchString If a search string is provided, only resources that contain the string will be returned.
     */
    private getResourcesAndEmployeeTypes(searchString?: string): ResourceAndEmployeeType[] {
        const resourceAndEmployeeType: ResourceAndEmployeeType[] = [];
        const resources = this.getSearchedSyncedResources(searchString);

        resources.forEach((resource) => {
            EMPLOYEE_TYPES.forEach((employeeType) => {
                resourceAndEmployeeType.push({
                    Resource: resource,
                    EmployeeType: employeeType,
                });
            });
        });

        return resourceAndEmployeeType;
    }

    /**
     * Filters and sorts the resources based on the search string.
     */
    private getSearchedSyncedResources(searchText?: string): Collection[] {
        let filterObjectsToReturn: Collection[];

        if (searchText === undefined) {
            filterObjectsToReturn = this.resources;
        } else {
            filterObjectsToReturn = this.resources.filter(resource => {
                return resource.Name.toLowerCase().includes(searchText.toLowerCase())
            });
        }

        // Order by resource name
        filterObjectsToReturn.sort((a, b) => {
            return a.Name.localeCompare(b.Name);
        });

        return filterObjectsToReturn;
    }

    /**
     * Goes over {@link ResourceAndEmployeeType} and finds all filter rules that are related to them based on reference fields.
     */
    private getSyncRuleParameters(resourcesAndEmployeeTypes: ResourceAndEmployeeType[]): SyncRuleParameters[] {
        const resourceEmployeeTypeAndFilterRule: SyncRuleParameters[] = [];
        const syncFiltersRules = this.filterRules.filter((filterRule) => filterRule.PermissionType === this.permissionType);

        // Foreach ResourceAndEmployeeType find reference-fields+filters that are related to it
        resourcesAndEmployeeTypes.forEach((resourceAndEmployeeType) => {
            const filterRules: FilterRule[] = [];
            const referenceFields: string[] = [];

            const refData = this.getReferenceFieldsData(resourceAndEmployeeType.Resource);

            // Get all filter rules that are related to the resource
            refData.forEach((refDatum) => {
                const relatedFilterRule = syncFiltersRules.find((filterRule) =>
                    filterRule.Resource === refDatum.ReferencedResourceName && filterRule.EmployeeType === resourceAndEmployeeType.EmployeeType
                );

                if (relatedFilterRule !== undefined) {
                    referenceFields.push(refDatum.FieldID);
                    filterRules.push(relatedFilterRule);
                }
            });

            // If resource has any filter rules, add it to the list
            if (filterRules.length > 0) {
                resourceEmployeeTypeAndFilterRule.push({
                    Resource: resourceAndEmployeeType.Resource,
                    EmployeeType: resourceAndEmployeeType.EmployeeType,
                    ReferenceFields: referenceFields,
                    FilterRules: filterRules,
                });
            }
        });

        return resourceEmployeeTypeAndFilterRule;
    }

    /**
     * Goes over a resource fields and returns {@link ReferenceFieldData} foreach reference field.
     */
    private getReferenceFieldsData(resource: Collection): ReferenceFieldData[] {
        const referenceFieldIDs: ReferenceFieldData[] = [];
        const fields = resource.Fields;

        if (fields !== undefined) {
            for (const fieldName in fields) {
                const referenceFieldData = fields[fieldName];

                if (this.isReferenceField(referenceFieldData)) {
                    referenceFieldIDs.push({
                        FieldID: fieldName,
                        ReferencedResourceName: referenceFieldData.Resource,
                    });
                }
            }
        }

        return referenceFieldIDs;
    }

    /**
     * @returns Whether the field is a reference field.
     */
    private isReferenceField(referenceFieldData?: SchemeField): boolean {
        // Check data exist
        if (referenceFieldData === undefined) {
            return false;
        }

        // Check correct type
        if (referenceFieldData.ApplySystemFilter !== true) {
            return false;
        }

        // Check correct type
        if (referenceFieldData.Type === undefined || referenceFieldData.Type !== 'Resource') {
            return false;
        }

        // Check field has sub-fields
        if (referenceFieldData.Resource === undefined || referenceFieldData.AddonUUID === undefined) {
            return false;
        }

        // If referenced resource does not have a filter rule, ignore it
        if (this.filterRules.find((filterRule) => filterRule.Resource === referenceFieldData.Resource) === undefined) {
            return false;
        }

        return true;
    }

    /**
     * Goes over {@link SyncRuleParameters} and builds the {@link ListData}.
     */
    private buildListData(resourcesEmployeeTypesAndFilterRules: SyncRuleParameters[]): ListData[] {
        const listData: ListData[] = [];
        let id = 0;

        resourcesEmployeeTypesAndFilterRules.forEach((resourceEmployeeTypeAndFilterRules) => {

            const syncRulesText: string[] = [];
            resourceEmployeeTypeAndFilterRules.FilterRules.forEach((filterRule, index) => {
                const filterObject = this.filterObjectsMap.get(filterRule.Filter);
                const fieldName = resourceEmployeeTypeAndFilterRules.ReferenceFields[index];
                syncRulesText.push(filterObject === undefined ? this.SYNC_RULE_ERROR : this.getSyncRuleText(fieldName, filterRule, filterObject));
            });

            listData.push({
                ID: id.toString(),
                ResourceName: resourceEmployeeTypeAndFilterRules.Resource.Name,
                Profile: UtilsService.getProfileName(resourceEmployeeTypeAndFilterRules.EmployeeType),
                SyncRuleText: syncRulesText.join(''),
                ReferenceFields: resourceEmployeeTypeAndFilterRules.ReferenceFields.join(', ')
            });

            id++;
        });

        return listData;
    }

    /**
     * Build the sync rule text for a single row.
     * @param filterRule - The first line of the sync rule text is based on the filter rule.
     * @param filterObject - The rest of the lines are based on the filter objects chain.
     * @returns sync rule text.
     */
    private getSyncRuleText(fieldName: string, filterRule: FilterRule, filterObject: FilterObject): string {

        // Builds the sync rule text
        const filterName = this.filterKeyToNameMap.get(filterRule.Filter);
        const filterObjectTextParts = [`Field ${this.BI_OPEN}${fieldName}${this.BI_CLOSE} in filter ${this.BI_OPEN}${filterName}${this.BI_CLOSE}`];

        // We pass the filterObjectTextParts array after inserting the first line (which comes from the filter rule).
        // The recursive function will add the rest of the lines.
        this.recursiveGetSyncRuleText(filterObject, filterObjectTextParts);

        let syncRule: string;
        // If there was an error in the chain, instead of the filter rule text, return an error string.
        if (filterObjectTextParts.includes(this.SYNC_RULE_ERROR)) {
            syncRule = this.SYNC_RULE_ERROR;
        } else {
            // Build the sync rule text as an HTML unordered list.
            const ul = '<ul>', li = '<li>', ulClose = '</ul>', liClose = '</li>';
            const middle = filterObjectTextParts.map((syncRuleText) => `${li}${syncRuleText}${liClose}`).join(ul);
            const newString = `${ul}${middle}${ulClose.repeat(filterObjectTextParts.length)}`;
            syncRule = newString;
        }

        return syncRule;
    }

    /**
     * Recursive function that builds the sync rule text based on the filter objects chain.
     * Each filter in the chain is a line in the sync rule text, which is written to the input array.
     * @param filterObject the current filter in the chain.
     * @param syncRuleText the array to which each sync rule part is written.
     */
    private recursiveGetSyncRuleText(filterObject: FilterObject, syncRuleText: string[]): void {
        const previousFilterName = this.filterKeyToNameMap.get(filterObject.PreviousFilter);

        // Base case - the filter is a system filter
        if (UtilsService.isLocked(filterObject) === false) {
            // If the filter is not a system filter, recursive call
            const nextFilter = this.filterObjectsMap.get(filterObject.PreviousFilter);
            if (filterObject === undefined) {
                syncRuleText.push(this.SYNC_RULE_ERROR);
            } else {
                const filterName = `${this.BI_OPEN}${filterObject.Name}${this.BI_CLOSE}`;
                const filterField = `${this.BI_OPEN}${filterObject.Field}${this.BI_CLOSE}`;
                const resource = `${this.BI_OPEN}${filterObject.Resource}${this.BI_CLOSE}`;
                const filterPreviousField = `${this.BI_OPEN}${filterObject.PreviousField}${this.BI_CLOSE}`;
                const previousFilter = `${this.BI_OPEN}${previousFilterName}${this.BI_CLOSE}`;

                syncRuleText.push(`${filterName} = all ${filterField} from ${resource} where ${filterPreviousField} in filter ${previousFilter}`);
                this.recursiveGetSyncRuleText(nextFilter, syncRuleText);
            }
        }
    }
}
