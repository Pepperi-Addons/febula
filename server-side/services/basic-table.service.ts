import { Client } from "@pepperi-addons/debug-server/dist";
import { AddonData, PapiClient, AddonDataScheme, FindOptions, Collection, SearchData } from "@pepperi-addons/papi-sdk";
import { v4 as uuid } from "uuid";
import { Validator } from "jsonschema";
import { Promise } from "bluebird";

export abstract class BasicTableService<T extends AddonData>{
    papiClient: PapiClient;
    abstract schemaName: string;
    abstract schema: AddonDataScheme;
    abstract jsonSchemaToValidate: any;

    constructor(protected client: Client, protected ownerUUID: string = client.AddonUUID, protected secretKey: string = client.AddonSecretKey!) {
        this.papiClient = new PapiClient({
            baseURL: client.BaseURL,
            token: client.OAuthAccessToken,
            addonUUID: client.AddonUUID,
            addonSecretKey: client.AddonSecretKey,
            actionUUID: client.ActionUUID
        });
    }

    async getResources(): Promise<Collection[]> {
        try {
            const resources: AddonData[] = await this.papiClient.resources.resource('resources').get({ page_size: -1 })
            return resources as Collection[];
        }
        catch (ex) {
            console.error(`Error in get_resources: ${ex}`);
            throw new Error((ex as { message: string }).message);
        }
    }

    getOwnerPapiClient(passSecretKey: boolean = false): PapiClient {
        return new PapiClient({
            baseURL: this.client.BaseURL,
            token: this.client.OAuthAccessToken,
            addonUUID: this.ownerUUID,
            addonSecretKey: passSecretKey ? this.secretKey : this.client.AddonSecretKey,
            actionUUID: this.client.ActionUUID
        });
    }

    async validateOwner() {
        try {
            const papiClient = this.getOwnerPapiClient(true);
            await papiClient.apiCall('GET', `/var/sk/addons/${this.ownerUUID}/validate`);
        }
        catch (err) {
            console.error('got error: ', JSON.stringify(err));
            throw new Error('SecretKey must match with OwnerUUID')
        }
    }

    async createSchema(): Promise<any> {
        try {
            return await this.papiClient.addons.data.schemes.post(this.schema);
        }
        catch (ex) {
            console.error(`Failed to create schema ${this.schemaName} with error: ${ex}`);
            throw ex;
        }
    }

    // upsert data to table
    private async postData(addonData: T): Promise<any> {
        try {
            const papiClient = this.getOwnerPapiClient();
            return await papiClient.addons.data.uuid(this.client.AddonUUID).table(this.schemaName).upsert(addonData);
        }
        catch (ex) {
            console.error(`Failed to upsert data to ${this.schemaName} table with error: ${ex}`);
            throw ex;
        }
    }

    // validate schema
    validateSchema(addonData: T): void {
        const v = new Validator();
        const result = v.validate(addonData, this.jsonSchemaToValidate);
        if (!result.valid) {
            throw new Error(`Scheme validation failed for ${this.schemaName} object: ${JSON.stringify(addonData)}\n${result.errors}`);

        }
    }

    // validate data
    abstract validateData(addonData: T): Promise<void>;

    // upsert filter object after validation and add key if missing
    async upsert(addonData: T): Promise<any> {
        if (!addonData.Key) {
            addonData.Key = uuid();
        }
        if (!addonData.AddonUUID) {
            (addonData as any).AddonUUID = this.ownerUUID;
        }

        await this.validateData(addonData);
        await this.validateOwner();

        try {
            return await this.postData(addonData);
        }
        catch (ex) {
            console.error(`Failed to upsert data to ${this.schemaName} table with error: ${ex}`);
            throw ex;
        }
    }

    async get(options?: FindOptions): Promise<T[]> {
        return (await this.papiClient.addons.data.uuid(this.client.AddonUUID).table(this.schemaName).find(options)) as T[];
    }

    async getByKeys(keys: string[]): Promise<T[]> {
        try{
            const searchData: SearchData<AddonData> = await this.papiClient.addons.data.search.uuid(this.client.AddonUUID).table(this.schemaName).post({ KeyList: keys });
            const results = searchData.Objects as T[];
            return results;
        }
        catch(ex){
            console.error(`Failed to get data from ${this.schemaName} table with error: ${ex}`);
            throw ex;
        }
    }

    async delete(keys: string[]): Promise<any> {
        const MAX_PARALLEL = 10;

        const hiddenObjects = keys.map(key => {
            return {
                Key: key,
                Hidden: true
            }
        });

        try {
            return await Promise.map(hiddenObjects, async (hiddenObject) => {
                return await this.postData(hiddenObject);
            }, { concurrency: MAX_PARALLEL });
        }
        catch (ex) {
            console.error(`Failed to delete data from ${this.schemaName} table with error: ${ex}`);
            throw ex;
        }

    }
}