import * as core from '@actions/core';
import { context, getOctokit } from '@actions/github';

export const run = async () => {
	const token = process.env.GITHUB_TOKEN;
	const title = core.getInput('title') ?? 'v$version';
	const tag = core.getInput('tag') ?? 'v$version';
	const draft = (core.getInput('draft') ?? 'false').toLowerCase() === 'true';
	const changelog = core.getInput('changelog') ?? 'CHANGELOG.md';
	const changelogHeaderRegexp =
		core.getInput('changelog-header-regexp') ?? '^## v(\\d+\\.\\d+\\.\\d+)';

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
	const _version = /"version":\s*"(.+)"/.exec(pkgInfo);
	if (_version === null || !_version[1]) {
		return setFailed('Version was not found in package.json.');
	}
	const version = _version[1];

	// load version-specific changelog
	const body = getChangelogVersion(clInfo, changelogHeaderRegexp, version);

	// create the release
	const release = await createRelease(token, {
		title: value(title, version),
		tag: value(tag, version),
		body,
		draft,
	});

	setSuccess({
		id: '',
		version: version,
		releaseUrl: '',
	});
};

/**
 * Replace '$version' inside the `val` string
 */
const value = (val, version) => {
	return val.replace(/\$version/, version);
};

/**
 * Create a release
 */
const createRelease = async (token, { title, tag, draft, body }) => {
	const gh = getOctokit(token);

	console.log('Creating...', title, tag, draft, body);

	try {
		const response = await gh.rest.repos.createRelease({
			...context.repo,
			name: title,
			tag_name: tag,
			body: String(body),
			draft,
		});

		return response;
	} catch (e) {
		console.log(e);
	}
};

/**
 * Extract the version changes from the changelog
 */
const getChangelogVersion = (cl, clHeaderRegExp, version) => {
	const lines = cl.split(/\r?\n/);
	let changes = '';
	let headerMatch = false;

	const headerRegExp = new RegExp(clHeaderRegExp, 'i');
	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];

		const exec = headerRegExp.exec(line);

		// this is the beginning of the version match
		if (exec !== null && exec.length >= 2) {
			if (headerMatch) break; // we are done; 2nd header match
			if (exec[1] === version) headerMatch = true; // begin matching
			continue;
		}

		if (headerMatch) changes += line;
	}

	return changes;
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
