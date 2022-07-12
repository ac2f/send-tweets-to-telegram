require("dotenv").config();
const TelegramBot = require('node-telegram-bot-api');
const fs = require("fs");
const puppeteer = require('puppeteer');

var env = process.env;
const bot = new TelegramBot(env.TELEGRAM_TOKEN, { polling: true, verbose: true });
bot.on("error", (err) => fs.writeFileSync("tlerr.txt", error.toString()));
const sendMessageToChannel = (messageToSend, channeld = env.TELEGRAM_ID) => {
    bot.sendMessage(channeld, messageToSend);
};
var reload = async (currentPage = null) => {
    var page = currentPage;
    if (!currentPage) {
        var browser = await puppeteer.launch({ headless: true });
        var page = await browser.newPage();
    } else {
        await page.reload();
    }

    await page.goto(`https://twitter.com/${env.TWITTER_TARGET_ACCOUNT}`);
    await page.waitForXPath("//article");
    var jsonData = fs.existsSync("data.json") ? JSON.parse(fs.readFileSync("data.json", { "encoding": "utf8" })) : { data: [] };
    for (let index = 1; index <= 5; index++) {
        var title = await page.$x(`//*[@aria-labelledby="accessible-list-0"]/div/div/div[${index}]/div/div/div/article//div[@data-testid="tweetText"]`).then(e => e[0].getProperty("textContent").then(res => res.jsonValue())).catch(e => "");

		if (jsonData.data.includes(title) || !title.toLowerCase().includes(env.TWEETS_MUST_CONTAIN)) continue;
        jsonData.data.push(title);
        var url = null;
        try {
            url = (await ((await page.$x(`//*[@aria-labelledby="accessible-list-0"]/div/div/div[${index}]/div/div/div/article//div[@data-testid="card.wrapper"]/div[2]/a`)).map(async item => {

                try {
                    return await (await item.getProperty('href')).jsonValue();
                } catch (error) {

                }
            })[0]));
        } catch (error) { }
        var messageToSend = `${title ? title : ""} ${url ? "\n\n" + url : ""}`;
        messageToSend.length > 3 && [console.log(`Message sent! Title: ${title}`), sendMessageToChannel(`${title ? title : ""} ${url ? "\n\n" + url : ""}`)];
    };
    fs.writeFileSync("data.json", JSON.stringify(jsonData, null, 4));
    if (jsonData.data.length > 20) fs.writeFileSync("data.json", JSON.stringify({ data: jsonData.data.slice(15, 20) }, null, 4));
    // console.log(out);
    return page;
};

(async () => {
    var lastPage = null
    while (true) {
        lastPage = await reload(lastPage);
        await new Promise(t => setTimeout(t, (15 * 1000)));
        console.log("Retrying..");
    };
})();


(async () => {
    while (true) {
        await new Promise(t => setTimeout(t, (60 * 60 * 1000)));
        process.exit();
    };
})();