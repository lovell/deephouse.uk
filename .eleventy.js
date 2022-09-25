const pluginPurgeCss = require("eleventy-plugin-purgecss");
const pluginRss = require("@11ty/eleventy-plugin-rss");

module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy("css");
  eleventyConfig.addPlugin(pluginPurgeCss);
  eleventyConfig.addPlugin(pluginRss);
};
