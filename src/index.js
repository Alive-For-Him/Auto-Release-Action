import * as core from '@actions/core';
import { context, getOctokit } from '@actions/github';

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

	// get commit information
	const commits = context.payload.commits;
	if (commits.length === 0) {
		return setFailed('No commits found.');
	}
	const commit = commits[commits.length - 1];
	const pkgInfo = await getCommitInfo(token, 'package.json', commit.id);
	const clInfo = await getCommitInfo(token, changelog, commit.id);

	// load version
	const _version = /"versison":\s*"(.+)"/.exec(pkgInfo);
	if (_version === null) {
		return setFailed('Version was not found in package.json.');
	}
	const version = _version[1];
	console.log(version);

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
 * Get a file's contents from a commit
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
		return '';
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

	return Buffer.from(data.content, 'base64').toString('binary');
};

const setSuccess = ({ id, version, releaseUrl }) => {
	core.info(`id: ${id}`);
	core.info(`version: ${version}`);
	core.info(`releaseUrl: ${releaseUrl}`);

	core.setOutput('id', id);
	core.setOutput('version', version);
	core.setOutput('releaseUrl', releaseUrl);
	core.setOutput('success', true);
};

const setFailed = (msg, isError = false) => {
	core.setOutput('success', false);

	if (!isError) {
		core.info(msg);
	} else {
		core.setFailed(msg);
	}
};

run().catch((e) => {
	setFailed(e.message ?? 'An error has occurred.', true);
});
