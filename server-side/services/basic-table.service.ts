import { Client } from "@pepperi-addons/debug-server/dist";
import { AddonData, PapiClient, AddonDataScheme, FindOptions, Collection, SearchData } from "@pepperi-addons/papi-sdk";
import { v4 as uuid } from "uuid";
import { Validator } from "jsonschema";
import { Promise } from "bluebird";

export abstract class BasicTableService<T extends AddonData>{
    papiClient: PapiClient;
    resources?: Collection[];
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

    // setup resources array with all resources
    protected initResources = async (): Promise<void> => {
        if (!this.resources) {
            try {
                this.resources = await this.getResources()
                this.resources?.forEach((resource) => {
                    resource.Fields = {
                        ...resource.Fields,
                        Key: {
                            Type: 'Resource',
                            Resource: resource.Name,
                            AddonUUID: resource.AddonUUID,
                            Mandatory: true,
                            Description: 'Key references self'
                        }
                    }
                })
            }
            catch (ex) {
                console.error(`Error in initResources: ${ex}`);
                throw ex;
            }
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
    async upsert(addonData: T, system: boolean = false): Promise<any> {
        if (!addonData.Key) {
            addonData.Key = uuid();
        }
        if (!addonData.AddonUUID) {
            // if the ownerUUID is not the same as the client addonUUID, then it is a system Filter.
            // in this case, we need to set the AddonUUID to the ownerUUID.
            // if the ownerUUID is the same as the client addonUUID, but the system flag is true, then it is also a system Filter.
            if (this.ownerUUID !== this.client.AddonUUID || system) {
                (addonData as any).AddonUUID = this.ownerUUID;
            }
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
        try {
            const searchData: SearchData<AddonData> = await this.papiClient.addons.data.search.uuid(this.client.AddonUUID).table(this.schemaName).post({ KeyList: keys });
            const results = searchData.Objects as T[];
            return results;
        }
        catch (ex) {
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