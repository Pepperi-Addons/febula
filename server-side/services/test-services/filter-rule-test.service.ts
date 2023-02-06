import { Client } from "@pepperi-addons/debug-server/dist";
import { FilterRule } from "../../../shared/types";
import { BasicTableTestService } from "./basic-table-test.service";
import { FilterObjectTestService } from "./filter-object-test.service";

export class FilterRuleTestService extends BasicTableTestService<FilterRule>{
    functionEndpointSuffix: string;
    filterObjectTestService: FilterObjectTestService;

    constructor(client: Client, debug: boolean, ownerUUID?: string, secretKey?: string) {
        super(client, debug, ownerUUID, secretKey);
        this.functionEndpointSuffix = '/api/profile_filters';
        this.filterObjectTestService = new FilterObjectTestService(client, debug, ownerUUID, secretKey);
    }

    async createObject(options?: {
        Key?: string,
        EmployeeType?: 1 | 2 | 3,
        Resource?: string,
        Filter?: string
    }): Promise<FilterRule> {
        const filterRule: FilterRule = {
            Key: options?.Key || undefined,
            EmployeeType: options?.EmployeeType || (Math.floor(Math.random() * 3) + 1) as 1 | 2 | 3,
            Resource: options?.Resource || "TestResource",
            Filter: options?.Filter || (await this.filterObjectTestService.upsert(await this.filterObjectTestService.createObject())).Key!,
        }
        return filterRule;
    }
}