const express = require('express');
const app = express();
const puppeteer = require('puppeteer');
const port = process.env.PORT || 8080;

function song_search(artist_name){
    song_list = []
    return new Promise(async (resolve, reject) => {
        try{
            const browser= await puppeteer.launch({
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            })
            const page = await browser.newPage();
            page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/76.0.3809.100 Safari/537.36')
            await page.goto('https://www.google.com');
            await page.waitForSelector("input")
            const searchBar = await page.$('input');
            searchBar.type(artist_name + ' songs');
            await page.waitFor(1000);
            searchBar.press('Enter');
            await page.waitForSelector('h3');
            if (await page.$('div[class="EDblX DAVP1"]') !== null){
                const container = await page.$('div[class="EDblX DAVP1"]');
                const list = await container.$$('div[class="rlc__slider-page"]');
                for (const l of list){
                    other_listing = await l.$$('div[class="h998We mlo-c"]');
                    for(const o of other_listing){
                        song= {}
                        song_name = await o.$eval('div[class="title"]', a => a.innerText);
                        if (await o.$('div[class="jbzYp"]') !== null){
                            song_album = await o.$eval('div[class="jbzYp"]',a => a.innerText);
                        }
                        else{
                            song_album = ''
                        }
                        // console.log(song_name);
                        // console.log(song_album);
                        song['name'] = song_name;
                        song['album'] = song_album;
                        song_list.push(song);
                    }

                }
            }
            else{
                song_list = [];
            }
            browser.close();
            return resolve(song_list);
        }
        catch(e){
            return reject(e)
        }
    })
}

function search_artist_info(artist){
    result = ''
    return new Promise(async (resolve, reject) => {
        try{
            const browser = await puppeteer.launch({
            args: ['--no-sandbox', '--disable-setuid-sandbox']
            });
            const page = await browser.newPage();
            page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/76.0.3809.100 Safari/537.36')
            await page.goto('https://www.google.com');
            await page.waitForSelector("input")
            const searchBar = await page.$('input');
            searchBar.type(artist);
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
                    result = link + ','+result
                }
            }
            else if (profile){
                const lists = await profile.$$('g-link')
                for (const l of lists){
                    link = await l.$eval('a', a => a.href);
                    result = link + ','+result
                }
            }
        await browser.close();
        return resolve(result);
        }
        catch(e){
           return reject(e);
        } 
    })
}

app.get('/', function(req, res) {
    if (Object.keys(req.query).length === 0){
        res.send('Use artist key')
    }else{
        (async() =>{
            output= {} //will store the output
            Promise.all([song_search(req.query.artist),search_artist_info(req.query.artist)]).then(function(results){
                [output['song'],output['info']] = results;
                res.setHeader('Content-Type', 'text/html');
                res.send(output)
            }).catch(console.error);
        })();
    }
});

app.listen(port, function() {
    console.log('App listening on port ' + port)
})
