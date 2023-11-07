import { Client, Request } from '@pepperi-addons/debug-server';
import { BasicFilterRuleData } from '../shared/types';
import { FilterObjectService } from './services/filter-object.service';
import { FilterRuleService } from './services/filter-rule.service';
import { RelationsService } from './services/relations.service';

export async function install(client: Client, request: Request): Promise<any> {
    try {
        const relationService = new RelationsService(client);
        const filterObjectService = new FilterObjectService(client);
        const filterRuleService = new FilterRuleService(client);

        await filterObjectService.createSchema();
        await filterRuleService.createSchema();
        await relationService.upsertRelations();

        // upsert default Filters and Profile-filters
        const basicFilterRuleData: BasicFilterRuleData[] = await filterObjectService.upsertBasicFilterObjects();
        await filterRuleService.upsertBasicFilterRules(basicFilterRuleData);

    } catch (error) {
        console.error(`installation failed, error: ${(error as Error).message}`);
        throw error;
    }

    return { success: true, resultObject: {} };
}

export async function uninstall(client: Client, request: Request): Promise<any> {
    return { success: true, resultObject: {} }
}

export async function upgrade(client: Client, request: Request): Promise<any> {
    try {
        console.log(`upgrade from version ${request.body.FromVersion} to version ${request.body.ToVersion}`);
        // if we are upgrading from version < 0.0.56, we need to update the FilterRules permissionSet and schema
        //if (request.body.FromVersion && semver.compare(request.body.FromVersion, '0.0.56') < 0) {
        const filterRuleService = new FilterRuleService(client);
        await filterRuleService.createSchema();
        await filterRuleService.upsertPermissionSet();
        //}
        const relationService = new RelationsService(client);
        await relationService.upsertRelations();

        // upsert default Filters and Profile-filters
        const filterObjectService = new FilterObjectService(client);
        const basicFilterRuleData: BasicFilterRuleData[] = await filterObjectService.upsertBasicFilterObjects();
        await filterRuleService.upsertBasicFilterRules(basicFilterRuleData);
        
        return { success: true, resultObject: {} }
    }
    catch (error) {
        console.error(`upgrade failed. error - ${(error as Error).message}`);
        throw error;
    }
}

export async function downgrade(client: Client, request: Request): Promise<any> {
    return { success: true, resultObject: {} }
}
