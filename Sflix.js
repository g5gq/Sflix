async function searchResults(query) {
    const searchUrl = `https://sflix.to/search/${encodeURIComponent(query)}`;
    const res = await fetchV2(searchUrl);
    const html = await res.text();

    const doc = new DOMParser().parseFromString(html, 'text/html');
    const movies = [...doc.querySelectorAll('.film-poster')];

    return movies.map((movie) => {
        const a = movie.querySelector('a');
        const img = movie.querySelector('img');

        const title = a.getAttribute('title') || img.getAttribute('alt');
        const href = a.getAttribute('href');
        const poster = img.getAttribute('data-src') || img.getAttribute('src');
        const yearMatch = href.match(/-(\d{4})/);
        const year = yearMatch ? parseInt(yearMatch[1]) : null;

        return {
            title,
            url: `https://sflix.to${href}`,
            image: poster,
            releaseYear: year
        };
    });
}

async function extractDetails(url) {
    const res = await fetchV2(url);
    const html = await res.text();

    const doc = new DOMParser().parseFromString(html, 'text/html');

    const title = doc.querySelector('.film-title')?.textContent.trim();
    const description = doc.querySelector('.description')?.textContent.trim();
    const image = doc.querySelector('.film-poster img')?.getAttribute('src');
    const genreEls = [...doc.querySelectorAll('.row-line:has(.row-line-name:contains("Genre")) .row-content a')];
    const genres = genreEls.map(el => el.textContent.trim());
    const releaseYear = parseInt(doc.querySelector('.row-line:has(.row-line-name:contains("Released")) .row-content')?.textContent.trim()) || null;

    return {
        title,
        description,
        image,
        genres,
        releaseYear
    };
}

async function extractEpisodes(url) {
    const res = await fetchV2(url);
    const html = await res.text();

    const doc = new DOMParser().parseFromString(html, 'text/html');

    const serversList = [...doc.querySelectorAll('.episodes ul li')];

    return serversList.map((li, index) => {
        const a = li.querySelector('a');
        const dataId = a.getAttribute('data-id');
        const episodeName = a.textContent.trim();

        return {
            name: episodeName,
            url: `https://sflix.to/ajax/episode/servers/${dataId}`,
            episode: index + 1
        };
    });
}

async function extractStreamUrl(url) {
    const res = await fetchV2(url, {
        headers: {
            'X-Requested-With': 'XMLHttpRequest'
        }
    });

    const html = await res.text();
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const iframe = doc.querySelector('iframe');
    const streamUrl = iframe?.getAttribute('src');

    return {
        headers: {},
        streamUrl
    };
}
