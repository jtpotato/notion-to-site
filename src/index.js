const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const cheerio = require('cheerio');

// Define the URL of the webpage to download
const url =
  "https://jtpotato.notion.site/Imaginaition-ecf13a26025e4b0788dbfba1003c36b8";

// Define the base directory where the downloaded files will be saved
const baseDir = "./site";

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  // Navigate to the URL and wait for the page to load
  await page.goto(url, { waitUntil: "networkidle0" });

  // Get the HTML content of the page
  const htmlContent = await page.content();

  // Clean the image and stylesheet URLs
  const cleanImageUrl = (urlString) => {
    let pathname;
    try {
      pathname = new URL(urlString).pathname;
    }
    catch {
      pathname = urlString
    }
    pathname = pathname.split("?")[0].replace(/[^a-zA-Z0-9\/\.]/g, "");
    return pathname;
  };

  const cleanStylesheetUrl = (urlString) => {
    let pathname;
    try {
      pathname = new URL(urlString).pathname;
    }
    catch {
      pathname = urlString
    }
    pathname = pathname.split("?")[0].replace(/[^a-zA-Z0-9\/\.]/g, "");
    return pathname;
  };

  // Get all the image URLs in the page
  const imageUrls = (
    await page.$$eval("img", (imgs) => imgs.map((img) => img.src))
  ).filter((url) => url.length > 0);

  // Download each image and save it to the local directory
  imageUrls.forEach(async (imageUrl) => {
    const imageData = await axios.get(imageUrl, {
      responseType: "arraybuffer",
    });
    const imagePath = cleanImageUrl(imageUrl);
    const imageFilePath = path.join(baseDir, imagePath);
    try {
      fs.mkdirSync(path.dirname(imageFilePath), { recursive: true });
      fs.writeFileSync(imageFilePath, imageData.data, {
        recursive: true,
      });
    } catch (error) {
      console.log(error);
    }
  });

  // Get all the stylesheet URLs in the page
  const stylesheetUrls = (
    await page.$$eval('link[rel="stylesheet"]', (links) =>
      links.map((link) => link.href)
    )
  ).filter((url) => url.length > 0);

  // Download each stylesheet and save it to the local directory
  stylesheetUrls.forEach(async (stylesheetUrl) => {
    const stylesheetData = await axios.get(stylesheetUrl);
    const stylesheetPath = cleanStylesheetUrl(stylesheetUrl);
    const stylesheetFilePath = path.join(baseDir, stylesheetPath);
    try {
      fs.mkdirSync(path.dirname(stylesheetFilePath), { recursive: true });
      fs.writeFileSync(stylesheetFilePath, stylesheetData.data, {
        recursive: true,
      });
    } catch (error) {
      console.log(error);
    }
  });

  // Replace the image and stylesheet URLs in the HTML content
  const updatedHtmlContent = htmlContent
    .replace(/src="(.*?)"/g, (match, p1) => `src="${cleanImageUrl(p1)}"`)
    .replace(
      /href="(.*?)"/g,
      (match, p1) => `href="${cleanStylesheetUrl(p1)}"`
    );

   const $ = cheerio.load(updatedHtmlContent)
      

  // Save the updated HTML content to a file
  const htmlFilePath = path.join(baseDir, "index.html");
  fs.mkdirSync(path.dirname(htmlFilePath), { recursive: true });
  fs.writeFileSync(htmlFilePath, updatedHtmlContent);

  // Close the browser
  await browser.close();
})();
