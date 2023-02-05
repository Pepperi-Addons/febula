import { Client } from "@pepperi-addons/debug-server/dist";
import { FilterObject } from "../../../types";
import { BasicTableTestService } from "./basic-table-test.service";
import { v4 as uuid } from 'uuid';


export class FilterObjectTestService extends BasicTableTestService<FilterObject>{

    functionEndpointSuffix: string;
    constructor(client: Client, debug: boolean, ownerUUID?: string, secretKey?: string) {
        super(client, debug, ownerUUID, secretKey);
        this.functionEndpointSuffix = '/api/filters';
    }

    private getShortUUID() {
        return uuid().substring(0, 8);
    }

    private getFilterObjectName() {
        return `TestFilterObject_${this.getShortUUID()}`;
    }

    async createObject(options?: {
        Key?: string,
        Name?: string,
        Resource?: string,
        Field?: string,
        PreviousField?: string,
        PreviousFilter?: string
    }): Promise<FilterObject> {
        const filterObject: FilterObject = {
            Key: options?.Key || undefined,
            Name: options?.Name || this.getFilterObjectName(),
            Resource: options?.Resource || "TestResource",
            Field: options?.Field || "TestField",
            PreviousField: options?.PreviousField || undefined,
            PreviousFilter: options?.PreviousFilter || undefined
        }
        return filterObject;
    }
}