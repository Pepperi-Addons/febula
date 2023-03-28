import { Client, Request } from '@pepperi-addons/debug-server/dist';
import Mocha, { MochaReporter } from './mocha';
import { expect } from 'chai';
import { Promise } from "bluebird";
import { config as dotenv } from 'dotenv'
import { FilterObject, FilterRule } from '../shared/types';
dotenv();
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { FilterObjectTestService } from './services/test-services/filter-object-test.service';
import { FilterRuleTestService } from './services/test-services/filter-rule-test.service';
import { AddonDataScheme, Collection, PapiClient } from '@pepperi-addons/papi-sdk';
chai.use(chaiAsPromised);
function createMocha(client: Client, cb: (res) => void) {
    const isLocal = false; //client ? client.AssetsBaseUrl.includes('/localhost:') : true;
    const mochaDir = `/tmp/${'Mocha'}-${'Default'}-Tests-Results-${new Date()
        .toISOString()
        .substring(0, 16)
        .replace(/-/g, '.')
        .replace(/:/g, '_')
        .replace(/T/g, 'T_')}`;
    const fileName = 'benchmarks';

    const mocha = new Mocha({
        reporter: isLocal ? require('mochawesome') : MochaReporter,
        reporterOptions: {
            cb: cb,
            reportDir: mochaDir,
            reportFilename: fileName,
            html: isLocal,
            autoOpen: isLocal,
            consoleReporter: 'none',
        },
        timeout: 1200000,
    });

    return mocha
}


