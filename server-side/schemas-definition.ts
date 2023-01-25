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
export const filterObjectJsonschema = {
    "type": "object",
    "properties": {
        "Key": {
            "type": "string"
        },
        "Name": {
            "type": "string"
        },
        "Resource": {
            "type": "string"
        },
        "Field": {
            "type": "string"
        },
        "PreviousField": {
            "type": "string"
        },
        "PreviousFilter": {
            "type": "string"
        }
    },
    "required": [
        "Name",
        "Resource",
        "Field"
    ]
}

export const filterRuleSchemaName = 'filterRules';
export const filterRuleSchema: AddonDataScheme = {
    Name: filterRuleSchemaName,
    Type: 'data',
    Fields: {
        EmployeeType: { Type: 'Integer' }, // This is the type of the profile this rule belongs to. 1 = Admin, 2 = Rep, 3 = Buyer
        Resource: { Type: 'String' }, // This is the name of the resource we are filtering
        Filter: {
            Type: "Resource",
            AddonUUID: AddonUUID,
            Resource: filterObjectSchemaName
        } // This is the key of the filter object we wish to filter by for this resource and profile.
    }
}
export const filterRuleJsonschema = {
    "type": "object",
    "properties": {
        "Key": {
            "type": "string"
        },
        "EmployeeType": { // only 1, 2 or 3
            "type": "integer",
            "minimum": 1,
            "maximum": 3
        },
        "Resource": {
            "type": "string"
        },
        "Filter": {
            "type": "string"
        }
    },
    "required": [
        "EmployeeType",
        "Resource",
        "Filter"
    ]
}