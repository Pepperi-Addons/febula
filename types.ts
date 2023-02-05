import { AddonData } from "./server-side/node_modules/@pepperi-addons/papi-sdk";
/**
* Key?: string; - UUID

* Name: string; - Name of the filter object

* Resource: string; - Name of the resource we are filtering

* Field: string; - Name of the field we wish to acquire from the resource

* PreviousField?: string; - Name of the field we wish to filter by

* PreviousFilter?: string; - Key of the filter object we wish to filter by
*/
export interface FilterObject extends AddonData {
    Key?: string;
    Name: string;
    Resource: string;
    Field: string;
    PreviousField?: string;
    PreviousFilter?: string;
}

/**
 * Key?: string; - UUID
 * 
 * EmployeeType: 1 | 2 | 3; - Type of the profile this rule belongs to. 1 = Admin, 2 = Rep, 3 = Buyer
 * 
 * Resource: string; - Name of the resource we are filtering
 * 
 * Filter: string; - Key of the filter object we wish to filter by for this resource and profile.
 */
export interface FilterRule extends AddonData {
    Key?: string;
    EmployeeType: 1 | 2 | 3; // 1 = Admin, 2 = Rep, 3 = Buyer
    Resource: string;
    Filter: string;
}
