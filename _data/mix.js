const fs = require("fs");
const slugify = require("slugify");
const nodeFetch = require("node-fetch");
const eleventyFetch = require("@11ty/eleventy-fetch");

const mixes = require("../mixes.json");

const fetchImage = async (url, filename) => {
  const data = await eleventyFetch(url, {
    duration: "1y",
    type: "buffer",
  });
  fs.writeFileSync(filename, data);
};

const fetchMixcloud = async (mixId) => {
  const { play_count, description, picture_primary_color, audio_length } =
    await eleventyFetch(`https://api.mixcloud.com/deephouse-uk/${mixId}`, {
      duration: "1d",
      type: "json",
    });
  return { play_count, description, picture_primary_color, audio_length };
};

const fetchHearThis = async (mixId) => {
  const { id, playback_count, download_count, thumb } = await eleventyFetch(
    `https://api-v2.hearthis.at/deephouse-uk/${mixId}`,
    {
      duration: "1d",
      type: "json",
    }
  );
  return { id, playback_count, download_count, thumb };
};

const fetchContentLength = async (mixId) => {
  const url = `https://hearthis.at/deephouse-uk/${mixId}/listen`;
  const contentLengthCache = new eleventyFetch.AssetCache(url);
  if (contentLengthCache.isCacheValid("1d")) {
    return contentLengthCache.getCachedValue();
  }
  const { headers } = await nodeFetch(url, { method: "head" });
  const contentLength = headers.get("content-length");
  await contentLengthCache.save(contentLength);
  return contentLength;
};

const tracklistFromDescription = (description) =>
  description.split("\n").filter((track) => track.includes(" - "));

const artistsFromTracklist = (tracklist) => {
  const tags = tracklist
    .map((track) => track.split(" - ")[0])
    .map((artist) =>
      artist
        .split(/( feat | and | x |, )/)
        .map((tag) => tag.trim())
        .filter((tag) => !["feat", "and", "x", ", "].includes(tag))
    )
    .flat();
  return tags;
};

const monthFromDate = (date) =>
  new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric" }).format(
    new Date(date)
  );

const thresholdLuminance = (hexColour) => {
  const [r, g, b] = hexColour.match(/.{2}/g).map((c) => parseInt(c, 16));
  const luminance = 0.3 * r + 0.59 * g + 0.11 * b;
  return luminance > 128 ? "000" : "fff";
};

module.exports = async function () {
  return await Promise.all(
    mixes.map(async (mix) => {
      const slug = slugify(mix.title, { lower: true, strict: true });
      const mixcloud = await fetchMixcloud(mix.mixcloudSlug || slug);
      const hearThis = await fetchHearThis(mix.hearThisSlug || slug);
      const contentLength = await fetchContentLength(mix.hearThisSlug || slug);

      await fetchImage(hearThis.thumb, `./docs/images/mix/${slug}.jpg`);

      const colour = mixcloud.picture_primary_color;
      const colourContrast = thresholdLuminance(colour);
      const durationSeconds = mixcloud.audio_length;
      const month = monthFromDate(mix.date);
      const hearThisId = hearThis.id;
      const hearThisSlug = mix.hearThisSlug || slug;
      const mixcloudSlug = mix.mixcloudSlug || slug;
      const tracklist = tracklistFromDescription(mixcloud.description);
      const artists = artistsFromTracklist(tracklist);
      const popularity = [
        mixcloud.play_count,
        hearThis.playback_count,
        hearThis.download_count,
      ]
        .map(Number)
        .reduce((a, b) => a + b);

      return {
        ...mix,
        date: new Date(`${mix.date}T12:00:00.000Z`),
        slug,
        colour,
        colourContrast,
        contentLength,
        durationSeconds,
        hearThisId,
        hearThisSlug,
        mixcloudSlug,
        month,
        tracklist,
        artists,
        popularity,
      };
    })
  );
};
