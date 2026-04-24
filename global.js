console.log('IT’S ALIVE!');

function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

document.body.insertAdjacentHTML(
  'afterbegin',
  `
  <label class="color-scheme">
    Theme:
    <select>
      <option value="light dark">Automatic</option>
      <option value="light">Light</option>
      <option value="dark">Dark</option>
    </select>
  </label>
  `
);
//const navLinks = $$("nav a");

//let currentLink = navLinks.find(
  //(a) => a.host === location.host && a.pathname === location.pathname,
//);

//currentLink?.classList.add('current');

let pages = [
    { url: '', title: 'Home' },
    { url: 'projects/', title: 'Projects' },
    { url: 'resume/', title: 'Resume' },
    { url: 'contact/', title: 'Contact' },
];

const BASE_PATH = (location.hostname === "localhost" || location.hostname === "127.0.0.1")
    ? "/"                  // Local server
    : "/portfolio/";         

let nav = document.createElement('nav');
document.body.prepend(nav);

for (let p of pages) {
    let url = p.url;
    let title = p.title;
    url = !url.startsWith('http') ? BASE_PATH + url : url;

    let a = document.createElement('a');
    a.href = url;
    a.textContent = title;

    a.classList.toggle(
        'current',
    a.host === location.host && a.pathname === location.pathname,
    );

    nav.append(a);
}

const select = document.querySelector('.color-scheme select');

const saved = localStorage.colorScheme;

if (saved) {
    document.documentElement.style.colorScheme = saved;
    select.value = saved;
}

select.addEventListener('input', function (event) {
    const value = event.target.value;
    console.log('color scheme changed to', value);
    document.documentElement.style.colorScheme = value;
    localStorage.colorScheme = value;
});

const form = document.querySelector('form');

form?.addEventListener('submit', function (event) {
    event.preventDefault();

    const data = new FormData(form);
    let params = [];

    for (let [name, value] of data) {
        params.push(
            `${encodeURIComponent(name)}=${encodeURIComponent(value)}`
        );
    }

    const url = `${form.action}?${params.join('&')}`;

    location.href = url;
});


export async function fetchJSON(url) {
  try {
    // Fetch the JSON file from the given URL
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`Error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;

  } catch (error) {
    console.error('Error fetching or parsing JSON data:', error);
  }
}

window.fetchJSON = fetchJSON;

export function renderProjects(projects, containerElement, headingLevel = 'h2') {
  if (!containerElement) {
    console.error('Container element not found');
    return;
  }

  const validHeadings = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];

  if (!validHeadings.includes(headingLevel)) {
    console.warn(`${headingLevel} is not valid. Using h2 instead.`);
    headingLevel = 'h2';
  }

  containerElement.innerHTML = '';
  projects.forEach((project) => {
    const article = document.createElement('article');

    article.innerHTML = `
      <${headingLevel}>${project.title}</${headingLevel}>
      <img src="${project.image}" alt="${project.title}">
      <p>${project.description}</p>
    `;

    containerElement.appendChild(article);
  });
}