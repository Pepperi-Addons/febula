import { PepAddonService } from "@pepperi-addons/ngx-lib";
import { config } from "../app/app.config"
import { FilterObject, FilterRule } from "../../../shared/types";
import { Collection } from "@pepperi-addons/papi-sdk/dist/entities";

export class FebulaService {

    constructor(private pepAddonService: PepAddonService) {
    }

    public async getResources(): Promise<Collection[]> {
        try {
            const results = await this.pepAddonService.getAddonApiCall(config.AddonUUID, 'client_side_endpoints', 'get_resources').toPromise();
            return results as Collection[];
        }
        catch (error) {
            console.error(`FebulaService: error in getResources: ${(error as Error).message}`);
            throw error;
        }
    }

    public async getFilterObjects(searchString?: string): Promise<FilterObject[]> {
        try {
            const url = 'filters?page_size=-1' + (searchString ? `&where=Name like '%25${searchString}%25'` : '');
            const getResults = await this.pepAddonService.getAddonApiCall(config.AddonUUID, 'api', url).toPromise();
            return getResults as FilterObject[];
        }
        catch (error) {
            console.error(`FebulaService: error in getFilterObjects: ${(error as Error).message}`);
            throw error;
        }
    }

    public async getFilterObjectsByKeys(keys: string[]): Promise<FilterObject[]> {
        try {
            const url = `get_filters_by_keys`;
            const getResults = await this.pepAddonService.postAddonApiCall(config.AddonUUID, 'client_side_endpoints', url, { KeyList: keys }).toPromise();
            return getResults as FilterObject[];
        }
        catch (error) {
            console.error(`FebulaService: error in getFilterObjectsByKeys: ${(error as Error).message}`);
            throw error;
        }
    }

    public async getFilterRules(searchString?: string): Promise<FilterRule[]> {
        try {
            const url = 'profile_filters?page_size=-1' + (searchString ? `&where=Resource like '%25${searchString}%25'` : '');
            const getResults = await this.pepAddonService.getAddonApiCall(config.AddonUUID, 'api', url).toPromise();
            // order results by resource
            getResults.sort((a, b) => {
                if (a.Resource.toLowerCase() < b.Resource.toLowerCase()) {
                    return -1;
                }
                if (a.Resource.toLowerCase() > b.Resource.toLowerCase()) {
                    return 1;
                }
                return 0;
            });
            return getResults as FilterRule[];
        }
        catch (error) {
            console.error(`FebulaService: error in getFilterRules: ${(error as Error).message}`);
            throw error;
        }
    }

    public async upsertFilterObject(filterObject: FilterObject): Promise<FilterObject> {
        try {
            const postResults = await this.pepAddonService.postAddonApiCall(config.AddonUUID, 'api', 'filters', filterObject).toPromise();
            return postResults as FilterObject;
        }
        catch (error) {
            console.error(`FebulaService: error in upsertFilterObject: ${(error as Error).message}`);
            throw error
        }
    }

    public async upsertFilterRule(filterRule: FilterRule): Promise<FilterRule> {
        try {
            const postResults = await this.pepAddonService.postAddonApiCall(config.AddonUUID, 'api', 'profile_filters', filterRule).toPromise();
            return postResults as FilterRule;
        }
        catch (error) {
            console.error(`FebulaService: error in upsertFilterRule: ${(error as Error).message}`);
            throw error;
        }
    }

    public async deleteFilterObjects(filterObjectKeys: string[]): Promise<any> {
        try {
            const postResults = await this.pepAddonService.postAddonApiCall(config.AddonUUID, 'api', 'filters_delete', { Keys: filterObjectKeys }).toPromise();
            return postResults;
        }
        catch (error) {
            console.error(`FebulaService: error in upsertFilterObject: ${(error as Error).message}`);
            throw error
        }

    }

    public async deleteFilterRules(filterRuleKeys: string[]): Promise<any> {
        try {
            const postResults = await this.pepAddonService.postAddonApiCall(config.AddonUUID, 'api', 'profile_filters_delete', { Keys: filterRuleKeys }).toPromise();
            return postResults;
        }
        catch (error) {
            console.error(`FebulaService: error in upsertFilterObject: ${(error as Error).message}`);
            throw error
        }
    }
}