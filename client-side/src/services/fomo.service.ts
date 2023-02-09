import { PepAddonService } from "@pepperi-addons/ngx-lib";
import { config } from "../app/app.config"
import { FilterObject, FilterRule } from "../../../shared/types";
import { Promise } from "bluebird";

export class FomoService {

    MAX_PARALLEL = 10;

    constructor(private pepAddonService: PepAddonService) {
    }

    async getFilterObjects(searchString?: string): Promise<FilterObject[]> {
        try {
            const url = 'filters?page_size=-1' + (searchString ? `&where=Name like '%25${searchString}%25'` : '');
            const getResults = await this.pepAddonService.getAddonApiCall(config.AddonUUID, 'api', url).toPromise();
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

    async deleteFilterObjects(filterObjectKeys: string[]): Promise<any> {
        try {
            const postResults = await this.pepAddonService.postAddonApiCall(config.AddonUUID, 'api', 'filters_delete', { Keys: filterObjectKeys }).toPromise();
            return postResults;
        }
        catch (ex) {
            console.error(`Error in upsertFilterObject: ${ex}`);
            throw ex
        }

    }
}