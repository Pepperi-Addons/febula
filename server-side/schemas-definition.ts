import { AddonDataScheme } from "@pepperi-addons/papi-sdk";

export const filterObjectSchemaName = 'filterObjects';
export const filterObjectSchema: AddonDataScheme = {
    Name: filterObjectSchemaName,
    Type: 'data',
    Fields: {
        Name: { Type: 'String' }, // This is the name of the filter object
        FromResource: { Type: 'String' }, // This is the name of the resource we are filtering
        Field: { Type: 'String' }, // This is the name of the field we wish to acquire from the resource
        FilterBy: { // This is the filter object
            Type: 'Object',
            Fields: {
                Field: { Type: 'String' }, // This is the name of the field we wish to filter by
                FilterObject: { Type: 'String' } // This is the name of the filter object we wish to filter by
            }
        },
        Terminal: { Type: 'Bool' } // This is a flag to indicate if this is a terminal filter object (i.e. we have reached the end of the filter chain)
    }
}

export const filterRuleSchemaName = 'filterRules';
export const filterRuleSchema: AddonDataScheme = {
    Name: filterRuleSchemaName,
    Type: 'data',
    Fields: {
        Profile: { Type: 'String' }, // This is the name of the profile this rule belongs to
        Resource: { Type: 'String' }, // This is the name of the resource we are filtering
        FilterObject: { Type: 'String' } // This is the name of the filter object we wish to filter by for this resource and profile.
    }
}