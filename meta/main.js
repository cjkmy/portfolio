import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

let xScale;
let yScale;
let commits;
let data;

let commitProgress = 100;
let filteredCommits;
let timeScale;
let commitMaxTime;

let colors = d3.scaleOrdinal(d3.schemeTableau10);

async function loadData() {
  const data = await d3.csv('loc.csv', (d) => ({
    ...d,
    datetime: new Date(d.datetime),
  }));

  return data;
}

function processCommits(data) {
  return d3
    .groups(data, (d) => d.commit)
    .map(([commit, lines]) => {
      let first = lines[0];

      let { author, date, time, timezone, datetime } = first;

      let ret = {
        id: commit,
        url:
          'https://github.com/vis-society/lab-7/commit/' +
          commit,
        author,
        date,
        time,
        timezone,
        datetime,
        hourFrac:
          datetime.getHours() +
          datetime.getMinutes() / 60,
        totalLines: lines.length,
      };

      Object.defineProperty(ret, 'lines', {
        value: lines,
        writable: true,
        configurable: true,
        enumerable: false,
      });

      return ret;
    });
}

function renderCommitInfo(data, commits) {
  d3.select('#stats').html('');

  const dl = d3
    .select('#stats')
    .append('dl')
    .attr('class', 'stats');

  dl.append('dt').html(
    'Total <abbr title="Lines of code">LOC</abbr>'
  );
  dl.append('dd').text(data.length);

  dl.append('dt').text('Total commits');
  dl.append('dd').text(commits.length);

  dl.append('dt').text('Number of files');
  dl.append('dd').text(
    d3.group(data, (d) => d.file).size
  );

  dl.append('dt').text('Maximum depth');
  dl.append('dd').text(
    d3.max(data, (d) => +d.depth)
  );

  dl.append('dt').text('Average depth');
  dl.append('dd').text(
    d3.mean(data, (d) => +d.depth).toFixed(2)
  );

  dl.append('dt').text('Average line length');
  dl.append('dd').text(
    d3.mean(data, (d) => d.line.length).toFixed(2)
  );
}

function renderScatterPlot(data, commits) {
  const width = 1000;
  const height = 600;

  const margin = {
    top: 10,
    right: 10,
    bottom: 30,
    left: 20,
  };

  const usableArea = {
    top: margin.top,
    right: width - margin.right,
    bottom: height - margin.bottom,
    left: margin.left,
    width:
      width - margin.left - margin.right,
    height:
      height - margin.top - margin.bottom,
  };

  const svg = d3
    .select('#chart')
    .append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .style('overflow', 'visible');

  xScale = d3
    .scaleTime()
    .domain(
      d3.extent(commits, (d) => d.datetime)
    )
    .range([
      usableArea.left,
      usableArea.right,
    ])
    .nice();

  yScale = d3
    .scaleLinear()
    .domain([0, 24])
    .range([
      usableArea.bottom,
      usableArea.top,
    ]);

  const [minLines, maxLines] = d3.extent(
    commits,
    (d) => d.totalLines
  );

  const rScale = d3
    .scaleSqrt()
    .domain([minLines, maxLines])
    .range([2, 30]);

  const sortedCommits = d3.sort(
    commits,
    (d) => -d.totalLines
  );

  const gridlines = svg
    .append('g')
    .attr('class', 'gridlines')
    .attr(
      'transform',
      `translate(${usableArea.left}, 0)`
    );

  gridlines.call(
    d3
      .axisLeft(yScale)
      .tickFormat('')
      .tickSize(-usableArea.width)
  );

  const dots = svg
    .append('g')
    .attr('class', 'dots');

  dots
    .selectAll('circle')
    .data(sortedCommits, (d) => d.id)
    .join('circle')
    .attr('fill', 'steelblue')
    .attr(
      'cx',
      (d) => xScale(d.datetime)
    )
    .attr(
      'cy',
      (d) => yScale(d.hourFrac)
    )
    .attr(
      'r',
      (d) => rScale(d.totalLines)
    )
    .style('fill-opacity', 0.7)
    .on(
      'mouseenter',
      (event, commit) => {
        d3.select(event.currentTarget)
          .style('fill-opacity', 1);

        renderTooltipContent(commit);
        updateTooltipVisibility(true);
        updateTooltipPosition(event);
      }
    )
    .on('mouseleave', (event) => {
      d3.select(event.currentTarget)
        .style('fill-opacity', 0.7);

      updateTooltipVisibility(false);
    });

  const xAxis = d3.axisBottom(xScale);

  const yAxis = d3
    .axisLeft(yScale)
    .tickFormat(
      (d) =>
        String(d % 24).padStart(
          2,
          '0'
        ) + ':00'
    );

  svg
    .append('g')
    .attr(
      'transform',
      `translate(0, ${usableArea.bottom})`
    )
    .attr('class', 'x-axis')
    .call(xAxis);

  svg
    .append('g')
    .attr(
      'transform',
      `translate(${usableArea.left}, 0)`
    )
    .attr('class', 'y-axis')
    .call(yAxis);

  createBrushSelector(svg);

  svg
    .selectAll('.dots, .overlay ~ *')
    .raise();
}

