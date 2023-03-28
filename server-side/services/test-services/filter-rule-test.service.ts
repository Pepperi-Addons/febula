import { Client } from "@pepperi-addons/debug-server/dist";
import { FilterRule, PermissionSetValues } from "../../../shared/types";
import { BasicTableTestService } from "./basic-table-test.service";
import { FilterObjectTestService } from "./filter-object-test.service";

export class FilterRuleTestService extends BasicTableTestService<FilterRule>{
    functionEndpointSuffix: string;
    filterObjectTestService: FilterObjectTestService;

    constructor(client: Client, debug: boolean, filterObjectTestService: FilterObjectTestService, ownerUUID?: string, secretKey?: string) {
        super(client, debug, ownerUUID, secretKey);
        this.functionEndpointSuffix = '/api/profile_filters';
        this.filterObjectTestService = filterObjectTestService;
    }

    async createObject(options?: {
        Key?: string,
        EmployeeType?: 1 | 2 | 3,
        Resource?: string,
        Filter?: string,
        PermissionSet?: PermissionSetValues
    }): Promise<FilterRule> {
        const filterRule: FilterRule = {
            Key: options?.Key || undefined,
            EmployeeType: options?.EmployeeType || (Math.floor(Math.random() * 3) + 1) as 1 | 2 | 3,
            Resource: options?.Resource || this.testResourceName,
            Filter: options?.Filter || (await this.filterObjectTestService.upsert(await this.filterObjectTestService.createObject())).Key!,
            PermissionSet: options?.PermissionSet
        }
        return filterRule;
    }
}