export async function fomo_tests(client: Client, request: Request) {
    let result = {}
    const cb = (res) => {
        result = res;
    }
    const mocha = createMocha(client, cb);
    const root = mocha.suite;
    const debug = request.body['Debug'] ?? false;
    let context: Mocha.Suite | undefined = root;
    const papiClient = new PapiClient({
        baseURL: client.BaseURL,
        token: client.OAuthAccessToken,
        addonUUID: client.AddonUUID,
        addonSecretKey: client.AddonSecretKey,
        actionUUID: client.ActionUUID
    });
    const describe = (name: string, fn: () => any) => {
        const suite = new Mocha.Suite(name);
        context?.addSuite(suite);
        context = suite;

        fn();
        context = suite.parent;
    }

    const it = (name: string, fn: Mocha.Func | Mocha.AsyncFunc | undefined) => {
        context?.addTest(new Mocha.Test(name, fn));
    }

    describe('FOMO Tests', () => {
        const filterObjectService = new FilterObjectTestService(client, debug, client.AddonUUID, client.AddonSecretKey);
        const filterRuleService = new FilterRuleTestService(client, debug, filterObjectService, client.AddonUUID, client.AddonSecretKey);

        const cleanup = async () => {
            await filterObjectService.cleanUp();
            await filterRuleService.cleanUp();
        }

        describe('Filter Object Tests', () => {

            describe('init resource', () => {
                let testResource: AddonDataScheme;
                let secondaryTestResource: AddonDataScheme;
                it('create test resource', async () => {
                    testResource = filterObjectService.getTestResource();
                    await papiClient.addons.data.schemes.post(testResource);
                });
                it('make sure test resource exists', async () => {
                    const resources: Collection[] = await papiClient.resources.resource('resources').get({ page_size: -1 }) as Collection[];
                    const foundTestResource = resources.find(r => r.Name === testResource.Name);
                    expect(foundTestResource).to.be.an('object');
                });
                it('create secondary test resource', async () => {
                    secondaryTestResource = filterObjectService.getTestResource();
                    secondaryTestResource.Name = filterObjectService.secondaryTestResourceName;
                    secondaryTestResource.Fields![filterObjectService.testFieldName].Resource = secondaryTestResource.Name;
                    await papiClient.addons.data.schemes.post(secondaryTestResource);
                });
                it('make sure secondary test resource exists', async () => {
                    const resources: Collection[] = await papiClient.resources.resource('resources').get({ page_size: -1 }) as Collection[];
                    const foundTestResource = resources.find(r => r.Name === secondaryTestResource.Name);
                    expect(foundTestResource).to.be.an('object');
                });
                it('create third test resource', async () => {
                    const thirdTestResource = filterObjectService.getTestResource();
                    thirdTestResource.Name = filterObjectService.thirdTestResourceName;
                    await papiClient.addons.data.schemes.post(thirdTestResource);
                });
                it('make sure third test resource exists', async () => {
                    const resources: Collection[] = await papiClient.resources.resource('resources').get({ page_size: -1 }) as Collection[];
                    const foundTestResource = resources.find(r => r.Name === filterObjectService.thirdTestResourceName);
                    expect(foundTestResource).to.be.an('object');
                });
            });


            describe('Basic CRUD', () => {
                let filterObject: FilterObject;
                it('insert', async () => {
                    filterObject = await filterObjectService.createObject();
                    const res = await filterObjectService.upsert(filterObject)
                    expect(res).to.be.an('object');
                    expect(res).to.have.property('Key')
                    expect(res).to.have.property('Name').to.equal(filterObject.Name);
                    expect(res).to.have.property('Resource').to.equal(filterObject.Resource);
                    expect(res).to.have.property('Field').to.equal(filterObject.Field);
                    filterObject = res;
                });
                it('get', async () => {
                    const res: FilterObject | undefined = await filterObjectService.getByKey(filterObject.Key!);
                    expect(res).to.be.an('object');
                    expect(res).to.have.property('Key').to.equal(filterObject.Key);
                    expect(res).to.have.property('Name').to.equal(filterObject.Name);
                    expect(res).to.have.property('Resource').to.equal(filterObject.Resource);
                    expect(res).to.have.property('Field').to.equal(filterObject.Field);
                });
                it('update', async () => {
                    const changedFilterObject = await filterObjectService.createObject({ Key: filterObject.Key! });
                    const res = await filterObjectService.upsert(changedFilterObject);
                    expect(res).to.be.an('object');
                    const res2: FilterObject | undefined = await filterObjectService.getByKey(filterObject.Key!);
                    expect(res2).to.be.an('object');
                    expect(res2).to.have.property('Key').to.equal(changedFilterObject.Key);
                    expect(res2).to.have.property('Name').to.equal(changedFilterObject.Name);
                    expect(res2).to.have.property('Resource').to.equal(changedFilterObject.Resource);
                    expect(res2).to.have.property('Field').to.equal(changedFilterObject.Field);
                    filterObject = res2 as FilterObject;
                });
                it('delete', async () => {
                    await filterObjectService.delete([filterObject.Key!]);
                    const res2: FilterObject[] = await filterObjectService.get({ where: `Key = '${filterObject.Key}'` })
                    expect(res2).to.be.an('array').to.have.lengthOf(0);
                });
                it('clean', async () => {
                    await cleanup();
                });
            })

            describe('Validation tests', () => {
                describe('Name validation', () => {
                    it('Insert without name', async () => {
                        const filterObject = await filterObjectService.createObject();
                        // @ts-ignore
                        delete filterObject.Name;
                        await expect(filterObjectService.upsert(filterObject)).eventually.to.be.rejectedWith('Scheme validation failed');
                    });
                });
                describe('Resource validation', () => {
                    it('Insert without resource', async () => {
                        const filterObject = await filterObjectService.createObject();
                        // @ts-ignore
                        delete filterObject.Resource;
                        await expect(filterObjectService.upsert(filterObject)).eventually.to.be.rejectedWith('Scheme validation failed');
                    });
                    it('Insert with invalid resource', async () => {
                        const filterObject = await filterObjectService.createObject();
                        filterObject.Resource = 'invalid';
                        await expect(filterObjectService.upsert(filterObject)).eventually.to.be.rejectedWith('Resource validation failed');
                    });
                });
                describe('Field validation', () => {
                    it('Insert without field', async () => {
                        const filterObject = await filterObjectService.createObject();
                        // @ts-ignore
                        delete filterObject.Field;
                        await expect(filterObjectService.upsert(filterObject)).eventually.to.be.rejectedWith('Scheme validation failed');
                    });
                    it('insert with field that does not exist in resource', async () => {
                        const filterObject = await filterObjectService.createObject();
                        filterObject.Field = 'invalid';
                        await expect(filterObjectService.upsert(filterObject)).eventually.to.be.rejectedWith('Field validation failed');
                    });
                    it('insert with field that is not a reference', async () => {
                        const filterObject = await filterObjectService.createObject();
                        filterObject.Field = 'StringProperty';
                        await expect(filterObjectService.upsert(filterObject)).eventually.to.be.rejectedWith('Field validation failed');
                    });
                });
                describe('Previous field and filter validation', () => {

                    it('Insert with PreviousField and without PreviousFilter', async () => {
                        const filterObject = await filterObjectService.createObject();
                        filterObject.PreviousField = filterObjectService.testPreviousFieldName;
                        await expect(filterObjectService.upsert(filterObject)).eventually.to.be.rejectedWith('Scheme validation failed');
                    });
                    it('Insert with PreviousFilter and without PreviousField', async () => {
                        // first upsert a filter object
                        const filterObject = await filterObjectService.createObject();
                        const res = await filterObjectService.upsert(filterObject);
                        // upsert a filter object with PreviousFilter but without PreviousField
                        const filterObject2 = await filterObjectService.createObject();
                        filterObject2.PreviousFilter = res.Key;
                        await expect(filterObjectService.upsert(filterObject2)).eventually.to.be.rejectedWith('Scheme validation failed');
                    });
                    it('Insert with PreviousFilter and PreviousField but PreviousFilter is not found', async () => {
                        const filterObject = await filterObjectService.createObject();
                        filterObject.PreviousFilter = 'PreviousFilter';
                        filterObject.PreviousField = filterObjectService.testPreviousFieldName;
                        await expect(filterObjectService.upsert(filterObject)).eventually.to.be.rejectedWith('PreviousFilter validation failed');
                    });
                    it('Insert with PreviousFilter and PreviousField but PreviousField does not exist on resource', async () => {
                        // first upsert a filter object
                        const filterObject = await filterObjectService.createObject();
                        const res = await filterObjectService.upsert(filterObject);
                        // upsert a filter object with PreviousFilter and PreviousField
                        const filterObject2 = await filterObjectService.createObject();
                        filterObject2.PreviousFilter = res.Key;
                        filterObject2.PreviousField = 'invalid';
                        await expect(filterObjectService.upsert(filterObject2)).eventually.to.be.rejectedWith('PreviousField validation failed');
                    });
                    it('Insert with PreviousFilter and PreviousField but PreviousField is not a reference', async () => {
                        // first upsert a filter object
                        const filterObject = await filterObjectService.createObject();
                        const res = await filterObjectService.upsert(filterObject);
                        // upsert a filter object with PreviousFilter and PreviousField
                        const filterObject2 = await filterObjectService.createObject();
                        filterObject2.PreviousFilter = res.Key;
                        filterObject2.PreviousField = 'StringProperty';
                        await expect(filterObjectService.upsert(filterObject2)).eventually.to.be.rejectedWith('PreviousField validation failed');
                    });
                    it('Insert with PreviousFilter and PreviousField but the previousFilter resource is not the same as chosen field resource', async () => {
                        const secondResourceName = filterObjectService.secondaryTestResourceName;
                        // first upsert a filter object
                        const filterObject = await filterObjectService.createObject({
                            Resource: secondResourceName
                        });
                        const res = await filterObjectService.upsert(filterObject);
                        // upsert a filter object with PreviousFilter and PreviousField
                        const filterObject2 = await filterObjectService.createObject();
                        // the previous Filter resource is the second resource
                        filterObject2.PreviousFilter = res.Key;
                        // the field reference is to the first resource
                        filterObject2.PreviousField = filterObjectService.testPreviousFieldName;
                        await expect(filterObjectService.upsert(filterObject2)).eventually.to.be.rejectedWith('PreviousFilter validation failed');
                    });

                });
                it('Clean', async () => {
                    await cleanup();
                });
            })
        })

        describe('Filter Rule Tests', () => {

            describe('Basic CRUD', () => {
                let filterRule: FilterRule;
                it('insert', async () => {
                    filterRule = await filterRuleService.createObject();
                    const res = await filterRuleService.upsert(filterRule);
                    expect(res).to.be.an('object');
                    expect(res).to.have.property('Key')
                    expect(res).to.have.property('EmployeeType').to.equal(filterRule.EmployeeType);
                    expect(res).to.have.property('Filter').to.equal(filterRule.Filter);
                    expect(res).to.have.property('Resource').to.equal(filterRule.Resource);
                    // should have default value for PermissionSet = "Sync"
                    expect(res).to.have.property('PermissionSet').to.equal('Sync');
                    filterRule = res;
                });
                it('get', async () => {
                    const res: FilterRule | undefined = await filterRuleService.getByKey(filterRule.Key!);
                    expect(res).to.be.an('object');
                    expect(res).to.have.property('Key').to.equal(filterRule.Key);
                    expect(res).to.have.property('EmployeeType').to.equal(filterRule.EmployeeType);
                    expect(res).to.have.property('Filter').to.equal(filterRule.Filter);
                    expect(res).to.have.property('Resource').to.equal(filterRule.Resource);
                    expect(res).to.have.property('PermissionSet').to.equal('Sync');
                });
                it('update', async () => {
                    const changedFilterRule = await filterRuleService.createObject({ Key: filterRule.Key, PermissionSet: 'Online' });
                    const res = await filterRuleService.upsert(changedFilterRule);
                    expect(res).to.be.an('object');
                    const res2: FilterRule | undefined = await filterRuleService.getByKey(filterRule.Key!);
                    expect(res2).to.be.an('object');
                    expect(res2).to.have.property('Key').to.equal(changedFilterRule.Key);
                    expect(res2).to.have.property('EmployeeType').to.equal(changedFilterRule.EmployeeType);
                    expect(res2).to.have.property('Filter').to.equal(changedFilterRule.Filter);
                    expect(res2).to.have.property('Resource').to.equal(changedFilterRule.Resource);
                    expect(res2).to.have.property('PermissionSet').to.equal(changedFilterRule.PermissionSet);
                    filterRule = res2 as FilterRule;
                });
                it('delete', async () => {
                    await filterRuleService.delete([filterRule.Key!]);
                    const res2: FilterRule[] = await filterRuleService.get({ where: `Key = '${filterRule.Key}'` })
                    expect(res2).to.be.an('array').to.have.lengthOf(0);
                });
                it('clean', async () => {
                    await cleanup();
                }
                );
            })

            describe('Validation tests', () => {
                describe('Profile validations', () => {
                    it('Insert without employee type', async () => {
                        const filterRule = await filterRuleService.createObject();
                        // @ts-ignore
                        delete filterRule.EmployeeType;
                        await expect(filterRuleService.upsert(filterRule)).eventually.to.be.rejectedWith('Scheme validation failed');
                    });
                });
                describe('Resource validations', () => {
                    it('Insert without resource', async () => {
                        const filterRule = await filterRuleService.createObject();
                        // @ts-ignore
                        delete filterRule.Resource;
                        await expect(filterRuleService.upsert(filterRule)).eventually.to.be.rejectedWith('Scheme validation failed');
                    });
                    it('Insert with resource that is not found', async () => {
                        const filterRule = await filterRuleService.createObject();
                        filterRule.Resource = 'InvalidResource';
                        await expect(filterRuleService.upsert(filterRule)).eventually.to.be.rejectedWith('Resource validation failed');
                    });
                    it('Insert with resource that is not referenced by another resource', async () => {
                        const filterRule = await filterRuleService.createObject();
                        filterRule.Resource = filterObjectService.thirdTestResourceName;
                        await expect(filterRuleService.upsert(filterRule)).eventually.to.be.rejectedWith('Resource validation failed');
                    });
                });
                describe('Filter validations', () => {
                    it('Insert without filter', async () => {
                        const filterRule = await filterRuleService.createObject();
                        // @ts-ignore
                        delete filterRule.Filter;
                        await expect(filterRuleService.upsert(filterRule)).eventually.to.be.rejectedWith('Scheme validation failed');
                    });
                    it('Insert with filter that is not found', async () => {
                        const filterRule = await filterRuleService.createObject();
                        filterRule.Filter = 'InvalidFilter';
                        await expect(filterRuleService.upsert(filterRule)).eventually.to.be.rejectedWith('Filter validation failed');
                    });
                });
                it('insert with an existing combination of employee type and resource', async () => {
                    const filterRule = await filterRuleService.createObject();
                    const res = await filterRuleService.upsert(filterRule);
                    const filterRule2 = await filterRuleService.createObject();
                    await expect(filterRuleService.upsert(filterRule2)).eventually.to.be.rejectedWith('Profile and resource combination must be unique');
                });
                describe('PermissionSet validation', () => {
                    it('Insert with invalid PermissionSet', async () => {
                        const filterRule = await filterRuleService.createObject();
                        (filterRule.PermissionSet as any) = 'InvalidPermissionSet';
                        await expect(filterRuleService.upsert(filterRule)).eventually.to.be.rejectedWith('Scheme validation failed');
                    });
                });
                it('Clean', async () => {
                    await cleanup();
                });
            });
        });
    });

    return new Promise((resolve, reject) => {
        mocha
            .run()
            .on('end', () => {
                setTimeout(() => {
                    console.log("Finished running benchmark tests")
                    resolve(result);
                }, 500);
            });
    });

}