function updateScatterPlot(data, commits) {
  const width = 1000;
  const height = 600;

  const margin = {
    top: 10,
    right: 10,
    bottom: 30,
    left: 20,
  };

  const usableArea = {
    top: margin.top,
    right: width - margin.right,
    bottom: height - margin.bottom,
    left: margin.left,
    width:
      width - margin.left - margin.right,
    height:
      height - margin.top - margin.bottom,
  };

  const svg = d3
    .select('#chart')
    .select('svg');

  xScale = xScale.domain(
    d3.extent(commits, (d) => d.datetime)
  );

  const [minLines, maxLines] = d3.extent(
    commits,
    (d) => d.totalLines
  );

  const rScale = d3
    .scaleSqrt()
    .domain([minLines, maxLines])
    .range([2, 30]);

  const xAxis = d3.axisBottom(xScale);

  const xAxisGroup =
    svg.select('g.x-axis');

  xAxisGroup.selectAll('*').remove();

  xAxisGroup.call(xAxis);

  const dots = svg.select('g.dots');

  const sortedCommits = d3.sort(
    commits,
    (d) => -d.totalLines
  );

  dots
    .selectAll('circle')
    .data(sortedCommits, (d) => d.id)
    .join('circle')
    .attr('fill', 'steelblue')
    .attr(
      'cx',
      (d) => xScale(d.datetime)
    )
    .attr(
      'cy',
      (d) => yScale(d.hourFrac)
    )
    .attr(
      'r',
      (d) => rScale(d.totalLines)
    )
    .style('fill-opacity', 0.7)
    .on(
      'mouseenter',
      (event, commit) => {
        d3.select(event.currentTarget)
          .style('fill-opacity', 1);

        renderTooltipContent(commit);
        updateTooltipVisibility(true);
        updateTooltipPosition(event);
      }
    )
    .on('mouseleave', (event) => {
      d3.select(event.currentTarget)
        .style('fill-opacity', 0.7);

      updateTooltipVisibility(false);
    });

  svg
    .selectAll('.dots, .overlay ~ *')
    .raise();
}

function updateFileDisplay(filteredCommits) {
  let lines = filteredCommits.flatMap(
    (d) => d.lines
  );

  let files = d3
    .groups(lines, (d) => d.file)
    .map(([name, lines]) => {
      return { name, lines };
    })
    .sort(
      (a, b) =>
        b.lines.length - a.lines.length
    );

  let filesContainer = d3
    .select('#files')
    .selectAll('div')
    .data(files, (d) => d.name)
    .join((enter) =>
      enter.append('div').call((div) => {
        div.append('dt');
        div.append('dd');
      })
    );

  filesContainer
    .select('dt')
    .html(
      (d) => `
        <code>${d.name}</code>
        <small>${d.lines.length} lines</small>
      `
    );

  filesContainer
    .select('dd')
    .selectAll('div')
    .data((d) => d.lines)
    .join('div')
    .attr('class', 'loc')
    .style(
      'background',
      (d) => colors(d.type)
    );
}

