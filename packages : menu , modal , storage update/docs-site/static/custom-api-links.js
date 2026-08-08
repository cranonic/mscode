// static/js/custom-api-links.js

function moveDefinedInLinks() {
  const sourceElements = Array.from(document.querySelectorAll('p, li, div, aside')).filter(el => 
    el.textContent.includes('Defined in') && el.querySelector('a')
  );

  sourceElements.forEach(el => {
    if (el.dataset.linked) return; 
    el.dataset.linked = "true";

    const linkElement = el.querySelector('a');
    if (!linkElement) return;
    const sourceUrl = linkElement.href;

    let currentElement = el;
    let heading = null;
    
    while (currentElement && currentElement !== document.body) {
       let prev = currentElement.previousElementSibling;
       while (prev) {
         if (['H3', 'H4', 'H2'].includes(prev.tagName)) {
            heading = prev;
            break;
         }
         prev = prev.previousElementSibling;
       }
       if (heading) break;
       currentElement = currentElement.parentElement;
    }

    if (heading && !heading.dataset.hasSourceLink) {
      heading.dataset.hasSourceLink = "true";
      
      const originalHTML = heading.innerHTML;
      heading.innerHTML = `<a href="${sourceUrl}" target="_blank" class="api-source-link" title="View Source Code">${originalHTML}</a>`;
      
      el.style.display = 'none';
    }
  });
}

const observer = new MutationObserver(() => {
  moveDefinedInLinks();
});

window.addEventListener('load', () => {
  moveDefinedInLinks();
  observer.observe(document.body, { childList: true, subtree: true });
});