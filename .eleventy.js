const pluginPurgeCss = require("eleventy-plugin-purgecss");
const pluginRss = require("@11ty/eleventy-plugin-rss");

const sumDurationAsHours = (mixes) => {
  const totalDurationSeconds = mixes.reduce(
    (total, { durationSeconds }) => total + durationSeconds,
    0
  );
  return Math.floor(totalDurationSeconds / 3600);
};

module.exports = function (eleventyConfig) {
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
