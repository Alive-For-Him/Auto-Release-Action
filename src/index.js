import * as core from '@actions/core';
import { context } from '@actions/github';
import GitHub from './github.js';

export const run = async () => {
	const token = process.env.GITHUB_TOKEN;
	if (token === undefined) {
		throw 'The GITHUB_TOKEN environment variable was not set';
	}

	const gh = new GitHub(token);

	const commits = context.payload.commits;
	if (commits.length === 0) {
		core.info('No commits found');
		core.setOutput('released', false);

		return;
	}

	console.log('Com', commits);

	const title = core.getInput('title');
	const tag = core.getInput('tag');
	const draft = core.getInput('draft');
	const changelog = core.getInput('changelog');
	const changelogEntry = core.getInput('changelog-entry');

	console.log(process.env);
	console.log(title, tag, draft, changelog, changelogEntry);

	core.setOutput('released', true);
	core.setOutput('id', '');
	core.setOutput('version', '');
	core.setOutput('html_url', '');
	core.setOutput('upload_url', '');
};

const getChangelog = async (filePath) => {};

try {
	run();
} catch (e) {
	core.setFailed(e.message ?? 'An error has occurred.');
}
