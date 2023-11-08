import { IPepGenericFormDataView, IPepGenericFormDataViewField } from "@pepperi-addons/ngx-composite-lib/generic-form";
import { PepAddonService } from "@pepperi-addons/ngx-lib";
import { Collection } from "@pepperi-addons/papi-sdk/dist/entities";
import { FilterObject, FilterRule, PermissionSetValues } from "../../../shared/types";
import { FebulaService } from "./febula.service";
import { EditorMode } from "./consts";

export class ProfileFiltersFormService {

    private febulaService: FebulaService;
    private mode: EditorMode;
    private filterRule: FilterRule;
    private resources: Collection[];
    private readonly profileOptions: string[] = ["Admin", "Rep", "Buyer"];
    private resourceOptions: string[] = [];
    private filterOptions: string[] = [];
    private chosenResource: Collection;
    private filterObjectList: FilterObject[];
    private filterRuleList: FilterRule[];

    constructor(pepAddonService: PepAddonService, filterRuleList: FilterRule[], filterObjectList: FilterObject[], resourceList: Collection[], filterRule?: FilterRule, permissionType?: PermissionSetValues) {
        this.febulaService = new FebulaService(pepAddonService);
        this.filterRuleList = filterRuleList;
        this.filterObjectList = filterObjectList;
        this.resources = resourceList;
        this.filterRule = filterRule ? filterRule : {
            EmployeeType: 1,
            Resource: '',
            Filter: ''
        };
        this.filterRule.PermissionSet = permissionType;
        this.mode = filterRule ? 'Edit' : 'Add';
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

    private getProfileNumber(employeeType: string) {
        switch (employeeType) {
            case 'Admin':
                return 1;
            case 'Rep':
                return 2;
            case 'Buyer':
                return 3;
            default:
                throw new Error(`Unknown profile: ${employeeType}`);
        }
    }

    public getFilterRule(): FilterRule {
        return { ...this.filterRule, Profile: this.getProfileName(this.filterRule.EmployeeType) };
    }

    private setResourceOptions() {

        // predicate that takes a resource and returns true only if there isn't a filter rule with the same resource and profile (as the profile in this.filterRule). this does not apply for PermissionSet=Online and will always return true in that case
        const filterProfileFilterCombination = (resource: Collection) => {
            return this.filterRule.PermissionSet == "Online" || !this.filterRuleList.some((filterRule) => filterRule.Resource === resource.Name && filterRule.EmployeeType === this.filterRule.EmployeeType);
        }

        // a predicate that takes a resource and returns true only if there is at least another resource with a Resource field that points to it
        const resourceIsReferenced = (resource: Collection) => {
            return this.resources.some((resource2) =>
                resource2.Fields && Object.keys(resource2.Fields).some((field) =>
                    resource2.Fields[field].Type === 'Resource' && resource2.Fields[field].Resource === resource.Name && resource2.Fields[field].AddonUUID === resource.AddonUUID));
        }

        // filter the resources using the predicates above
        this.resourceOptions = this.filterRule.EmployeeType ? this.resources.filter((resource) => filterProfileFilterCombination(resource) && resourceIsReferenced(resource)).map((resource) => resource.Name) : [];
    }

    private setFilterOptions() {
        // predicate that takes a filter object and returns true only if its "Field" field is a resource field that points to the chosen resource. However, if the Field=Key, it should be considered as a reference to the resource itself
        const filterByResourceField = (filterObject: FilterObject) => {
            const field = filterObject.Field;
            const resource = this.resources.find((resource) => resource.Name === filterObject.Resource);
            return field === "Key" ?

                filterObject.Resource === this.chosenResource.Name :

                resource && resource.Fields && Object.keys(resource.Fields).some((fieldKey) => fieldKey === field && resource.Fields[fieldKey].Type === 'Resource' && resource.Fields[fieldKey].Resource === this.chosenResource.Name);
        }

        // predicate that takes a filter object and returns true only if there isn't a filter rule with the same resource, profile, permissionSet and filter (as the filter in this.filterRule).
        const filterProfileFilterCombination = (filterObject: FilterObject) => {
            return !this.filterRuleList.some((filterRule) => filterRule.Resource === this.filterRule.Resource && filterRule.EmployeeType === this.filterRule.EmployeeType && filterRule.PermissionSet === this.filterRule.PermissionSet && filterRule.Filter === filterObject.Key);
        }

        this.filterOptions = this.filterRule.Resource ? this.filterObjectList.filter((filterObject) => filterByResourceField(filterObject) && filterProfileFilterCombination(filterObject)).map((filterObject) => filterObject.Name) : [];
    }

    public init(): void {
        if (this.filterRule?.EmployeeType) {
            this.setResourceOptions();
        }

        if (this.filterRule?.Resource) {
            this.chosenResource = this.resources.find((resource) => resource.Name === this.filterRule.Resource);
            this.setFilterOptions();
        }
    }

    //#region setters

    public setProfile(profile: string) {
        this.filterRule.EmployeeType = this.getProfileNumber(profile);
        this.setResource('');
        this.setResourceOptions();
    }

    public setResource(resource: string) {
        this.filterRule.Resource = resource;
        this.chosenResource = this.resources.find((resource) => resource.Name === this.filterRule.Resource);
        this.setFilter('');
        this.setFilterOptions();
    }

    public setFilter(filter: string) {
        const chosenFilterObject = this.filterObjectList.find((filterObject) => filterObject.Name === filter);
        this.filterRule.Filter = chosenFilterObject ? chosenFilterObject.Key : '';
        this.filterRule.FilterName = chosenFilterObject ? chosenFilterObject.Name : '';
    }

    // #endregion

    private stringArrayToOptionsArray(array: string[]): any[] {
        return array.map((item) => {
            return {
                Key: item,
                Value: item
            }
        })
    }

    private getProfileOptions(): {
        Key: string;
        Value: string;
    }[] {
        return this.stringArrayToOptionsArray(this.profileOptions);
    }

    private getResourceOptions(): {
        Key: string;
        Value: string;
    }[] {
        return this.stringArrayToOptionsArray(this.resourceOptions);
    }

    private getFilterOptions(): {
        Key: string;
        Value: string;
    }[] {
        return this.stringArrayToOptionsArray(this.filterOptions);
    }

    public async save(): Promise<FilterRule> {
        return await this.febulaService.upsertFilterRule(this.filterRule);
    }

    public getDataView(): IPepGenericFormDataView {
        const profileField: IPepGenericFormDataViewField =
            {
                "FieldID": "Profile",
                "Type": "ComboBox",
                "OptionalValues": this.getProfileOptions(),
                "AdditionalProps": { "emptyOption": false },
                "Title": "Profile",
                "Mandatory": true,
                "ReadOnly": this.mode === 'Edit',
                "Layout": {
                    "Origin": {
                        "X": 0,
                        "Y": 0
                    },
                    "Size": {
                        "Width": 1,
                        "Height": 0
                    }
                },
                "Style": {
                    "Alignment": {
                        "Horizontal": "Stretch",
                        "Vertical": "Stretch"
                    }
                }
            } as IPepGenericFormDataViewField;

        const resourceField: IPepGenericFormDataViewField =
            {
                "FieldID": "Resource",
                "Type": "ComboBox",
                "OptionalValues": this.getResourceOptions(),
                "AdditionalProps": { "emptyOption": false },
                "Title": "Resource",
                "Mandatory": true,
                "ReadOnly": this.mode === 'Edit',
                "Layout": {
                    "Origin": {
                        "X": 0,
                        "Y": 1
                    },
                    "Size": {
                        "Width": 1,
                        "Height": 0
                    }
                }
            } as IPepGenericFormDataViewField;

        const filterField: IPepGenericFormDataViewField = {
            "FieldID": "FilterName",
            "Type": "ComboBox",
            "OptionalValues": this.getFilterOptions(),
            "AdditionalProps": { "emptyOption": false },
            "Title": "Filter",
            "Mandatory": true,
            "ReadOnly": false,
            "Layout": {
                "Origin": {
                    "X": 0,
                    "Y": 2
                },
                "Size": {
                    "Width": 1,
                    "Height": 0
                }
            },
            "Style": {
                "Alignment": {
                    "Horizontal": "Stretch",
                    "Vertical": "Stretch"
                }
            }
        } as IPepGenericFormDataViewField;

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
                profileField,
                resourceField,
                filterField
            ],
            "Rows": []
        }
    }

}