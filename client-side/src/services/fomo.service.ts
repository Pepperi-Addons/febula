import { PepAddonService } from "@pepperi-addons/ngx-lib";
import { config } from "../app/app.config"
import { FilterObject, FilterRule } from "../../../shared/types";

export class FomoService {
    constructor(private pepAddonService: PepAddonService) {
    }

    async getFilterObjects(): Promise<FilterObject[]> {
        try {
            const getResults = await this.pepAddonService.getAddonApiCall(config.AddonUUID, 'api', 'filters?page_size=-1').toPromise();
            return getResults as FilterObject[];
        }
        catch (ex) {
            console.error(`Error in getFilterObjects: ${ex}`);
            throw ex;
        }
    }

    async getFilterRules(): Promise<FilterRule[]> {
        try {
            const getResults = await this.pepAddonService.getAddonApiCall(config.AddonUUID, 'api', 'profile_filters?page_size=-1').toPromise();
            return getResults as FilterRule[];
        }
        catch (ex) {
            console.error(`Error in getFilterRules: ${ex}`);
            throw ex;
        }
    }

    async upsertFilterObject(filterObject: FilterObject): Promise<FilterObject> {
        try {
            const postResults = await this.pepAddonService.postAddonApiCall(config.AddonUUID, 'api', 'filters', filterObject).toPromise();
            return postResults as FilterObject;
        }
        catch (ex) {
            console.error(`Error in upsertFilterObject: ${ex}`);
            throw ex
        }
    }

    async upsertFilterRule(filterRule: FilterRule): Promise<FilterRule> {
        try {
            const postResults = await this.pepAddonService.postAddonApiCall(config.AddonUUID, 'api', 'profile_filters', filterRule).toPromise();
            return postResults as FilterRule;
        }
        catch (ex) {
            console.error(`Error in upsertFilterRule: ${ex}`);
            throw ex;
        }
    }
}