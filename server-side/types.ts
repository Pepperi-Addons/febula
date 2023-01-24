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
    Profile: string;
    Resource: string;
    Filter: string;
}
