const mixesBase = require("../mixes.json");

const artistsFromTracklist = (tracklist) => {
  const tags = tracklist
    .map((track) => track.split(" - ")[0])
    .map((artist) =>
      artist
        .split(/( feat | and | x | vs |, )/)
        .map((tag) => tag.trim())
        .filter((tag) => !["feat", "and", "x", "vs", ",", ", "].includes(tag))
    )
    .flat();
  return [...new Set(tags)];
};

const monthFromDate = (date) =>
  new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric" }).format(
    new Date(date)
  );

module.exports = async function () {
  const mixes = await Promise.all(
    mixesBase.map(async (mix) => {
      const month = monthFromDate(mix.date);
      const artists = artistsFromTracklist(mix.tracklist);

      return {
        ...mix,
        date: new Date(`${mix.date}T12:00:00.000Z`),
        dateIso: mix.date,
        month,
        artists,
        hearThisSlug: mix.slug,
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
