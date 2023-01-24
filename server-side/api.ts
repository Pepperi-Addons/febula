import { Client, Request } from '@pepperi-addons/debug-server'
import { FilterObjectService } from './services/filter-object.service';
import { FilterRuleService } from './services/filter-rule.service';
import { FilterObject, FilterRule } from './types';

export async function test(client: Client, request: Request) {
    return {
        Hello: 'World'
    }
};

export async function upsertFilterObject(client: Client, request: Request) {
    if (!request.body.FilterObject) {
        throw new Error('Missing FilterObject in request body');
    }

    const filterObjectService = new FilterObjectService(client);
    const filterObject: FilterObject = request.body.FilterObject;

    try {
        const result = await filterObjectService.upsert(filterObject);
        return result;
    }
    catch (ex) {
        console.error(`Failed to upsert filter object. error - ${ex}`);
        throw ex;
    }
}

export async function getFilterObjects(client: Client, request: Request) {
    const filterObjectService = new FilterObjectService(client);

    try {
        const result = await filterObjectService.getAll();
        return result;
    }
    catch (ex) {
        console.error(`Failed to get filter objects. error - ${ex}`);
        throw ex;
    }
}

export async function upsertFilterRule(client: Client, request: Request) {
    if (!request.body.FilterRule) {
        throw new Error('Missing FilterRule in request body');
    }

    const filterRuleService = new FilterRuleService(client);
    const filterRule: FilterRule = request.body.FilterRule;

    try {
        const result = await filterRuleService.upsert(filterRule);
        return result;
    }
    catch (ex) {
        console.error(`Failed to upsert filter rule. error - ${ex}`);
        throw ex;
    }
}

export async function getFilterRules(client: Client, request: Request) {
    const filterRuleService = new FilterRuleService(client);

    try {
        const result = await filterRuleService.getAll();
        return result;
    }
    catch (ex) {
        console.error(`Failed to get filter rules. error - ${ex}`);
        throw ex;
    }
}

