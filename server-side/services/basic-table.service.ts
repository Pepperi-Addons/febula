import { Client } from "@pepperi-addons/debug-server/dist";
import { AddonData, PapiClient, AddonDataScheme, FindOptions } from "@pepperi-addons/papi-sdk";
import { v4 as uuid } from "uuid";
import { Validator } from "jsonschema";

export abstract class BasicTableService<T extends AddonData>{
    papiClient: PapiClient;
    abstract schemaName: string;
    abstract schema: AddonDataScheme;
    abstract jsonSchemaToValidate: any;

    constructor(protected client: Client) {
        this.papiClient = new PapiClient({
            baseURL: client.BaseURL,
            token: client.OAuthAccessToken,
            addonUUID: client.AddonUUID,
            addonSecretKey: client.AddonSecretKey,
            actionUUID: client.ActionUUID
        });
    }

    async createSchema(): Promise<any> {
        return await this.papiClient.addons.data.schemes.post(this.schema);
    }

    // upsert data to table
    private async postData(addonData: T): Promise<any> {
        return await this.papiClient.addons.data.uuid(this.client.AddonUUID).table(this.schemaName).upsert(addonData);
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

        if (!this.validateData(addonData)) {
            throw new Error(`Validation failed for ${this.schemaName} object: ${JSON.stringify(addonData)}`);
        }

        return await this.postData(addonData);
    }

    async get(options?: FindOptions): Promise<T[]> {
        return (await this.papiClient.addons.data.uuid(this.client.AddonUUID).table(this.schemaName).find(options)) as T[];
    }
}