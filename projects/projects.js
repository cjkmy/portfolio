import { fetchJSON, renderProjects } from '../global.js';

const projects = await fetchJSON('../lib/projects.json');
const containerElement = document.querySelector('.projects');

renderProjects(projects, containerElement, 'h2');

const titleElement = document.querySelector('.projects-title');
titleElement.textContent = `Projects (${projects.length})`;