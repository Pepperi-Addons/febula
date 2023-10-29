import { AddonData } from "../server-side/node_modules/@pepperi-addons/papi-sdk/dist";
/**
* Key?: string; - UUID
*
* Name: string; - Name of the filter object
*
* Resource: string; - Name of the resource we are filtering
*
* Field: string; - Name of the field we wish to acquire from the resource
*
* PreviousField?: string; - Name of the field we wish to filter by
*
* PreviousFilter?: string; - Key of the filter object we wish to filter by
*
* AddonUUID?: string; - UUID of the owner of this filter object
*/
export interface FilterObject extends AddonData {
    Key?: string;
    Name: string;
    Resource: string;
    Field: string;
    PreviousField?: string;
    PreviousFilter?: string;
    AddonUUID?: string;
}

/**
 * Key?: string; - UUID
 * 
 * EmployeeType: 1 | 2 | 3; - Type of the profile this rule belongs to. 1 = Admin, 2 = Rep, 3 = Buyer
 * 
 * Resource: string; - Name of the resource we are filtering
 * 
 * Filter: string; - Key of the filter object we wish to filter by for this resource and profile.
 * 
 * AddonUUID?: string; - UUID of the owner of this filter rule
 * 
 * PermissionSet?: "Sync" | "Online"; - Permission set of the filter rule. Default is "Sync"
 */
export interface FilterRule extends AddonData {
    Key?: string;
    EmployeeType: 1 | 2 | 3; // 1 = Admin, 2 = Rep, 3 = Buyer // TODO: create type
    Resource: string;
    Filter: string;
    AddonUUID?: string;
    PermissionSet?: PermissionSetValues;
}

export type PermissionSetValues = "Sync" | "Online"; // default is "Sync"

/**
 * Key?: string; - Key of the basic filter object (UUID)
 * 
 * Resource: string; - Name of the resource referenced by the basic filter object's "Field" field
 */
export interface BasicFilterRuleData {
    Resource: string,
    Key: string
}