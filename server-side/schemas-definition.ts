import { AddonDataScheme } from "@pepperi-addons/papi-sdk";
import { AddonUUID } from "../addon.config.json"

export const filterObjectSchemaName = 'filterObjects';
export const filterObjectSchema: AddonDataScheme = {
    Name: filterObjectSchemaName,
    Type: 'data',
    Fields: {
        Name: { Type: 'String' }, // This is the name of the filter object
        Resource: { Type: 'String' }, // This is the name of the resource we are filtering
        Field: { Type: 'String' }, // This is the name of the field we wish to acquire from the resource
        PreviousField: { Type: 'String' }, // This is the name of the field we wish to filter by
        PreviousFilter: {
            Type: "Resource",
            AddonUUID: AddonUUID,
            Resource: filterObjectSchemaName
        } // This is the key of the filter object we wish to filter by
    },
}

export const filterRuleSchemaName = 'filterRules';
export const filterRuleSchema: AddonDataScheme = {
    Name: filterRuleSchemaName,
    Type: 'data',
    Fields: {
        Profile: { Type: 'String' }, // This is the name of the profile this rule belongs to
        Resource: { Type: 'String' }, // This is the name of the resource we are filtering
        Filter: {
            Type: "Resource",
            AddonUUID: AddonUUID,
            Resource: filterObjectSchemaName
        } // This is the key of the filter object we wish to filter by for this resource and profile.
    }
}