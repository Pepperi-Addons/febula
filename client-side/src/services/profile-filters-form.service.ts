import { IPepGenericFormDataView } from "@pepperi-addons/ngx-composite-lib/generic-form";
import { PepAddonService } from "@pepperi-addons/ngx-lib";
import { BaseFormDataViewField, Collection } from "@pepperi-addons/papi-sdk/dist/entities";
import { FilterObject, FilterRule } from "../../../shared/types";
import { FomoService } from "./fomo.service";

export class ProfileFiltersFormService {

    fomoService: FomoService;
    mode: 'Add' | 'Edit'
    private filterRule: FilterRule;
    private resources: Collection[];
    private profileOptions: string[] = ["Admin", "Rep", "Buyer"];
    private resourceOptions: string[] = [];
    private filterOptions: string[] = [];
    private chosenResource: Collection;
    private filterObjectList: FilterObject[];
    private filterRuleList: FilterRule[];

    constructor(private pepAddonService: PepAddonService, filterRuleList: FilterRule[], filterObjectList: FilterObject[], resourceList: Collection[], filterRule?: FilterRule) {
        this.fomoService = new FomoService(pepAddonService);
        this.filterRuleList = filterRuleList;
        this.filterObjectList = filterObjectList;
        this.resources = resourceList;
        this.filterRule = filterRule ? filterRule : {
            EmployeeType: 1,
            Resource: '',
            Filter: ''
        };
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

    getFilterRule(): FilterRule {
        return { ...this.filterRule, Profile: this.getProfileName(this.filterRule.EmployeeType) };
    }

    private setResourceOptions() {

        // predicate that takes a resource and returns true only if there isn't a filter rule with the same resource and profile (as the profile in this.filterRule)
        const filterProfileFilterCombination = (resource: Collection) => {
            return !this.filterRuleList.some((filterRule) => filterRule.Resource === resource.Name && filterRule.EmployeeType === this.filterRule.EmployeeType);
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
        // predicate that takes a filter object and returns true only if its resource is the same as the chosen resource
        const filterByResource = (filterObject: FilterObject) => {
            return filterObject.Resource === this.chosenResource.Name;
        }
        this.filterOptions = this.filterRule.Resource ? this.filterObjectList.filter((filterObject) => filterByResource(filterObject)).map((filterObject) => filterObject.Name) : [];
    }

    init(): void {
        if (this.filterRule?.EmployeeType) {
            this.setResourceOptions();
        }

        if (this.filterRule?.Resource) {
            this.chosenResource = this.resources.find((resource) => resource.Name === this.filterRule.Resource);
            this.setFilterOptions();
        }
    }

    //#region setters
    setProfile(profile: string) {
        this.filterRule.EmployeeType = this.getProfileNumber(profile);
        this.setResource('');
        this.setResourceOptions();
    }

    setResource(resource: string) {
        this.filterRule.Resource = resource;
        this.chosenResource = this.resources.find((resource) => resource.Name === this.filterRule.Resource);
        this.setFilter('');
        this.setFilterOptions();
    }

    setFilter(filter: string) {
        this.filterRule.Filter = filter;
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

    getProfileOptions(): {
        Key: string;
        Value: string;
    }[] {
        return this.stringArrayToOptionsArray(this.profileOptions);
    }

    getResourceOptions(): {
        Key: string;
        Value: string;
    }[] {
        return this.stringArrayToOptionsArray(this.resourceOptions);
    }

    getFilterOptions(): {
        Key: string;
        Value: string;
    }[] {
        return this.stringArrayToOptionsArray(this.filterOptions);
    }

    async save(): Promise<FilterObject> {
        return await this.fomoService.upsertFilterRule(this.filterRule);
    }

    getDataView(): IPepGenericFormDataView {
        const profileField: BaseFormDataViewField =
            {
                "FieldID": "Profile",
                "Type": "ComboBox",
                "OptionalValues": this.getProfileOptions(),
                "AdditionalProps": { "emptyOption": false },
                "Title": "Profile",
                "Mandatory": true,
                "ReadOnly": false,
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
            } as BaseFormDataViewField;

        const resourceField: BaseFormDataViewField =
            {
                "FieldID": "Resource",
                "Type": "ComboBox",
                "OptionalValues": this.getResourceOptions(),
                "AdditionalProps": { "emptyOption": false },
                "Title": "Resource",
                "Mandatory": true,
                "ReadOnly": false,
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
            } as BaseFormDataViewField;

        const filterField: BaseFormDataViewField = {
            "FieldID": "Filter",
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
        } as BaseFormDataViewField;

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