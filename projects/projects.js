
import { fetchJSON, renderProjects } from '../global.js';

const BASE_PATH =
  location.hostname === 'localhost' || location.hostname === '127.0.0.1'
    ? '../'
    : '/portfolio/';

const projects = await fetchJSON(`${BASE_PATH}lib/projects.json`);
const containerElement = document.querySelector('.projects');

renderProjects(projects, containerElement, 'h2');