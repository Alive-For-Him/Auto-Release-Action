// import { RunOptions, RunTarget } from 'github-action-ts-run-api';
// import { run } from './index.js';

// const target = RunTarget.syncFn(run);
// const options = RunOptions.create().setInputs({ title: 'hello-world' });
// const result = target.run(options);

// // console.log(result);

const CL = `# CHANGELOG

All changes to this project will be documented in this file.

## v1.0.1

### Changed

-   Fixed a typo in the README
-   Bugfix for #24

## v1.0.0

Stuff...
`;

const version = '1.0.0';
const lines = CL.split(/\r?\n/);
let versionChanges = '';
let headerMatch = false;

// console.log(lines);
const headerRegExp = new RegExp('## v(\\d+\\.\\d+\\.\\d+)', 'i');
console.log(headerRegExp);

// lines.forEach((l) => {
for (let i = 0; i < lines.length; i++) {
	const line = lines[i];

	const exec = headerRegExp.exec(line);

	// this is the beginning of the version match
	if (exec !== null && exec.length >= 2) {
		if (headerMatch) break; // we are done; 2nd header match
		if (exec[1] === version) headerMatch = true; // begin matching
		continue;
	}

	if (headerMatch) versionChanges += line;
}

console.log(versionChanges);

// let match;
// while ((match = /## v\d+\.\d+\.\d+/gi.exec(CL)) !== null) {
// console.log(match);
// }

// console.log(matches);
