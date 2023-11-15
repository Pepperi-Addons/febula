import { Collection } from "@pepperi-addons/papi-sdk/dist/entities";
import { FilterRule } from "../../../../../shared/types";
import { EmployeeType } from "../../../types";

export interface ResourceAndEmployeeType {
    Resource: Collection;
    EmployeeType: EmployeeType;
}

/**
 * Data required to assemble the sync rule text.
 */
export interface SyncRuleParameters extends ResourceAndEmployeeType {
    ReferenceFields: string[];
    FilterRules: FilterRule[]; // each reference field can have a different filter rule
}

export interface ReferenceFieldData {
    FieldID: string;
    ReferencedResourceName: string;
}

export interface ListData {
    ID: string;
    ResourceName: string;
    Profile: string;
    ReferenceFields: string;
    SyncRuleText: string;
}