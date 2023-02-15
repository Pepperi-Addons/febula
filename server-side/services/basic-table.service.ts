import { Client } from "@pepperi-addons/debug-server/dist";
import { AddonData, PapiClient, AddonDataScheme, FindOptions } from "@pepperi-addons/papi-sdk";
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
            console.error(`Failed to create schema ${this.schemaName} with error: ${JSON.stringify(ex)}`);
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
            console.error(`Failed to upsert data to ${this.schemaName} table with error: ${JSON.stringify(ex)}`);
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
            console.error(`Failed to upsert data to ${this.schemaName} table with error: ${JSON.stringify(ex)}`);
            throw ex;
        }
    }

    async get(options?: FindOptions): Promise<T[]> {
        return (await this.papiClient.addons.data.uuid(this.client.AddonUUID).table(this.schemaName).find(options)) as T[];
    }

    async getByKey(key: string): Promise<T> {
        return (await this.papiClient.addons.data.uuid(this.client.AddonUUID).table(this.schemaName).key(key).get()) as T;
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
            console.error(`Failed to delete data from ${this.schemaName} table with error: ${JSON.stringify(ex)}`);
            throw ex;
        }

    }
}