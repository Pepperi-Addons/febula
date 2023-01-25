import { Client, Request } from '@pepperi-addons/debug-server'
import { FindOptions } from '@pepperi-addons/papi-sdk';
import { FilterObjectService } from './services/filter-object.service';
import { FilterRuleService } from './services/filter-rule.service';
import { FilterObject, FilterRule } from './types';

export async function filter_rule(client: Client, request: Request) {
    const filterRuleService = new FilterRuleService(client);
    try {
        // if this is GET request, return filter rules
        if (request.method === 'GET') {
            const options: FindOptions = request.body;
            const result = await filterRuleService.get(options);
            return result;
        }

        // if this is POST request, upsert filter rule
        else if (request.method === 'POST') {
            const filterRule = request.body as FilterRule;
            const result = await filterRuleService.upsert(filterRule);
            return result;
        }

        else {
            throw new Error(`Unsupported request method: ${request.method}`);
        }
    }
    catch (ex) {
        console.error(`filter_rule failed. error - ${ex}`);
        throw new Error((ex as { message: string }).message);
    }
}

export async function filter_object(client: Client, request: Request) {
    const filterObjectService = new FilterObjectService(client);
    try {
        // if this is GET request, return filter objects
        if (request.method === 'GET') {
            const options: FindOptions = request.body;
            const result = await filterObjectService.get(options);
            return result;
        }

        // if this is POST request, upsert filter object
        else if (request.method === 'POST') {
            const filterObject: FilterObject = request.body as FilterObject;
            const result = await filterObjectService.upsert(filterObject);
            return result;
        }

        else {
            throw new Error(`Unsupported request method: ${request.method}`);
        }
    }
    catch (ex) {
        console.error(`filter_object failed. error - ${ex}`);
        throw new Error((ex as { message: string }).message);
    }
}

