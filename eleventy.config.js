import pluginRss from "@11ty/eleventy-plugin-rss";
import pluginPurgeCss from "eleventy-plugin-purgecss";

function sumDurationAsHours(mixes) {
  const totalDurationSeconds = mixes.reduce(
    (total, { durationSeconds }) => total + durationSeconds,
    0
  );
  return Math.floor(totalDurationSeconds / 3600);
};

export default function (eleventyConfig) {
  eleventyConfig.addFilter("sumDurationAsHours", sumDurationAsHours);
  eleventyConfig.addPassthroughCopy({
    "node_modules/bootstrap/dist/css/bootstrap.min.css":
      "css/bootstrap.min.css",
  });
  eleventyConfig.addPlugin(pluginPurgeCss);
  eleventyConfig.addPlugin(pluginRss);
  return {
    dir: {
      input: ".",
      output: "docs",
    },
  };
};
