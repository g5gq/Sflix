async function searchResults(query) {
  const res = await fetchV2(`https://sflix.to/search/${query}`);
  const html = await res.text();

  const items = [];
  const dom = document.createElement("div");
  dom.innerHTML = html;

  const elements = dom.querySelectorAll(".flw-item");
  elements.forEach(el => {
    const title = el.querySelector(".film-name a")?.textContent?.trim();
    const link = el.querySelector("a")?.href;
    const image = el.querySelector("img")?.getAttribute("data-src");

    if (title && link && image) {
      items.push({
        title: title,
        image: image,
        link: link
      });
    }
  });

  return JSON.stringify(items);
}

async function extractDetails(url) {
  const res = await fetchV2(url);
  const html = await res.text();

  const dom = document.createElement("div");
  dom.innerHTML = html;

  const title = dom.querySelector(".film-title")?.textContent?.trim();
  const summary = dom.querySelector(".description")?.textContent?.trim();
  const image = dom.querySelector(".film-poster img")?.src;
  const genre = [...dom.querySelectorAll(".item.item-genres a")].map(el => el.textContent.trim()).join(", ");

  return JSON.stringify({
    title: title,
    description: summary,
    image: image,
    genres: genre
  });
}

async function extractEpisodes(url) {
  const res = await fetchV2(url);
  const html = await res.text();

  const dom = document.createElement("div");
  dom.innerHTML = html;

  const episodeLinks = dom.querySelectorAll("ul.ulclear.fss-list li a");
  const episodes = [];

  episodeLinks.forEach((el, index) => {
    const epId = el.getAttribute("data-id");
    const epNum = el.textContent.trim();

    if (epId) {
      episodes.push({
        title: `Episode ${epNum}`,
        link: `${url}?ep=${epId}`
      });
    }
  });

  return JSON.stringify(episodes.length > 0 ? episodes : [{
    title: "Full Movie",
    link: url
  }]);
}

async function extractStreamUrl(url) {
  let targetUrl = url;
  const epParam = url.split("?ep=")[1];

  if (epParam) {
    const res = await fetchV2(url.split("?")[0]);
    const html = await res.text();

    const dom = document.createElement("div");
    dom.innerHTML = html;

    const scriptTag = [...dom.querySelectorAll("script")].find(s => s.textContent.includes("var episodes"));
    const match = scriptTag?.textContent.match(/episodes\s*=\s*(\[\{.+?\}\]);/s);

    if (match) {
      try {
        const episodes = JSON.parse(match[1]);
        const episode = episodes.find(e => e.id === epParam);
        if (episode?.link) {
          targetUrl = episode.link;
        }
      } catch (e) {}
    }
  }

  const res = await fetchV2(targetUrl);
  const html = await res.text();

  const dom = document.createElement("div");
  dom.innerHTML = html;

  const iframe = dom.querySelector("#iframe-embed")?.src;

  return JSON.stringify({
    stream: iframe
  });
}
