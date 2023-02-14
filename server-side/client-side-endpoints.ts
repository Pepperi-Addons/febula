import { Client, Request } from '@pepperi-addons/debug-server'
import { Collection, CollectionField, FindOptions, PapiClient } from '@pepperi-addons/papi-sdk';
import { FilterObjectService } from './services/filter-object.service';
import { FilterRuleService } from './services/filter-rule.service';
import { FilterObject, FilterRule } from '../shared/types';

export async function get_udcs(client: Client, request: Request): Promise<Collection[]> {
    // returns true if collection has at least 2 fields of type 'Resource'
    const filterAtLeastTwoResources = (collection: Collection): boolean => {
        if (collection.Fields) {
            let count = 0;
            for (const field of Object.values(collection.Fields)) {
                if (field.Type === 'Resource') {
                    count++;
                }
            }
            return count >= 2;
        }
        return false;
    }


    try {
        const papiClient = new PapiClient({
            baseURL: client.BaseURL,
            token: client.OAuthAccessToken,
            addonUUID: client.AddonUUID,
            addonSecretKey: client.AddonSecretKey,
            actionUUID: client['ActionUUID']
        });
        const udcs: Collection[] = await papiClient.userDefinedCollections.schemes.iter().toArray();
        const filteredUdcs = udcs.filter(filterAtLeastTwoResources);
        return filteredUdcs;
    }
    catch (ex) {
        console.error(`Error in get_udcs: ${ex}`);
        throw new Error((ex as { message: string }).message);
    }
}
