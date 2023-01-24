import { Client } from "@pepperi-addons/debug-server/dist";
import { AddonDataScheme } from "@pepperi-addons/papi-sdk";
import { filterRuleSchema, filterRuleSchemaName } from "../schemas-definition";
import { FilterRule } from "../types";
import { BasicTableService } from "./basic-table.service";

export class FilterRuleService extends BasicTableService<FilterRule>{
    schemaName: string;
    schema: AddonDataScheme;

    constructor(client: Client) {
        super(client);
        this.schemaName = filterRuleSchemaName;
        this.schema = filterRuleSchema;
    }

    validateData(addonData: FilterRule): boolean {
        //TODO: implement validation
        return true;
    }

}