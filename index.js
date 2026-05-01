
import { fetchJSON, renderProjects, fetchGitHubData } from './global.js';

const BASE_PATH =
  location.hostname === 'localhost' || location.hostname === '127.0.0.1'
    ? './'
    : '/portfolio/';

const projects = await fetchJSON(`${BASE_PATH}lib/projects.json`);

const firstThree = projects.slice(0, 3);
const container = document.querySelector('.projects');

renderProjects(firstThree, container, 'h2');

const githubData = await fetchGitHubData('cjkmy');

const profileStats = document.querySelector('#profile-stats dl');

if (profileStats) {
  profileStats.innerHTML = `
    <dt>Public Repos</dt><dd>${githubData.public_repos}</dd>
    <dt>Public Gists</dt><dd>${githubData.public_gists}</dd>
    <dt>Followers</dt><dd>${githubData.followers}</dd>
    <dt>Following</dt><dd>${githubData.following}</dd>
  `;
}