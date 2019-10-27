const express = require('express');
const app = express();
const puppeteer = require('puppeteer');
const fuzzy = require('fuzzyset.js')

const port = process.env.PORT || 8080;

function song_search(artist_name){
    song_list = []
    album_list = []
    let click_page = ''
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
            const info_list = await page.$$('div[class="Z1hOCe"]')
            for (const l of info_list){
                const li = await l.$('span[class="w8qArf"]');
                const name = await li.$eval('a',a=>a.innerText)
                if (name === 'Albums'){
                    const data_span = await l.$('span[class="LrzXr kno-fv"]')
                    const text = await data_span.$$('a')
                    for (t of text){
                        const names = await (await t.getProperty('textContent')).jsonValue()
                        if (names.toLowerCase() !== 'more'){
                            let add = true
                            if (album_list && album_list.length > 0){
                                album_list.forEach(function(element){
                                    a = FuzzySet([element]);
                                    matching = a.get(names)
                                    if (matching !== null && matching[0][0] > .7 ){
                                        add = false
                                    }
                                })
                                if (add){
                                    album_list.push(names)
                                }
                            }else{
                                album_list.push(names)
                            }
                        }
                        else {
                            click_page = t
                        }
                    }
                    
                }
            }
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
                            const pattern = new RegExp(/(.*)\·(\s*)?([\d]*)/)
                            let match = ''
                            if (pattern.test(song_album)){
                                match = pattern.exec(song_album)[1].trim()
                            }
                            else{
                                match = song_album.trim()
                            }
                            if (album_list && album_list.length > 0){
                                let add = true
                                album_list.forEach(function(element){
                                    a = FuzzySet([element]);
                                    matching = a.get(match)
                                    if (matching){
                                        if (matching !== null && matching[0][0] > .7){
                                            add = false
                                        }
                                    }
                                })
                                if (add){
                                    album_list.push(match)
                                }
                            }else{
                                album_list.push(match)
                            }
                        }
                        else{
                            song_album = ''
                        }
                        song['name'] = song_name;
                        song['album'] = song_album;
                        song_list.push(song);
                    }

                }
                if (click_page !== ''){
                    await click_page.click()
                    await page.waitForSelector('h3');
                    if (await page.$('div[class="EDblX DAVP1"]') !== null){
                        const album_container = await page.$('div[class="EDblX DAVP1"]');
                        const album_listing = await album_container.$$('div[class="rlc__slider-page"]');
                        for (const album_l of album_listing){
                            other_listing = await album_l.$$('div[class="h998We mlo-c"]');
                            for(const o of other_listing){
                                album = await o.$eval('div[class="title"]', a => a.innerText);
                                if (album_list && album_list.length > 0){
                                    let add = true
                                    album_list.forEach(function(element){
                                        a = FuzzySet([element]);
                                        matching = a.get(album)
                                        if (matching){
                                            if (matching !== null && matching[0][0] > .7){
                                                add = false
                                            }
                                        }
                                    })
                                    if (add){
                                        album_list.push(album);
                                    }
                                }else{
                                    album_list.push(album)
                                }
                            }
                        }
                    }
                }
            song_list.push({'album':album_list})
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

            var result = {}
            await page.waitForSelector('h3');
            const table = await page.$('table[class="rhsvw RJuLSb"]');
            const profile = await page.$('div[class="OOijTb"]')
            if (table){
                const lists = await table.$$('tr')
                for (const l of lists){
                    title = await l.$eval('span[class="hl"]', span => span.textContent)
                    link = await l.$eval('a', a => a.href);
                    result[title] = link 
                }
            }
            if (profile){
                const lists = await profile.$$('g-link')
                for (const l of lists){
                    title = await l.$eval('div[class="CtCigf"]', div => div.textContent)
                    link = await l.$eval('a', a => a.href);
                    result[title] = link
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
