const cheerio = require('cheerio')
const axios = require('axios')
const axiosRetry = require('axios-retry')
const fs = require('fs')

axiosRetry(axios, { retries: 10, retryDelay: () => { return 2000 } });

(async () => {
    let allPackages = {}
    try {
        const rawdata = await fs.promises.readFile(process.env.RANK_FILE)
        allPackages = JSON.parse(rawdata)

        let offset = 0

        while (offset < 360) {
            if (!allPackages[offset] || allPackages[offset].length === 0) {
                console.log(`https://www.npmjs.com/browse/depended?offset=${offset}`)
                allPackages[offset] = []
                try {
                    const res = await axios({
                        method: 'GET',
                        url: `browse/depended?offset=${offset}`,
                        baseURL: 'https://www.npmjs.com',
                        timeout: 30000,
                        headers: {
                            Accept: 'text/html',
                            'Cache-Control': 'no-cache',
                            Pragma: 'no-cache',
                            Expires: '0',
                            'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.90 Safari/537.36'
                        }
                    })

                    const $ = cheerio.load(res.data)
                    $('a h3').each(function () {
                        allPackages[offset].push($(this).html())
                    })
                } catch (err) {
                    console.log(err)
                }
            }
            offset += 36
        }

        console.log('Done')
    } catch (err) {
        console.log(err)
    }

    await fs.promises.writeFile(process.env.RANK_FILE, JSON.stringify(allPackages), 'utf8')
})()
