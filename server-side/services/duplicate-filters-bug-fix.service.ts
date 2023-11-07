import { Promise } from "bluebird";
import { Client } from "@pepperi-addons/debug-server/dist";
import { FilterRuleService } from "./filter-rule.service";
import { FilterRule } from "../../shared/types";

/**
 * This class was created to handle bug DI-25619 which caused filters to be duplicated.
 * 
 * The duplication is now blocked in {@link FilterObjectService}, but because non 'Sync' filter-rules can
 * have multiple mappings to the same resource (by design), there is no guard against duplicating those filter-rules,
 * which causes them to point to the 'extra' filters.
 * 
 * 'Sync' filter-rules DOES have validation against duplication ({@link FilterRuleService.validateProfileFilterCombination})
 * which grantees that there will be no duplication and that they will 
 * point to the correct filter. 
 */
export class DuplicateFiltersBugFixService {

    private filterRuleService: FilterRuleService;

    constructor(client: Client) {
        this.filterRuleService = new FilterRuleService(client);
    }

    /**
     * Before deleting the filters we need to make sure no filter-rule is pointing to them,
     * and if there is, we need to update the filter-rule to point to the oldest filter.
     * @param filtersKeysToDelete The keys of the filters that are to be deleted.
     * @param filterKeyToUse The key of the filter that is not deleted.
     */
    public async fixFilterRules(filtersKeysToDelete: string[], filterKeyToUse: string): Promise<void> {
        // Get all filter rules that are not 'Sync'
        const nonSyncFilterRules: FilterRule[] = await this.filterRuleService.get({
            where: "PermissionSet!='Sync'"
        });

        // Find the filter rules that point to one of the filters that are to be deleted
        // and update them to point to the filter that is not deleted.
        const rulesPointingToFilter = nonSyncFilterRules.filter((filterRule) => filtersKeysToDelete.includes(filterRule.Filter));
        rulesPointingToFilter.forEach((filterRule) => { filterRule.Filter = filterKeyToUse });

        if (rulesPointingToFilter.length > 1) {
            console.warn(`DuplicateFiltersBugFixService: found ${rulesPointingToFilter.length} filter rules pointing to the filters that are to be deleted, trying to fix..`);
        }

        // Update the filter rules.
        try {
            const MAX_PARALLEL = 1;

            await Promise.map(rulesPointingToFilter, async (filterRule: FilterRule) => {
                await this.filterRuleService.upsert(filterRule);
            }, { concurrency: MAX_PARALLEL });
        }
        catch (error) {
            console.error(`BugService: error while fixing filter rules: ${(error as Error).message}`);
            throw error;
        }
    }
}