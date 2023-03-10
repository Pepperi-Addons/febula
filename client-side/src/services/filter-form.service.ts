import { IPepGenericFormDataView } from "@pepperi-addons/ngx-composite-lib/generic-form";
import { PepAddonService } from "@pepperi-addons/ngx-lib";
import { BaseFormDataViewField, Collection } from "@pepperi-addons/papi-sdk/dist/entities";
import { FilterObject, FilterRule } from "../../../shared/types";
import { FomoService } from "./fomo.service";

export class FilterFormService {

    fomoService: FomoService;
    mode: 'Add' | 'Edit'
    private filterObject: FilterObject;
    private resources: Collection[];
    private previousFilters: FilterObject[];
    private resourceOptions: string[] = [];
    private fieldOptions: string[] = [];
    private previousFieldOptions: string[] = [];
    private previousFilterOptions: string[] = [];
    private chosenResource: Collection;
    private filterObjectList: FilterObject[];

    constructor(private pepAddonService: PepAddonService, filterObjectList: FilterObject[], resourceList: Collection[], filterObject?: FilterObject) {
        this.fomoService = new FomoService(pepAddonService);
        this.filterObjectList = filterObjectList;
        this.resources = resourceList.filter(this.filterAtLeastTwoResources);
        this.filterObject = filterObject ? filterObject : {
            Name: '',
            Resource: '',
            Field: '',
            PreviousField: '',
            PreviousFilter: ''
        };
        this.mode = filterObject ? 'Edit' : 'Add';
    }

    // returns true if collection has at least 2 fields of type 'Resource'
    private filterAtLeastTwoResources = (resource: Collection): boolean => {
        if (resource.Fields) {
            let count = 0;
            for (const field of Object.values(resource.Fields)) {
                if ((field as any).Type === 'Resource') {
                    count++;
                }
            }
            return count >= 2;
        }
        return false;
    }

    getFilterObject(): FilterObject {
        return this.filterObject
    }

    private setResourceOptions() {
        this.resourceOptions = this.resources.map((resource) => resource.Name);
    }

    private setFieldOptions() {
        this.fieldOptions = this.filterObject.Resource ? Object.keys(this.chosenResource.Fields).filter((field) => this.chosenResource.Fields[field].Type === 'Resource') : [];
    }

    // same as setFieldOptions only excludes the field that was chosen as the previous field
    private setPreviousFieldOptions() {
        this.previousFieldOptions = this.filterObject.Field ? this.fieldOptions.filter((field) => field !== this.filterObject.Field) : [];
    }

    private setPreviousFilterOptions() {
        if (!this.filterObject.PreviousField) {
            this.previousFilterOptions = [];
            return;
        }
        const previousFieldResourceName = this.chosenResource.Fields[this.filterObject.PreviousField].Resource;
        this.previousFilters = this.getFilterObjectsOfResource(previousFieldResourceName);
        this.previousFilterOptions = this.previousFilters.map((filter) => filter.Name);
    }

    getFilterObjectsOfResource(previousFieldResourceName: string): FilterObject[] {
        return this.filterObjectList.filter((filterObject) => filterObject.Resource === previousFieldResourceName);
    }


    init(): void {
        this.setResourceOptions();
        if (this.filterObject.Resource) {
            this.chosenResource = this.resources.find((resource) => resource.Name === this.filterObject.Resource);
            this.setFieldOptions();
        }
        if (this.filterObject.Field) {
            this.setPreviousFieldOptions();
        }
        if (this.filterObject.PreviousField) {
            this.setPreviousFilterOptions();
        }

    }

    //#region setters
    setName(name: string) {
        this.filterObject.Name = name;
    }

    setResource(resource: string) {
        this.filterObject.Resource = resource;
        this.chosenResource = this.resources.find((resource) => resource.Name === this.filterObject.Resource);
        this.setField('');
        this.setFieldOptions();
    }

    setField(field: string) {
        this.filterObject.Field = field;
        this.setPreviousField('');
        this.setPreviousFieldOptions();
    }

