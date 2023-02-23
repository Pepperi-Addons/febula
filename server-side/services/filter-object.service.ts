import { Client } from "@pepperi-addons/debug-server/dist";
import { AddonDataScheme } from "@pepperi-addons/papi-sdk";
import { filterObjectJsonschema, filterObjectSchema, filterObjectSchemaName } from "../schemas-definition";
import { FilterObject } from "../../shared/types";
import { BasicTableService } from "./basic-table.service";


export class FilterObjectService extends BasicTableService<FilterObject>{
    schemaName: string;
    schema: AddonDataScheme;
    jsonSchemaToValidate: any;

    constructor(client: Client, ownerUUID?: string, secretKey?: string) {
        super(client, ownerUUID, secretKey);
        this.schemaName = filterObjectSchemaName;
        this.schema = filterObjectSchema;
        this.jsonSchemaToValidate = filterObjectJsonschema;
    }

    async validateReferencedKey(addonData: FilterObject): Promise<void> {
        // validate that referenced key exist
        if (addonData.PreviousFilter) {
            const referencedFilterObjectKey = addonData.PreviousFilter;
            try {
                const referencedFilterObject = await this.getByKeys([referencedFilterObjectKey])[0];
                if (!referencedFilterObject) {
                    throw new Error(`Reference validation failed for ${this.schemaName} object: ${JSON.stringify(addonData)}\nKey: ${referencedFilterObjectKey} not found.`);
                }
            }
            catch (ex) {
                throw new Error(`Reference validation failed for ${this.schemaName} object: ${JSON.stringify(addonData)}\nKey: ${referencedFilterObjectKey} not found.`);
            }
        }
    }

    async validateData(addonData: FilterObject): Promise<void> {
        // validate schema
        await this.validateSchema(addonData);

        // validate referenced key
        await this.validateReferencedKey(addonData);
    }
}