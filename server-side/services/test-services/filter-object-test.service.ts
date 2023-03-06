import { Client } from "@pepperi-addons/debug-server/dist";
import { FilterObject } from "../../../shared/types";
import { BasicTableTestService } from "./basic-table-test.service";
import { v4 as uuid } from 'uuid';
import { AddonDataScheme, Collection } from "@pepperi-addons/papi-sdk";


export class FilterObjectTestService extends BasicTableTestService<FilterObject>{
    testFieldName = 'ReferenceProperty';
    testPreviousFieldName = 'ReferenceProperty2';
    functionEndpointSuffix: string;
    constructor(client: Client, debug: boolean, ownerUUID?: string, secretKey?: string) {
        super(client, debug, ownerUUID, secretKey);
        this.functionEndpointSuffix = '/api/filters';
    }

    async getTestResource(): Promise<AddonDataScheme> {
        const resource = {
            Name: this.testResourceName,
            Type: "data",
            Fields: {
                ReferenceProperty: {
                    Type: "Resource",
                    AddonUUID: this.client.AddonUUID,
                    Resource: this.testResourceName
                },
                ReferenceProperty2: {
                    Type: "Resource",
                    AddonUUID: this.client.AddonUUID,
                    Resource: this.testResourceName
                },
            },
            GenericResource: true
        }
        return resource as AddonDataScheme;
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
            Resource: options?.Resource || this.testResourceName,
            Field: options?.Field || this.testFieldName,
            PreviousField: options?.PreviousField || undefined,
            PreviousFilter: options?.PreviousFilter || undefined
        }
        return filterObject;
    }
}