    setPreviousField(previousField: string) {
        this.filterObject.PreviousField = previousField;
        this.filterObject.PreviousFilter = '';
        this.filterObject.PreviousFilterName = '';
        this.setPreviousFilterOptions();
    }

    setPreviousFilter(previousFilter: string) {
        const previousFilterObject = this.previousFilters.find((filter) => filter.Name === previousFilter);
        this.filterObject.PreviousFilter = previousFilterObject ? previousFilterObject.Key : '';
        this.filterObject.PreviousFilterName = previousFilterObject ? previousFilterObject.Name : '';
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
    getResourceOptions(): {
        Key: string;
        Value: string;
    }[] {
        return this.stringArrayToOptionsArray(this.resourceOptions);
    }

    getFieldOptions(): {
        Key: string;
        Value: string;
    }[] {
        return this.stringArrayToOptionsArray(this.fieldOptions);
    }

    getPreviousFieldOptions(): {
        Key: string;
        Value: string;
    }[] {
        return this.stringArrayToOptionsArray(this.previousFieldOptions);
    }

    getPreviousFilterOptions(): {
        Key: string;
        Value: string;
    }[] {
        return this.stringArrayToOptionsArray(this.previousFilterOptions);
    }

    async save(): Promise<FilterObject> {
        return await this.fomoService.upsertFilterObject(this.filterObject);
    }

    getDataView(): IPepGenericFormDataView {
        const nameField: BaseFormDataViewField =
        {
            "FieldID": "Name",
            "Type": "TextBox",
            "Title": "Name",
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
        }

        const resourceField: BaseFormDataViewField =
            {
                "FieldID": "Resource",
                "Type": "ComboBox",
                "OptionalValues": this.getResourceOptions(),
                "AdditionalProps": { "emptyOption": false },
                "Title": "Resource",
                "Mandatory": true,
                "ReadOnly": (this.mode === 'Edit'),
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

        // haha fieldFieldFieldFieldFieldFieldFieldFi....
        const fieldField: BaseFormDataViewField = {
            "FieldID": "Field",
            "Type": "ComboBox",
            "OptionalValues": this.getFieldOptions(),
            "AdditionalProps": { "emptyOption": false },
            "Title": "Field which contains the required values (Only resource fields can be used)",
            "Mandatory": true,
            "ReadOnly": (this.mode === 'Edit'),
            "Layout": {
                "Origin": {
                    "X": 1,
                    "Y": 1
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

        const separatorField: BaseFormDataViewField = {
            "FieldID": "FilterRuleSeparator",
            "Type": "Separator",
            "Title": "Filter rule",
            "Mandatory": false,
            "ReadOnly": true,
            "Layout": {
                "Origin": {
                    "X": 0,
                    "Y": 2
                },
                "Size": {
                    "Width": 2,
                    "Height": 0
                }
            },
            "Style": {
                "Alignment": {
                    "Horizontal": "Stretch",
                    "Vertical": "Stretch"
                }
            }
        }

        // haha previousFieldFieldFieldFieldFieldFi...
        const previousFieldField: BaseFormDataViewField = {
            "FieldID": "PreviousField",
            "Type": "ComboBox",
            "OptionalValues": this.getPreviousFieldOptions(),
            "AdditionalProps": { "emptyOption": false },
            "Title": "Field",
            "Mandatory": true,
            "ReadOnly": false,
            "Layout": {
                "Origin": {
                    "X": 0,
                    "Y": 3
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

        const previousFilterField: BaseFormDataViewField = {
            "FieldID": "PreviousFilterName",
            "Type": "ComboBox",
            "OptionalValues": this.getPreviousFilterOptions(),
            "AdditionalProps": { "emptyOption": false },
            "Title": "in",
            "Mandatory": true,
            "ReadOnly": false,
            "Layout": {
                "Origin": {
                    "X": 1,
                    "Y": 3
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
                nameField,
                resourceField,
                fieldField,
                separatorField,
                previousFieldField,
                previousFilterField
            ],
            "Rows": []
        }
    }

}