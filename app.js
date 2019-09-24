const express = require('express');
const app = express();
const puppeteer = require('puppeteer');
const port = process.env.PORT || 8080;
const URL = 'https://www.google.com'


app.get('/', function(req, res) {
    (async() =>{
        try{
        const browser = await puppeteer.launch({
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();
        page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/76.0.3809.100 Safari/537.36')
        await page.goto(URL);
        await page.waitForSelector("input")
        const searchBar = await page.$('input');
        searchBar.type(req.query.artist);
        await page.waitFor(1000);
        searchBar.press('Enter');

        var result = ''
        await page.waitForSelector('h3');
        const table = await page.$('table[class="rhsvw RJuLSb"]');
        const profile = await page.$('div[class="OOijTb"]')
        if (table){
            const lists = await table.$$('tr')
            for (const l of lists){
                link = await l.$eval('a', a => a.href);
                result = result + ','+link
            }
        }
        else if (profile){
            const lists = await profile.$$('g-link')
            for (const l of lists){
                link = await l.$eval('a', a => a.href);
                result = result + ','+link
            }
        }
        await page.screenshot().then(function(buffer) {
            res.setHeader('Content-Type', 'text/html');
            res.send(result)
        });
        
        await browser.close();
        }
        catch(e){

        } 
    })();
});

app.listen(port, function() {
    console.log('App listening on port ' + port)
})