function renderTooltipContent(commit) {
  const link =
    document.getElementById(
      'commit-link'
    );

  const date =
    document.getElementById(
      'commit-date'
    );

  const author =
    document.getElementById(
      'commit-author'
    );

  const time =
    document.getElementById(
      'commit-time'
    );

  const lines =
    document.getElementById(
      'commit-lines'
    );

  if (Object.keys(commit).length === 0)
    return;

  link.href = commit.url;
  link.textContent = commit.id;

  date.textContent =
    commit.datetime?.toLocaleString('en', {
      dateStyle: 'full',
    });

  author.textContent = commit.author;
  time.textContent = commit.time;
  lines.textContent = commit.totalLines;
}

function updateTooltipVisibility(
  isVisible
) {
  const tooltip =
    document.getElementById(
      'commit-tooltip'
    );

  tooltip.hidden = !isVisible;
}

function updateTooltipPosition(event) {
  const tooltip =
    document.getElementById(
      'commit-tooltip'
    );

  tooltip.style.left = `${
    event.clientX + 10
  }px`;

  tooltip.style.top = `${
    event.clientY + 10
  }px`;
}

function createBrushSelector(svg) {
  svg.call(
    d3.brush().on(
      'start brush end',
      brushed
    )
  );
}

function brushed(event) {
  const selection = event.selection;

  d3.selectAll('circle')
    .classed('selected', (d) =>
      isCommitSelected(selection, d)
    )
    .style('fill', (d) =>
      isCommitSelected(selection, d)
        ? 'red'
        : 'steelblue'
    );

  renderSelectionCount(selection);
  renderLanguageBreakdown(selection);
}

function isCommitSelected(
  selection,
  commit
) {
  if (!selection) {
    return false;
  }

  const [[x0, y0], [x1, y1]] =
    selection;

  const x = xScale(commit.datetime);

  const y = yScale(commit.hourFrac);

  return (
    x >= x0 &&
    x <= x1 &&
    y >= y0 &&
    y <= y1
  );
}

function renderSelectionCount(selection) {
  const selectedCommits = selection
    ? filteredCommits.filter((d) =>
        isCommitSelected(selection, d)
      )
    : [];

  const countElement =
    document.querySelector(
      '#selection-count'
    );

  countElement.textContent = `${
    selectedCommits.length || 'No'
  } commits selected`;
}

function renderLanguageBreakdown(
  selection
) {
  const selectedCommits = selection
    ? filteredCommits.filter((d) =>
        isCommitSelected(selection, d)
      )
    : [];

  const container =
    document.getElementById(
      'language-breakdown'
    );

  if (selectedCommits.length === 0) {
    container.innerHTML = '';
    return;
  }

  const lines = selectedCommits.flatMap(
    (d) => d.lines
  );

  const breakdown = d3.rollup(
    lines,
    (v) => v.length,
    (d) => d.type
  );

  container.innerHTML = '';

  for (const [
    language,
    count,
  ] of breakdown) {
    const proportion =
      count / lines.length;

    const formatted =
      d3.format('.1~%')(proportion);

    container.innerHTML += `
      <dt>${language}</dt>
      <dd>${count} lines (${formatted})</dd>
    `;
  }
}

function onTimeSliderChange() {
  commitProgress = +document.querySelector(
    '#commit-progress'
  ).value;

  commitMaxTime =
    timeScale.invert(commitProgress);

  document.querySelector(
    '#commit-time-display'
  ).textContent =
    commitMaxTime.toLocaleString('en', {
      dateStyle: 'long',
      timeStyle: 'short',
    });

  filteredCommits = commits.filter(
    (d) => d.datetime <= commitMaxTime
  );

  renderCommitInfo(
    data,
    filteredCommits
  );

  updateScatterPlot(
    data,
    filteredCommits
  );

  updateFileDisplay(filteredCommits);
}

data = await loadData();

commits = processCommits(data);

filteredCommits = commits;

timeScale = d3
  .scaleTime()
  .domain([
    d3.min(
      commits,
      (d) => d.datetime
    ),
    d3.max(
      commits,
      (d) => d.datetime
    ),
  ])
  .range([0, 100]);

commitMaxTime =
  timeScale.invert(commitProgress);

renderCommitInfo(data, commits);

renderScatterPlot(data, commits);

updateFileDisplay(filteredCommits);

document
  .querySelector('#commit-progress')
  .addEventListener(
    'input',
    onTimeSliderChange
  );

onTimeSliderChange();