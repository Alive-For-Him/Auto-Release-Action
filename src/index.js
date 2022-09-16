import * as core from '@actions/core';
import { context, getOctokit } from '@actions/github';
import { RequestError } from '@octokit/request-error';

export const run = async () => {
	const token = process.env.GITHUB_TOKEN;
	const title = core.getInput('title') ?? 'v$semver';
	const tag = core.getInput('tag') ?? 'v$semver';
	const draft = core.getInput('draft') ?? 'false';
	const changelog = core.getInput('changelog') ?? 'CHANGELOG.md';
	const changelogEntry = core.getInput('changelog-entry') ?? 'v$semver';

	if (token === undefined) {
		throw 'The GITHUB_TOKEN environment variable was not set';
	}

	// get commit info
	const commits = context.payload.commits;
	if (commits.length === 0) {
		core.info('No commits found');
		core.setOutput('released', false);

		return;
	}
	const commit = commits[commits.length - 1];
	const pkgInfo = await getCommitInfo(token, 'package.json', commit);
	const clInfo = await getCommitInfo(token, changelog, commit);

	console.log('package.json', pkgInfo);
	console.log('CHANGELOG.md', clInfo);

	//
	// console.log(process.env);
	// console.log(title, tag, draft, changelog, changelogEntry);

	core.setOutput('released', true);
	core.setOutput('id', '');
	core.setOutput('version', '');
	core.setOutput('html_url', '');
	core.setOutput('upload_url', '');
};

/**
 * Get a file in a commit
 */
const getCommitInfo = async (token, path, ref) => {
	const gh = getOctokit(token);
	let response;

	try {
		response = await gh.rest.repos.getContent({
			...context.repo,
			path,
			ref,
		});
	} catch (e) {
		console.log(e);
		// if (!e instanceof RequestError) throw e;
		// throw `The path ${path} does not exist`;
	}

	const { data } = response;

	if (Array.isArray(data)) {
		throw `The path ${path} is a folder. Please provide a file path.`;
	}

	if (data.type === 'symlink' && !data.content) {
		return await getCommitInfo(data.target, ref);
	}

	if (data.type === 'submodule') {
		throw `The file cannot be inside of a submodule`;
	}

	if (!data.content) {
		return '';
		// throw `Something went wrong when trying to get the file at ${path}`;
	}

	return data.content; // atob(data.content);
};

try {
	run();
} catch (e) {
	core.setFailed(e.message ?? 'An error has occurred.');
}
