import { Client } from "@pepperi-addons/debug-server/dist";
import { AddonDataScheme } from "@pepperi-addons/papi-sdk";
import { filterObjectSchemaName, filterRuleSchema, filterRuleSchemaName } from "../schemas-definition";
import { FilterRule } from "../types";
import { BasicTableService } from "./basic-table.service";

export class FilterRuleService extends BasicTableService<FilterRule>{
    schemaName: string;
    schema: AddonDataScheme;
    jsonSchemaToValidate: any;

    constructor(client: Client) {
        super(client);
        this.schemaName = filterRuleSchemaName;
        this.schema = filterRuleSchema;
        this.jsonSchemaToValidate = filterRuleSchema;
    }

    async validateReferencedKey(addonData: FilterRule): Promise<boolean> {
        // validate that referenced key exist
        const filterObjectResourceName = filterObjectSchemaName;
        if (addonData.Filter) {
            const referencedFilterObjectKey = addonData.Filter;
            try {
                const referencedFilterObject = await this.papiClient.addons.data.uuid(this.client.AddonUUID).table(filterObjectResourceName).key(referencedFilterObjectKey).get();
                if (!referencedFilterObject) {
                    console.warn(`Reference validation failed for ${this.schemaName} object: ${JSON.stringify(addonData)}\nKey: ${referencedFilterObjectKey} not found.`);
                    return false;
                }
            }
            catch (ex) {
                console.warn(`Reference validation failed for ${this.schemaName} object: ${JSON.stringify(addonData)}\nKey: ${referencedFilterObjectKey} not found.`);
                return false;
            }
        }
        return true;
    }

    async validateData(addonData: FilterRule): Promise<boolean> {
        // validate schema
        const schemaValidationResult = await this.validateSchema(addonData);
        if (!schemaValidationResult) {
            return false;
        }

        // validate referenced key
        const referencedKeyValidationResult = await this.validateReferencedKey(addonData);
        if (!referencedKeyValidationResult) {
            return false;
        }

        return true;
    }

}