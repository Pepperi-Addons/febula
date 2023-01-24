import { Client } from "@pepperi-addons/debug-server/dist";
import { AddonDataScheme } from "@pepperi-addons/papi-sdk";
import { filterObjectSchema, filterObjectSchemaName } from "../schemas-definition";
import { FilterObject } from "../types";
import { BasicTableService } from "./basic-table.service";

export class FilterObjectService extends BasicTableService<FilterObject>{
    schemaName: string;
    schema: AddonDataScheme;

    constructor(client: Client) {
        super(client);
        this.schemaName = filterObjectSchemaName;
        this.schema = filterObjectSchema;
    }

    validateData(addonData: FilterObject): boolean {
        //TODO: implement validation
        return true;
    }

}