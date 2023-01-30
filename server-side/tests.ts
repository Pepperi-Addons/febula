import { Client, Request } from '@pepperi-addons/debug-server/dist';
import Mocha, { Suite, MochaReporter } from './mocha';
import { expect } from 'chai';
import { v4 as uuid } from 'uuid'
import { Promise } from "bluebird";
import { config as dotenv } from 'dotenv'
import { FilterObject, FilterRule } from './types';
import { FilterObjectService } from './services/filter-object.service';
import { FilterRuleService } from './services/filter-rule.service';
dotenv();
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
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

function getExpirationDateTime() {
    //ISO of tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString();
}

function getShortUUID() {
    return uuid().substring(0, 8);
}

function getFilterObjectName() {
    return `TestFilterObject_${getShortUUID()}`;
}

function createFilterObject(specifics?: {
    Key?: string,
    Name?: string,
    Resource?: string,
    Field?: string,
    PreviousField?: string,
    PreviousFilter?: string
}): FilterObject {
    const filterObject: FilterObject = {
        Key: specifics?.Key || undefined,
        Name: specifics?.Name || getFilterObjectName(),
        Resource: specifics?.Resource || "TestResource",
        Field: specifics?.Field || "TestField",
        PreviousField: specifics?.PreviousField || undefined,
        PreviousFilter: specifics?.PreviousFilter || undefined,
        ExpirationDateTime: getExpirationDateTime()
    }
    return filterObject;
}



