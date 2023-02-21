import { Client, Request } from '@pepperi-addons/debug-server'
import { FindOptions } from '@pepperi-addons/papi-sdk';
import { FilterObjectService } from './services/filter-object.service';
import { FilterRuleService } from './services/filter-rule.service';
import { FilterObject, FilterRule } from '../shared/types';

export async function profile_filters(client: Client, request: Request) {
    const filterRuleService = new FilterRuleService(client, request.header['x-pepperi-ownerid'], request.header['x-pepperi-secretkey']);
    try {
        // if this is GET request, return filter rules
        if (request.method === 'GET') {
            console.log(`start profile_filters GET request. query - ${JSON.stringify(request.query)}`);
            const options: FindOptions = request.query;
            const result = await filterRuleService.get(options);
            console.log(`end profile_filters GET request. result length - ${JSON.stringify(result.length)}`);
            return result;
        }

        // if this is POST request, upsert filter rule
        else if (request.method === 'POST') {
            console.log(`start profile_filters POST request. body - ${JSON.stringify(request.body)}`);
            const filterRule = request.body as FilterRule;
            const result = await filterRuleService.upsert(filterRule);
            console.log(`end profile_filters POST request. result - ${JSON.stringify(result)}`);
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

export async function filters(client: Client, request: Request) {
    const filterObjectService = new FilterObjectService(client, request.header['x-pepperi-ownerid'], request.header['x-pepperi-secretkey']);
    try {
        // if this is GET request, return filter objects
        if (request.method === 'GET') {
            console.log(`start filters GET request. query - ${JSON.stringify(request.query)}`);
            const options: FindOptions = request.query;
            const result = await filterObjectService.get(options);
            console.log(`end filters GET request. result length - ${JSON.stringify(result.length)}`);
            return result;
        }

        // if this is POST request, upsert filter object
        else if (request.method === 'POST') {
            console.log(`start filters POST request. body - ${JSON.stringify(request.body)}`);
            const filterObject: FilterObject = request.body as FilterObject;
            const result = await filterObjectService.upsert(filterObject);
            console.log(`end filters POST request. result - ${JSON.stringify(result)}`);
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
