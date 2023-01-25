import { AddonData } from "@pepperi-addons/papi-sdk";
import { Fields } from "@pepperi-addons/papi-sdk/dist/endpoints";

export interface FilterObject extends AddonData {
    Key?: string;
    Name: string;
    Resource?: string;
    Field: string;
    PreviousField?: string;
    PreviousFilter?: string;
}

export interface FilterRule extends AddonData {
    Key?: string;
    EmployeeType: 1|2|3; // 1 = Admin, 2 = Rep, 3 = Buyer
    Resource: string;
    Filter: string;
}
