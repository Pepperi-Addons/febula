import { Client } from "@pepperi-addons/debug-server/dist";
import { AddonDataScheme, Collection } from "@pepperi-addons/papi-sdk";
import { filterObjectJsonschema, filterObjectSchema, filterObjectSchemaName } from "../schemas-definition";
import { BasicFilterRuleData, FilterObject } from "../../shared/types";
import { BasicTableService } from "./basic-table.service";

export class FilterObjectService extends BasicTableService<FilterObject>{
    schemaName: string;
    schema: AddonDataScheme;
    jsonSchemaToValidate: any;
    chosenResource?: Collection;

    constructor(client: Client, ownerUUID?: string, secretKey?: string) {
        super(client, ownerUUID, secretKey);
        this.schemaName = filterObjectSchemaName;
        this.schema = filterObjectSchema;
        this.jsonSchemaToValidate = filterObjectJsonschema;
    }

    // returns true if collection has at least 2 fields of type 'Resource'
    // currently not in use
    private filterAtLeastTwoResources = (resource: Collection): boolean => {
        if (resource.Fields) {
            let count = 0;
            for (const field of Object.values(resource.Fields)) {
                if ((field as any).Type === 'Resource') {
                    count++;
                }
            }
            return count >= 2;
        }
        return false;
    }

    // checks that a given field exists in the chosen resource and that the field type is 'Resource'
    private isFieldValid(addonData: FilterObject, fieldName: string, previous = false): void {
        // make sure chosenResource is defined
        if (!this.chosenResource) {
            throw new Error(`${previous ? "Previous" : ""}Field validation failed for ${this.schemaName} object: ${JSON.stringify(addonData)} fieldName: ${fieldName}\nResource: ${addonData.Resource} not found.`);
        }

        // NOTE - check that field was provided is done in the json schema

        // check if the chosen field exist in the chosen resource
        const field = this.chosenResource.Fields![fieldName];
        if (!field) {
            throw new Error(`${previous ? "Previous" : ""}Field validation failed for ${this.schemaName} object: ${JSON.stringify(addonData)} fieldName: ${fieldName}\nField: ${fieldName} not found in resource: ${addonData.Resource}.`);
        }

        // the chosen field should either be of type 'Resource' or the field name should be 'Key'
        if ((field as any).Type !== 'Resource') {
            throw new Error(`${previous ? "Previous" : ""}Field validation failed for ${this.schemaName} object: ${JSON.stringify(addonData)} fieldName: ${fieldName}\nField: ${fieldName} in resource: ${addonData.Resource} should either be of type 'Resource' or the field name should be 'Key'.`);
        }
    }

    // gets filter by key
    private async getByKey(key: string): Promise<FilterObject> {
        try {
            const returnedKeys = await this.getByKeys([key]);
            const referencedFilterObject = returnedKeys[0];
            return referencedFilterObject;
        }
        catch (ex) {
            throw new Error(`getByKey failed to get Filter by key: ${key}\n${ex}`);
        }
    }

    // validate that name is valid
    validateName(addonData: FilterObject): void {
        if (!addonData.Name) {
            throw new Error(`Name validation failed for ${this.schemaName} object: ${JSON.stringify(addonData)}\nName is empty.`);
        }
    }

    // validate that resource exist
    async validateResource(addonData: FilterObject): Promise<void> {
        // if resources is undefined, get all resources and filter only the ones with at least 2 fields of type 'Resource'
        await this.initResources();

        // check if the chosen resource exist in the resources array
        const resource = this.resources!.find((resource) => resource.Name === addonData.Resource);
        if (!resource) {
            throw new Error(`Resource validation failed for ${this.schemaName} object: ${JSON.stringify(addonData)}\nResource: ${addonData.Resource} not found.`);
        }
        this.chosenResource = resource;
    }

    // validate that field exist in the chosen resource and that the field type is 'Resource'
    validateField(addonData: FilterObject): void {
        this.isFieldValid(addonData, addonData.Field);
    }

    // validate that previous field exist in the chosen resource and that the field type is 'Resource'
    validatePreviousField(addonData: FilterObject): void {
        // if previous field is empty, no need to validate
        if (!addonData.PreviousField) {
            return;
        }

        this.isFieldValid(addonData, addonData.PreviousField, true);
    }

