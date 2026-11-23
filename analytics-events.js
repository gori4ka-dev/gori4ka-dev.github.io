
document.addEventListener('click', (event) => {
    const link = event.target.closest('a[href]');
    if (!link || typeof gtag !== 'function') return;

    const href = link.getAttribute('href');
    if (!href) return;

    const url = new URL(href, location.href);

    // 1. Контакты
    if (
        url.protocol === 'mailto:' ||
        url.hostname === 't.me' ||
        url.hostname === 'linkedin.com' ||
        url.hostname === 'www.linkedin.com'
    ) {
        let method = 'email';

        if (url.hostname === 't.me') method = 'telegram';
        if (url.hostname.includes('linkedin.com')) {
            method = 'linkedin';
        }

        gtag('event', 'contact_click', {
            contact_method: method,
            link_url: url.href
        });
    }

    // 2. Клики по проектам
    const project = link.closest('[data-project]');

    if (project) {
        gtag('event', 'project_click', {
            project_name: project.dataset.project,
            link_url: url.href
        });
    }

    // 3. Выбор языка CV
    const language = link.dataset.cvLanguage;

    if (language) {
        gtag('event', 'cv_language', {
            cv_language: language
        });
    }
});
