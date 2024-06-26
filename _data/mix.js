const fs = require("fs");
const slugify = require("slugify");
const eleventyFetch = require("@11ty/eleventy-fetch");
const sharp = require("sharp");

const mixesBase = require("../mixes.json");

const fetchImage = async (url, filename) => {
  const data = await eleventyFetch(url, {
    duration: "1y",
    type: "buffer",
  });
  fs.writeFileSync(filename, data);
};

const fetchMixcloud = async (mixId) => {
  try {
    const { play_count, description, audio_length, slug } = await eleventyFetch(
      `https://api.mixcloud.com/deephouse-uk/${mixId}`,
      {
        duration: "1d",
        type: "json",
      }
    );
    return {
      play_count,
      description,
      audio_length,
      slug,
    };
  } catch (err) {
    return {};
  }
};

const fetchHearThis = async (mixId) => {
  const {
    id,
    playback_count,
    download_count,
    description,
    duration,
    thumb,
    bpm,
  } = await eleventyFetch(`https://api-v2.hearthis.at/deephouse-uk/${mixId}`, {
    duration: "1d",
    type: "json",
  });
  return {
    id,
    playback_count,
    download_count,
    description,
    duration,
    thumb,
    bpm,
  };
};

const fetchEnclosureMetadata = async (mixId) => {
  const url = `https://hearthis.app/deephouse-uk/${mixId}/listen/`;
  const contentCache = new eleventyFetch.AssetCache(mixId);
  if (contentCache.isCacheValid("1d")) {
    const content = await contentCache.getCachedValue();
    return String(content).split("\t");
  }
  const location = await fetch(url, { redirect: "manual" });
  const contentUrl = location.headers.get("location");
  const content = await fetch(contentUrl, { method: "head" });
  const contentLength = content.headers.get("content-length");

  await contentCache.save(`${contentLength}\t${contentUrl}`);
  return [contentLength, contentUrl];
};

const summaryFromDescription = (description) =>
  description.split("\n")
    .filter((line) => line.trim().length > 0)
    .filter((line) => !line.includes(" - "))
    .filter((line) => !line.includes("unsplash"))
    .filter((line) => !line.startsWith("Recorded live"))
    .filter((line) => !line.startsWith("Photo by"))
    .join("")
    .trim();

const tracklistFromDescription = (description) =>
  description.split("\n").filter((track) => track.includes(" - "));

const photoCreditFromDescription = (description) =>
  description
    .split("\n")
    .filter((track) => track.startsWith("Photo by"))
    .join("")
    .trim();

const artistsFromTracklist = (tracklist) => {
  const tags = tracklist
    .map((track) => track.split(" - ")[0])
    .map((artist) =>
      artist
        .split(/( feat | and | x |, )/)
        .map((tag) => tag.trim())
        .filter((tag) => !["feat", "and", "x", ",", ", "].includes(tag))
    )
    .flat();
  return [...new Set(tags)];
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

const dominantColour = async (filename) => {
  const { dominant } = await sharp(filename).stats();
  const { r, g, b } = dominant;
  return [r, g, b]
    .map((c) =>
      Math.round(c * 0.9)
        .toString(16)
        .padStart(2, "0")
    )
    .join("");
};

module.exports = async function () {
  const mixes = await Promise.all(
    mixesBase.map(async (mix) => {
      const slug = slugify(mix.title, { lower: true, strict: true });
      const mixcloud = await fetchMixcloud(mix.mixcloudSlug || slug);
      const hearThis = await fetchHearThis(mix.hearThisSlug || slug);

      const thumbnailFilename = `./docs/images/mix/${slug}.jpg`;
      await fetchImage(
        hearThis.thumb.replace("w200_h200_q70", "w274_h274_q80"),
        thumbnailFilename
      );
      const colour = await dominantColour(thumbnailFilename);
      const colourContrast = thresholdLuminance(colour);

      const [contentLength, contentUrl] = await fetchEnclosureMetadata(
        mix.hearThisSlug || slug
      );
      const durationSeconds = Number(
        mixcloud.audio_length || hearThis.duration
      );
      const month = monthFromDate(mix.date);
      const subtitle = mix.subtitle || month;
      const hearThisId = hearThis.id;
      const hearThisSlug = mix.hearThisSlug || slug;
      const mixcloudSlug = mixcloud.slug;
      const { bpm } = hearThis;
      const description = mixcloud.description || hearThis.description;
      const summary = summaryFromDescription(description);
      const tracklist = tracklistFromDescription(description);
      const photoCredit = photoCreditFromDescription(description);
      const artists = artistsFromTracklist(tracklist);
      const popularity = [
        mixcloud.play_count,
        hearThis.playback_count,
        hearThis.download_count,
      ]
        .filter(Boolean)
        .map(Number)
        .reduce((a, b) => a + b);

      return {
        ...mix,
        date: new Date(`${mix.date}T12:00:00.000Z`),
        slug,
        colour,
        colourContrast,
        contentLength,
        contentUrl,
        durationSeconds,
        hearThisId,
        hearThisSlug,
        mixcloudSlug,
        month,
        subtitle,
        bpm,
        summary,
        tracklist,
        photoCredit,
        artists,
        popularity,
      };
    })
  );
  return mixes.map((mix) => ({
    ...mix,
    related: mix.artists
      .flatMap((artist) =>
        mixes.filter(
          (relatedMix) =>
            relatedMix.slug !== mix.slug && relatedMix.artists.includes(artist)
        )
      )
      .filter(
        (mix1, index, all) =>
          all.findIndex((mix2) => mix1.slug === mix2.slug) === index
      )
      .sort((a, b) => b.date - a.date)
      .slice(0, 6),
  }));
};
