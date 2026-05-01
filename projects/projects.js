import { fetchJSON, renderProjects } from '../global.js';
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

const BASE_PATH =
  location.hostname === 'localhost' || location.hostname === '127.0.0.1'
    ? '../'
    : '/portfolio/';

const projects = await fetchJSON(`${BASE_PATH}lib/projects.json`);

const containerElement = document.querySelector('.projects');
const searchInput = document.querySelector('.searchBar');
const colors = d3.scaleOrdinal(d3.schemeTableau10);

let selectedIndex = -1;
let query = '';

renderProjects(projects, containerElement, 'h2');

function getFilteredProjects() {
  let filteredProjects = projects;

  if (query) {
    filteredProjects = filteredProjects.filter((project) => {
      const values = Object.values(project).join('\n').toLowerCase();
      return values.includes(query.toLowerCase());
    });
  }

  return filteredProjects;
}

function renderPieChart(projectsGiven) {
  const rolledData = d3.rollups(
    projectsGiven,
    (v) => v.length,
    (d) => d.year
  );

  const data = rolledData.map(([year, count]) => ({
    value: count,
    label: year
  }));

  const svg = d3.select('#projects-pie-plot');
  const legend = d3.select('.legend');

  svg.selectAll('path').remove();
  legend.selectAll('*').remove();

  const arcGenerator = d3.arc()
    .innerRadius(0)
    .outerRadius(50);

  const sliceGenerator = d3.pie()
    .value((d) => d.value);

  const arcData = sliceGenerator(data);

  svg
    .selectAll('path')
    .data(arcData)
    .join('path')
    .attr('d', arcGenerator)
    .attr('fill', (_, i) => colors(i))
    .attr('class', (_, i) => selectedIndex === i ? 'selected' : '')
    .on('click', (_, d) => {
      const i = arcData.indexOf(d);

      selectedIndex = selectedIndex === i ? -1 : i;

      let filteredProjects = getFilteredProjects();

      if (selectedIndex !== -1) {
        const selectedYear = data[selectedIndex].label;
        filteredProjects = filteredProjects.filter((project) => {
          return project.year === selectedYear;
        });
      }

      renderProjects(filteredProjects, containerElement, 'h2');
      renderPieChart(getFilteredProjects());
    });

  legend
    .selectAll('li')
    .data(data)
    .join('li')
    .attr('class', (_, i) =>
      selectedIndex === i ? 'legend-item selected' : 'legend-item'
    )
    .attr('style', (_, i) => `--color:${colors(i)}`)
    .html((d) => `<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`);
}

renderPieChart(projects);

searchInput.addEventListener('input', (event) => {
  query = event.target.value;

  selectedIndex = -1;

  const filteredProjects = getFilteredProjects();

  renderProjects(filteredProjects, containerElement, 'h2');
  renderPieChart(filteredProjects);
});