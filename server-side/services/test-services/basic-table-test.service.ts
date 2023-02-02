import { Client } from "@pepperi-addons/debug-server/dist";
import { AddonData, PapiClient, FindOptions } from "@pepperi-addons/papi-sdk";
import { Promise } from "bluebird";


export abstract class BasicTableTestService<T extends AddonData>{
    papiClient: PapiClient;
    abstract functionEndpointSuffix: string;
    upsertedRecords: T[] = [];
    MAX_PARALLEL = 10;

    constructor(protected client: Client, protected debug: boolean, protected ownerUUID: string = client.AddonUUID, protected secretKey: string = client.AddonSecretKey!) {
        this.papiClient = new PapiClient({
            baseURL: this.getBaseURL(client),
            token: client.OAuthAccessToken,
            addonUUID: client.AddonUUID,
            addonSecretKey: client.AddonSecretKey,
            actionUUID: client.ActionUUID
        });
    }

    abstract createObject(options?): Promise<T>;

    private getExpirationDateTime() {
        //ISO of tomorrow
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow.toISOString();
    }

    private getBaseURL(client): string {
        return client.isDebug ? 'http://localhost:4500' : `${client.BaseURL}/addons/api/${client.AddonUUID}`;
    }

    private getOwnerPapiClient(passSecretKey: boolean = false): PapiClient {
        return new PapiClient({
            baseURL: this.getBaseURL(this.client),
            token: this.client.OAuthAccessToken,
            addonUUID: this.ownerUUID,
            addonSecretKey: passSecretKey ? this.secretKey : this.client.AddonSecretKey,
            actionUUID: this.client.ActionUUID
        });
    }

    private convertFindOptionsToQueryParams(options?: FindOptions): string {
        let queryParams: string[] = [];
        if (options) {
            for (let key in options) {
                if (options[key]) {
                    queryParams.push(`${key}=${options[key]}`);
                }
            }
        }
        return queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
    }

    // upsert data to table
    async upsert(addonData: T): Promise<T> {
        try {
            const papiClient = this.getOwnerPapiClient();
            const upsertResult = await papiClient.post(
                this.functionEndpointSuffix, {
                ...addonData,
                ExpirationDateTime: this.getExpirationDateTime()
            }, { 'Content-Type': 'application/json' });
            // if doesn't already exist
            if (upsertResult && upsertResult.Key && !this.upsertedRecords.find(record => record.Key === upsertResult.Key)) {
                this.upsertedRecords.push(addonData);
                return upsertResult;
            }
        }
        catch (ex) {
            console.error(`Failed to upsert data to ${this.functionEndpointSuffix} table with error: ${JSON.stringify(ex)}`);
            throw ex;
        }
    }

    async get(options?: FindOptions): Promise<T[]> {
        // options must be added to URL
        return (await this.papiClient.get(this.functionEndpointSuffix + this.convertFindOptionsToQueryParams(options))) as T[];
    }

    async getByKey(key: string): Promise<T | undefined> {
        const results = await this.get({ where: `Key='${key}'` });
        return results.length > 0 ? results[0] : undefined;
    }

    async delete(addonData: T): Promise<any> {
        return await this.upsert({
            ...addonData,
            Hidden: true
        });
    }

    async cleanUp(): Promise<any> {
        await Promise.map(this.upsertedRecords, async (record) => {
            await this.delete(record);
        }, { concurrency: this.MAX_PARALLEL });
    }
}