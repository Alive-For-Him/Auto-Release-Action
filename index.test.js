import { RunOptions, RunTarget } from 'github-action-ts-run-api';
import { run } from './index.js';

const target = RunTarget.syncFn(run);
const options = RunOptions.create().setInputs({ title: 'hello-world' });
const result = target.run(options);

console.log(result);
