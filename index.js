const botkit = require('botkit');
const puppeteer = require('puppeteer');
const cron = require('node-cron');

if (!process.env.SLACK_TOKEN) {
  console.log('Error: Specify token in environment');
  process.exit(1);
}

const controller = botkit.slackbot({
  debug: true,
});

const bot = controller.spawn({
  token: process.env.SLACK_TOKEN,
}).startRTM();

// Bot起動時のSlack疎通確認用
controller.hears(['ping'], 'direct_message,direct_mention,mention,ambient', function (bot, message) {
  bot.reply(message, 'PONG');
});

// --------------------------------------------------
//  いらすとや画像をSlackに投稿する
// --------------------------------------------------

function postIrasutoya(channel){

  (async () => {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto('https://www.irasutoya.com/2016/04/blog-post_890.html');
    await page.click('a[href="#random"]');
    await page.waitForNavigation({ waitUntil: 'domcontentloaded' });

    const image = await page.$('#post .entry img');
    const src = await image.getProperty('src');
    const url = await src.jsonValue();
    const title = await page.$eval('#post h2', item => {
      return item.innerText;
  　});
    
    bot.say({
        channel: channel,
        text: '休憩しようぜ！<' + url + '|' + title + '>',
        as_user: false,
        username : 'いらすとや',
        icon_emoji: ':+1:',
    }, function(err, res) {
        if (err) {
            bot.botkit.log('Failed to postMessage', err);
        }
    });
    await browser.close();
  })();

}

// トリガーワードで実行する
controller.hears(['いらすとや'], 'direct_message,direct_mention,mention,ambient', function(bot, message) {
  postIrasutoya(message.channel);
});

// cronでスケジュール実行する
cron.schedule('0,15,30,45 * * * * *', () => {
  postIrasutoya('#general');  // #generalチャンネルに投稿
});
