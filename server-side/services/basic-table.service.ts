import { Client } from "@pepperi-addons/debug-server/dist";
import { AddonData, PapiClient, AddonDataScheme, FindOptions } from "@pepperi-addons/papi-sdk";
import { v4 as uuid } from "uuid";
import { Validator } from "jsonschema";

export abstract class BasicTableService<T extends AddonData>{
    papiClient: PapiClient;
    abstract schemaName: string;
    abstract schema: AddonDataScheme;
    abstract jsonSchemaToValidate: any;

    constructor(protected client: Client, protected ownerUUID?: string, protected secretKey?: string) {
        this.papiClient = new PapiClient({
            baseURL: client.BaseURL,
            token: client.OAuthAccessToken,
            addonUUID: client.AddonUUID,
            addonSecretKey: client.AddonSecretKey,
            actionUUID: client.ActionUUID
        });
    }

    getOwnerPapiClient(): PapiClient {
        return new PapiClient({
            baseURL: this.client.BaseURL,
            token: this.client.OAuthAccessToken,
            addonUUID: this.ownerUUID,
            addonSecretKey: this.secretKey,
            actionUUID: this.client.ActionUUID
        });
    }

    async validateOwner() {
        try {
            const papiClient = this.getOwnerPapiClient();
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

    // validlate schema
    validateSchema(addonData: T): boolean {
        const v = new Validator();
        const result = v.validate(addonData, this.jsonSchemaToValidate);
        if (!result.valid) {
            console.warn(`Scheme validation failed for ${this.schemaName} object: ${JSON.stringify(addonData)}\n${result.errors}`);
            return false;
        }
        return true;
    }


    // validate data
    abstract validateData(addonData: T): Promise<boolean>;

    // upsert filter object after validation and add key if missing
    async upsert(addonData: T): Promise<any> {
        if (!addonData.Key) {
            addonData.Key = uuid();
        }
        try {
            if (!(await this.validateData(addonData))) {
                throw new Error(`Validation failed for ${this.schemaName} object: ${JSON.stringify(addonData)}`);
            }

            await this.validateOwner();

            return await this.postData(addonData);
        }
        catch (ex) {
            console.error(`Failed to upsert data to ${this.schemaName} table with error: ${JSON.stringify(ex)}`);
            throw new Error((ex as { message: string }).message);
        }
    }

    async get(options?: FindOptions): Promise<T[]> {
        return (await this.papiClient.addons.data.uuid(this.client.AddonUUID).table(this.schemaName).find(options)) as T[];
    }
}