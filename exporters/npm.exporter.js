const cheerio = require('cheerio')
const axios = require('axios')
const fs = require('fs')
const path = require('path')

const rankPath = process.env.RANK_FILE || path.join(__dirname, '../report/rank_tmp.json');

(async () => {
    const allPackages = {}
    let savedPackages = {}
    try {
        const rawdata = await fs.promises.readFile(rankPath)
        savedPackages = JSON.parse(rawdata)

        let offset = 0

        while (offset < 360) {
            if (!savedPackages[offset] || savedPackages[offset].length === 0) {
                console.log(`https://www.npmjs.com/browse/depended?offset=${offset}`)
                savedPackages[offset] = []
                try {
                    const res = await axios({
                        method: 'GET',
                        url: `browse/depended?offset=${offset}`,
                        baseURL: 'https://www.npmjs.com',
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
                        savedPackages[offset].push($(this).html())
                    })
                } catch (err) {
                    console.log(err.message)
                }
            }
            savedPackages[offset].forEach(value => {
                allPackages[value] = {
                    name: value
                }
            })
            offset += 36
        }

        console.log('Done')
    } catch (err) {
        console.log(err)
    }

    await fs.promises.writeFile(process.env.OUTPUT_FILE || path.join(__dirname, '../report/input.json'), JSON.stringify(allPackages), 'utf8')
    await fs.promises.writeFile(rankPath, JSON.stringify(savedPackages), 'utf8')
})()
