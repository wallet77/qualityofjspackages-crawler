const axios = require('axios')
const axiosRetry = require('axios-retry')

axiosRetry(axios, { retries: 10, retryDelay: () => { return 2000 } })

module.exports = async () => {
    const allPackages = {}
    const res = await axios.get('https://gist.githubusercontent.com/anvaka/8e8fa57c7ee1350e3491/raw/b6f3ebeb34c53775eea00b489a0cea2edd9ee49c/01.most-dependent-upon.md')
    const packages = res.data.split('\n')

    const max = process.env.MAX_PACKAGES || packages.length
    // extract packages list
    for (let i = 0; i < max; i++) {
        const npmPackage = packages[i]

        const name = npmPackage.substring(
            npmPackage.lastIndexOf('[') + 1,
            npmPackage.lastIndexOf(']')
        )

        if (name !== '') {
            const rank = npmPackage.substring(
                0,
                npmPackage.indexOf('.')
            )

            allPackages[name] = {
                name,
                rank
            }
        }
    }
    return allPackages
}