    // validate that PreviousFilter exist, and that its resource is the same as the previous field resource
    async validatePreviousFilter(addonData: FilterObject): Promise<void> {
        // if previous filter is empty, no need to validate
        if (!addonData.PreviousFilter) {
            return;
        }

        // validate that referenced key exist
        const referencedFilterObject = await this.getByKey(addonData.PreviousFilter);
        if (!referencedFilterObject) {
            throw new Error(`PreviousFilter validation failed for ${this.schemaName} object: ${JSON.stringify(addonData)}\nFilter with key: ${addonData.PreviousFilter} not found.`);
        }

        // validate that referenced filter resource is the same as the previous field resource
        const previousFieldResourceName = this.chosenResource!.Fields![addonData.PreviousField!].Resource;
        const previousFilterField = referencedFilterObject.Field;
        const previousFilterResource = referencedFilterObject.Resource;
        const previousChosenResource = this.resources!.find((resource) => resource.Name === previousFilterResource);
        if (!previousChosenResource) {
            throw new Error(`PreviousFilter validation failed for ${this.schemaName} object: ${JSON.stringify(addonData)}\nFilter with key: ${addonData.PreviousFilter} has a resource ("${previousFilterResource}") that does not exist.`);
        }
        if (previousFieldResourceName !== previousChosenResource.Fields![previousFilterField].Resource) {
            throw new Error(`PreviousFilter validation failed for ${this.schemaName} object: ${JSON.stringify(addonData)}\nThe field of filter with key: ${addonData.PreviousFilter} is ${previousFilterField} and it references a different resource ("${previousChosenResource.Fields![previousFilterField].Resource}") than the previous field ("${previousFieldResourceName}").`);
        }
    }

    async validateData(addonData: FilterObject): Promise<void> {
        // these validations are in order. Do not change the order or else things will break.
        this.validateKey(addonData);
        await this.validateSchema(addonData);
        this.validateName(addonData);
        await this.validateResource(addonData);
        this.validateField(addonData);
        this.validatePreviousField(addonData);
        await this.validatePreviousFilter(addonData);
    }

    async upsertBasicFilterObjects(): Promise<BasicFilterRuleData[]> {
        try {
            const allFilterObjects = await this.get();

            const currentUserFilterObject: FilterObject = {
                Name: 'Current user',
                Resource: 'users',
                Field: 'Key'
            };

            await this.getSystemFilterObjectKey(allFilterObjects, currentUserFilterObject);
            const usersResult = await this.upsert(currentUserFilterObject, true);

            const currentUserResourceAndKey = {
                Resource: 'users',
                Key: usersResult.Key
            };

            const assignedAccountsFilterObject: FilterObject = {
                Name: 'Assigned accounts',
                Resource: 'account_users',
                Field: 'Account',
                PreviousFilter: usersResult.Key,
                PreviousField: 'User'
            };

            await this.getSystemFilterObjectKey(allFilterObjects, assignedAccountsFilterObject);
            const accountUsersResult = await this.upsert(assignedAccountsFilterObject, true);

            const assignedAccountsResourceAndKey = {
                Resource: 'accounts',
                Key: accountUsersResult.Key
            };

            const profileFilterObject = {
                Name: 'Current User Profile',
                Resource: 'users',
                Field: 'Profile',
                PreviousFilter: usersResult.Key,
                PreviousField: 'Key'
            };

            await this.getSystemFilterObjectKey(allFilterObjects, profileFilterObject);
            const profileResult = await this.upsert(profileFilterObject, true);

            const profileResourceAndKey = {
                Resource: 'profiles',
                Key: profileResult.Key
            };

            return [currentUserResourceAndKey, assignedAccountsResourceAndKey, profileResourceAndKey];
        }
        catch (error) {
            console.error(`upsertBasicFilterObjects failed: ${(error as Error).message})}`);
            throw error;
        }
    }

    /**
     * Searches for a system filter object with the same properties as the given filter object.
     * If found, update the given filter object with the system filter object's key and delete all the newer duplicate system filter objects.
     * @param currentFilterObject the filter object to search for.
     */
    private async getSystemFilterObjectKey(allFilterObjects: FilterObject[], currentFilterObject: FilterObject): Promise<void> {

        // Find all filter objects that have the same properties as the given filter object,
        // there could be more than one if Febula was upgraded/installed multiple times in the past (DI-25619).
        const systemFilterObjects = allFilterObjects.filter((filterObject) => {
            return filterObject.AddonUUID !== undefined &&
                currentFilterObject.Name === filterObject.Name &&
                currentFilterObject.Resource === filterObject.Resource &&
                currentFilterObject.Field === filterObject.Field &&
                (currentFilterObject.PreviousField === undefined || currentFilterObject.PreviousField === filterObject.PreviousField);
        });

        // If a system filter object was found, update the given filter object with the system filter object's key,
        // log and delete all the other system filter objects.
        if (systemFilterObjects.length > 0) {

            if (systemFilterObjects.length > 1) {
                console.warn(`getSystemFilterObject: found more than one (${systemFilterObjects.length}) system filter ('${currentFilterObject.Name}')`);
            }

            // Sort the system filter objects by creation time, so that the oldest one will be the first in the array.
            // This is done so that we can delete all the newer system filter objects and keep the oldest one.
            systemFilterObjects.sort((filterObjectA, filterObjectB) => {
                const creationTimeA = new Date(filterObjectA.CreationDateTime!);
                const creationTimeB = new Date(filterObjectB.CreationDateTime!);
                return creationTimeA.getTime() - creationTimeB.getTime();
            });
            currentFilterObject.Key = systemFilterObjects[0].Key;

            const filtersToDelete = systemFilterObjects.slice(1).map((filterObject) => filterObject.Key!);
            await this.delete(filtersToDelete);
        }
    }
}
