const pluginPurgeCss = require("eleventy-plugin-purgecss");
const pluginRss = require("@11ty/eleventy-plugin-rss");

module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy({
    "node_modules/bootstrap/dist/css/bootstrap.min.css":
      "css/bootstrap.min.css",
  });
  eleventyConfig.addPlugin(pluginPurgeCss);
  eleventyConfig.addPlugin(pluginRss);
};
