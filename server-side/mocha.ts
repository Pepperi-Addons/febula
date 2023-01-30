import 'mocha/mocha.js';
const Mocha: typeof import('mocha') = (global as any).Mocha;

export class MochaReporter extends Mocha.reporters.Base {
    constructor(runner, options: any = {}) {
        super(runner, options);

        const self = this;
        const tests: Mocha.Test[] = [];
        const pending: Mocha.Test[] = [];
        const failures: Mocha.Test[] = [];
        const passes: Mocha.Test[] = [];
        let cb;
        if (options.reporterOption && options.reporterOption.cb) {
            cb = options.reporterOption.cb;
        }
        runner.on(Mocha.Runner.constants.EVENT_TEST_END, function (test) {
            tests.push(test);
        });
        runner.on(Mocha.Runner.constants.EVENT_TEST_PASS, function (test) {
            passes.push(test);
        });
        runner.on(Mocha.Runner.constants.EVENT_TEST_FAIL, function (test) {
            failures.push(test);
        });
        runner.on(Mocha.Runner.constants.EVENT_TEST_PENDING, function (test) {
            pending.push(test);
        });
        runner.once(Mocha.Runner.constants.EVENT_RUN_END, () => {
            const obj = {
                stats: self.stats,
                tests: tests.map(this.clean)
            };
            runner.testResults = obj;
            if (cb) {
                try {
                    cb(obj);
                }
                catch (err) {
                    console.error(`Reporter Error: ${(err as Error).message}`);
                    throw err;
                }
            }
            else {
                process.stdout.write(JSON.stringify(obj, undefined, 2));
            }
        });
    }

    clean(test: Mocha.Test) {
        return {
            title: test.title,
            duration: test.duration,
            failed: test.isFailed(),
            passed: test.isPassed(),
            suite: test.parent?.title,
            superSuite: test.parent?.parent?.title,
            failure: test.err?.message,
        };
    }
}

export default Mocha;
export const { Suite, Test } = Mocha;