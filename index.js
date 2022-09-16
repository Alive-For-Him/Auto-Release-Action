import * as core from '@actions/core';

const run = () => {
	const title = core.getInput('title');
	const tag = core.getInput('tag');
	const draft = core.getInput('draft');
	const changelog = core.getInput('changelog');
	const changelogEntry = core.getInput('changelog-entry');

	console.log(title, tag, draft, changelog, changelogEntry);

	core.setOutput('released', true);
	core.setOutput('id', '');
	core.setOutput('version', '');
	core.setOutput('html_url', '');
	core.setOutput('upload_url', '');
};

try {
	run();
} catch (e) {
	core.setFailed(e.message ?? 'An error has occurred.');
}
