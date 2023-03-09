import { Client } from "@pepperi-addons/debug-server/dist";
import { AddonDataScheme, Collection } from "@pepperi-addons/papi-sdk";
import { filterRuleJsonschema, filterRuleSchema, filterRuleSchemaName } from "../schemas-definition";
import { FilterObject, FilterRule } from "../../shared/types";
import { BasicTableService } from "./basic-table.service";
import { FilterObjectService } from "./filter-object.service";

export class FilterRuleService extends BasicTableService<FilterRule>{
    schemaName: string;
    schema: AddonDataScheme;
    jsonSchemaToValidate: any;
    filterObjectService: FilterObjectService;
    chosenResource?: Collection;

    constructor(client: Client, ownerUUID?: string, secretKey?: string) {
        super(client, ownerUUID, secretKey);
        this.schemaName = filterRuleSchemaName;
        this.schema = filterRuleSchema;
        this.jsonSchemaToValidate = filterRuleJsonschema;
        this.filterObjectService = new FilterObjectService(client, ownerUUID, secretKey);
    }

    // a predicate that takes a resource and returns true only if there is at least another resource with a Resource field that points to it
    private resourceIsReferenced = (resource: Collection) => {
        return this.resources!.some((resource2) =>
            resource2.Fields && Object.keys(resource2.Fields).some((field) =>
                resource2.Fields![field].Type === 'Resource' && resource2.Fields![field].Resource === resource.Name && resource2.Fields![field].AddonUUID === resource.AddonUUID));
    }

    // predicate that takes a filter object and returns true only if its "Field" field is a resource field that points to the chosen resource. However, if the Field=Key, it should be considered as a reference to the resource itself
    private filterByResourceField = (filterObject: FilterObject) => {
        const field = filterObject.Field;
        const resource = this.resources!.find((resource) => resource.Name === filterObject.Resource);
        return field === "Key" ?

            filterObject.Resource === this.chosenResource!.Name :

            resource && resource.Fields && Object.keys(resource.Fields).some((fieldKey) => fieldKey === field && resource.Fields![fieldKey].Type === 'Resource' && resource.Fields![fieldKey].Resource === this.chosenResource!.Name);
    }

    // validate that reference filter exists and that it is a filter for the chosen resource
    async validateFilter(addonData: FilterRule): Promise<void> {
        if (addonData.Filter) {
            const referencedFilterObjectKey = addonData.Filter;
            try {
                // validate that referenced key exist
                const returnedKeys = await this.filterObjectService.getByKeys([referencedFilterObjectKey])
                const referencedFilterObject = returnedKeys[0];
                if (!referencedFilterObject) {
                    throw new Error(`Filter validation failed for ${this.schemaName} object: ${JSON.stringify(addonData)}\nKey: ${referencedFilterObjectKey} not found.`);
                }

                // validate that the referenced filter is for the chosen resource
                if (!this.filterByResourceField(referencedFilterObject)) {
                    throw new Error(`Filter validation failed for ${this.schemaName} object: ${JSON.stringify(addonData)}\nKey: ${referencedFilterObjectKey} is not a filter for the chosen resource.`);
                }
            }
            catch (ex) {
                throw ex;
            }
        }
    }

    async validateProfileFilterCombination(addonData: FilterRule): Promise<void> {
        // validate that the combination of profile and filter is unique
        const filterRules = await this.get({ where: `Resource like '${addonData.Resource}' and EmployeeType=${addonData.EmployeeType}` })
        if (filterRules.length > 0) {
            // check if the filter is the same by comparing the keys
            const filterRule = filterRules[0];
            if (filterRule.Key !== addonData.Key) {
                throw new Error(`Validation failed for ${this.schemaName} object: ${JSON.stringify(addonData)}\nProfile and filter combination must be unique.`);
            }
        }
    }

    // validate that resource exist and that is referenced by another resource
    async validateResource(addonData: FilterRule): Promise<void> {
        // if resources is undefined, get all resources
        await this.initResources();
        const filteredResources = this.resources!.filter(this.resourceIsReferenced);

        // check if the chosen resource exist in the resources array
        const resource = filteredResources!.find((resource) => resource.Name === addonData.Resource);
        if (!resource) {
            throw new Error(`Resource validation failed for ${this.schemaName} object: ${JSON.stringify(addonData)}\nResource: ${addonData.Resource} not found, or not referenced by another resource.`);
        }
        this.chosenResource = resource;
    }

    async validateData(addonData: FilterRule): Promise<void> {
        // Do not change the order of the validations. The order is important.

        // validate schema
        await this.validateSchema(addonData);

        // validate profile and filter combination
        await this.validateProfileFilterCombination(addonData);

        // validate resource
        await this.validateResource(addonData);

        // validate Filter
        await this.validateFilter(addonData);
    }

}