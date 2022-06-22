const pluginRss = require("@11ty/eleventy-plugin-rss");

const toISOString = (d) => new Date(d).toISOString();

module.exports = function (eleventyConfig) {
  eleventyConfig.addPlugin(pluginRss);
  eleventyConfig.addFilter("toISOString", toISOString);
};
