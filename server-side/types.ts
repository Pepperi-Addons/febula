import { AddonData } from "@pepperi-addons/papi-sdk";

export interface FilterBy {
    Field: string;
    FilterObject: string;
}

export interface FilterObject extends AddonData {
    Name: string;
    FromResource?: string;
    Field: string;
    FilterBy?: FilterBy;
    Terminal?: boolean;
    Key?: string;
}

export interface FilterRule extends AddonData {
    Profile: string;
    Resource: string;
    FilterObject: string;
    Key?: string;
}