export async function fomo_tests(client: Client, request: Request) {
    let result = {}
    const cb = (res) => {
        result = res;
    }
    const mocha = createMocha(client, cb);
    const root = mocha.suite;
    let context: Mocha.Suite | undefined = root;
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

    const afterEach = (fn: Mocha.Func | Mocha.AsyncFunc | undefined) => {
        context?.afterEach(fn);
    }

    describe('FOMO Tests', () => {
        const PARALLEL_AMOUNT = 10;
        const upsertedFilterObjects: FilterObject[] = [];
        const upsertedFilterRules: FilterObject[] = [];
        const filterObjectService = new FilterObjectService(client, client.AddonUUID, client.AddonSecretKey);
        const filterRuleService = new FilterRuleService(client, client.AddonUUID, client.AddonSecretKey);

        const upsertFilterObject = async (filterObject: FilterObject) => {
            try {
                const res = await filterObjectService.upsert(filterObject);
                if (!upsertedFilterObjects.find(f => f.Key === res.Key)) {
                    upsertedFilterObjects.push(res);
                }
                return res;
            }
            catch (ex) {
                console.error(`Error in upsertFilterObject: ${ex}`);
                throw ex
            }
        }

        const cleanFilterObjects = async () => {
            await Promise.map(upsertedFilterObjects, async (filterObject) => {
                await filterObjectService.delete(filterObject.Key!);
            }, { concurrency: PARALLEL_AMOUNT });
            upsertedFilterObjects.length = 0;
        }

        const upsertFilterRule = async (filterRule: FilterRule) => {
            try {
                const res = await filterRuleService.upsert(filterRule);
                // insert if same key doesn't exist
                if (!upsertedFilterRules.find(f => f.Key === res.Key)) {
                    upsertedFilterRules.push(res);
                }
                return res;
            }
            catch (ex) {
                console.error(`Error in upsertFilterRule: ${ex}`);
                throw ex
            }
        }

        const cleanFilterRules = async () => {
            await Promise.map(upsertedFilterRules, async (filterRule) => {
                await filterRuleService.delete(filterRule.Key!);
            }, { concurrency: PARALLEL_AMOUNT });
            upsertedFilterRules.length = 0;
        }

        const cleanup = async () => {
            await cleanFilterObjects();
            await cleanFilterRules();
        }

        const createFilterRule = async (specifics?: {
            Key?: string,
            EmployeeType?: 1 | 2 | 3,
            Resource?: string,
            Filter?: string
        }): Promise<FilterRule> => {
            const filterRule: FilterRule = {
                Key: specifics?.Key || undefined,
                EmployeeType: specifics?.EmployeeType || (Math.floor(Math.random() * 3) + 1) as 1 | 2 | 3,
                Resource: specifics?.Resource || "TestResource",
                Filter: specifics?.Filter || (await upsertFilterObject(createFilterObject())).Key,
                ExpirationDateTime: getExpirationDateTime()
            }
            return filterRule;
        }

        describe('Filter Object Tests', () => {

            describe('Basic CRUD', () => {
                let filterObject: FilterObject;
                it('insert', async () => {
                    filterObject = createFilterObject();
                    const res = await upsertFilterObject(filterObject);
                    expect(res).to.be.an('object');
                    expect(res).to.have.property('Key')
                    expect(res).to.have.property('Name').to.equal(filterObject.Name);
                    expect(res).to.have.property('Resource').to.equal(filterObject.Resource);
                    expect(res).to.have.property('Field').to.equal(filterObject.Field);
                    filterObject = res;
                });
                it('get', async () => {
                    const res: FilterObject = await filterObjectService.getByKey(filterObject.Key!);
                    expect(res).to.have.property('Key').to.equal(filterObject.Key);
                    expect(res).to.have.property('Name').to.equal(filterObject.Name);
                    expect(res).to.have.property('Resource').to.equal(filterObject.Resource);
                    expect(res).to.have.property('Field').to.equal(filterObject.Field);
                });
                it('update', async () => {
                    const changedFilterObject = createFilterObject({ Key: filterObject.Key });
                    const res = await upsertFilterObject(changedFilterObject);
                    expect(res).to.be.an('object');
                    const res2: FilterObject = await filterObjectService.getByKey(filterObject.Key!);
                    expect(res2).to.have.property('Key').to.equal(changedFilterObject.Key);
                    expect(res2).to.have.property('Name').to.equal(changedFilterObject.Name);
                    expect(res2).to.have.property('Resource').to.equal(changedFilterObject.Resource);
                    expect(res2).to.have.property('Field').to.equal(changedFilterObject.Field);
                    filterObject = res2;
                });
                it('delete', async () => {
                    await filterObjectService.delete(filterObject.Key!);
                    const res2: FilterObject[] = await filterObjectService.get({ where: `Key = '${filterObject.Key}'` })
                    expect(res2).to.be.an('array').to.have.lengthOf(0);
                });
                it('clean', async () => {
                    await cleanup();
                });
            })

            describe('Validation tests', () => {
                it('Insert without name', async () => {
                    const filterObject = createFilterObject();
                    // @ts-ignore
                    delete filterObject.Name;
                    await expect(filterObjectService.upsert(filterObject)).eventually.to.be.rejectedWith('Scheme validation failed');
                });
                it('Insert without resource', async () => {
                    const filterObject = createFilterObject();
                    // @ts-ignore
                    delete filterObject.Resource;
                    await expect(filterObjectService.upsert(filterObject)).eventually.to.be.rejectedWith('Scheme validation failed');
                });
                it('Insert without field', async () => {
                    const filterObject = createFilterObject();
                    // @ts-ignore
                    delete filterObject.Field;
                    await expect(filterObjectService.upsert(filterObject)).eventually.to.be.rejectedWith('Scheme validation failed');
                });
                it('Insert with PreviousField and without PreviousFilter', async () => {
                    const filterObject = createFilterObject();
                    filterObject.PreviousField = 'PreviousField';
                    await expect(filterObjectService.upsert(filterObject)).eventually.to.be.rejectedWith('Scheme validation failed');
                });
                it('Insert with PreviousFilter and without PreviousField', async () => {
                    // first upsert a filter object
                    const filterObject = createFilterObject();
                    const res = await upsertFilterObject(filterObject);
                    // upsert a filter object with PreviousFilter but without PreviousField
                    const filterObject2 = createFilterObject();
                    filterObject2.PreviousFilter = res.Key;
                    await expect(filterObjectService.upsert(filterObject2)).eventually.to.be.rejectedWith('Scheme validation failed');
                });
                it('Insert with PreviousFilter and PreviousField but PreviousFilter is not found', async () => {
                    const filterObject = createFilterObject();
                    filterObject.PreviousFilter = 'PreviousFilter';
                    filterObject.PreviousField = 'PreviousField';
                    await expect(filterObjectService.upsert(filterObject)).eventually.to.be.rejectedWith('Reference validation failed');
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
                    filterRule = await createFilterRule();
                    const res = await upsertFilterRule(filterRule);
                    expect(res).to.be.an('object');
                    expect(res).to.have.property('Key')
                    expect(res).to.have.property('EmployeeType').to.equal(filterRule.EmployeeType);
                    expect(res).to.have.property('Filter').to.equal(filterRule.Filter);
                    expect(res).to.have.property('Resource').to.equal(filterRule.Resource);
                    filterRule = res;
                });
                it('get', async () => {
                    const res: FilterRule = await filterRuleService.getByKey(filterRule.Key!);
                    expect(res).to.have.property('Key').to.equal(filterRule.Key);
                    expect(res).to.have.property('EmployeeType').to.equal(filterRule.EmployeeType);
                    expect(res).to.have.property('Filter').to.equal(filterRule.Filter);
                    expect(res).to.have.property('Resource').to.equal(filterRule.Resource);
                });
                it('update', async () => {
                    const changedFilterRule = await createFilterRule({ Key: filterRule.Key });
                    const res = await upsertFilterRule(changedFilterRule);
                    expect(res).to.be.an('object');
                    const res2: FilterRule = await filterRuleService.getByKey(filterRule.Key!);
                    expect(res2).to.have.property('Key').to.equal(changedFilterRule.Key);
                    expect(res2).to.have.property('EmployeeType').to.equal(changedFilterRule.EmployeeType);
                    expect(res2).to.have.property('Filter').to.equal(changedFilterRule.Filter);
                    expect(res2).to.have.property('Resource').to.equal(changedFilterRule.Resource);
                    filterRule = res2;
                });
                it('delete', async () => {
                    await filterRuleService.delete(filterRule.Key!);
                    const res2: FilterRule[] = await filterRuleService.get({ where: `Key = '${filterRule.Key}'` })
                    expect(res2).to.be.an('array').to.have.lengthOf(0);
                });
                it('clean', async () => {
                    await cleanup();
                }
                );
            })

            describe('Validation tests', () => {
                it('Insert without employee type', async () => {
                    const filterRule = await createFilterRule();
                    // @ts-ignore
                    delete filterRule.EmployeeType;
                    await expect(filterRuleService.upsert(filterRule)).eventually.to.be.rejectedWith('Scheme validation failed');
                });
                it('Insert without resource', async () => {
                    const filterRule = await createFilterRule();
                    // @ts-ignore
                    delete filterRule.Resource;
                    await expect(filterRuleService.upsert(filterRule)).eventually.to.be.rejectedWith('Scheme validation failed');
                });
                it('Insert without filter', async () => {
                    const filterRule = await createFilterRule();
                    // @ts-ignore
                    delete filterRule.Filter;
                    await expect(filterRuleService.upsert(filterRule)).eventually.to.be.rejectedWith('Scheme validation failed');
                });
                it('Insert with filter that is not a valid filter', async () => {
                    const filterRule = await createFilterRule();
                    filterRule.Filter = 'InvalidFilter';
                    await expect(filterRuleService.upsert(filterRule)).eventually.to.be.rejectedWith('Reference validation failed');
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