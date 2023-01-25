import { Client } from "@pepperi-addons/debug-server/dist";
import { AddonDataScheme } from "@pepperi-addons/papi-sdk";
import { filterObjectJsonschema, filterObjectSchema, filterObjectSchemaName } from "../schemas-definition";
import { FilterObject } from "../types";
import { BasicTableService } from "./basic-table.service";


export class FilterObjectService extends BasicTableService<FilterObject>{
    schemaName: string;
    schema: AddonDataScheme;
    jsonSchemaToValidate: any;

    constructor(client: Client) {
        super(client);
        this.schemaName = filterObjectSchemaName;
        this.schema = filterObjectSchema;
        this.jsonSchemaToValidate = filterObjectJsonschema;
    }

    async validateReferencedKey(addonData: FilterObject): Promise<boolean> {
        // validate that referenced key exist
        if (addonData.PreviousFilter) {
            const referencedFilterObjectKey = addonData.PreviousFilter;
            try {
                const referencedFilterObject = await this.papiClient.addons.data.uuid(this.client.AddonUUID).table(this.schemaName).key(referencedFilterObjectKey).get();
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

    async validateData(addonData: FilterObject): Promise<boolean> {
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