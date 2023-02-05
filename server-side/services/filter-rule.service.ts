import { Client } from "@pepperi-addons/debug-server/dist";
import { AddonDataScheme } from "@pepperi-addons/papi-sdk";
import { filterRuleJsonschema, filterRuleSchema, filterRuleSchemaName } from "../schemas-definition";
import { FilterRule } from "../../types";
import { BasicTableService } from "./basic-table.service";
import { FilterObjectService } from "./filter-object.service";

export class FilterRuleService extends BasicTableService<FilterRule>{
    schemaName: string;
    schema: AddonDataScheme;
    jsonSchemaToValidate: any;
    filterObjectService: FilterObjectService;

    constructor(client: Client, ownerUUID?: string, secretKey?: string) {
        super(client, ownerUUID, secretKey);
        this.schemaName = filterRuleSchemaName;
        this.schema = filterRuleSchema;
        this.jsonSchemaToValidate = filterRuleJsonschema;
        this.filterObjectService = new FilterObjectService(client, ownerUUID, secretKey);
    }

    async validateReferencedKey(addonData: FilterRule): Promise<void> {
        // validate that referenced key exist
        if (addonData.Filter) {
            const referencedFilterObjectKey = addonData.Filter;
            try {
                const referencedFilterObject = await this.filterObjectService.getByKey(referencedFilterObjectKey);
                if (!referencedFilterObject) {
                    throw new Error(`Reference validation failed for ${this.schemaName} object: ${JSON.stringify(addonData)}\nKey: ${referencedFilterObjectKey} not found.`);
                }
            }
            catch (ex) {
                throw new Error(`Reference validation failed for ${this.schemaName} object: ${JSON.stringify(addonData)}\nKey: ${referencedFilterObjectKey} not found.`);
            }
        }
    }

    async validateData(addonData: FilterRule): Promise<void> {
        // validate schema
        await this.validateSchema(addonData);

        // validate referenced key
        await this.validateReferencedKey(addonData);
    }

}