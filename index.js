const axios = require('axios')
const child_process = require('child_process')

const run = async () => {
    const res = await axios.get('https://gist.githubusercontent.com/anvaka/8e8fa57c7ee1350e3491/raw/b6f3ebeb34c53775eea00b489a0cea2edd9ee49c/01.most-dependent-upon.md')
    const packages = res.data.split('\n')
    const allPackages = {}

    for (let i = 0; i < 10; i++) {
        const package = packages[i]

        const name = package.substring(
            package.lastIndexOf("[") + 1, 
            package.lastIndexOf("]")
        )

        if (name !== '') {
            const url = package.substring(
                package.lastIndexOf("(") + 1, 
                package.lastIndexOf(")")
            )

            const rank = package.substring(
                0, 
                package.indexOf(".")
            )

            allPackages[name] = {
                name,
                url,
                rank
            }

            try {
                // https://registry.npmjs.org/
                // https://api.npms.io/v2/package/
                const res = await axios.get(`https://registry.npmjs.org/${name}`)
                let repository = res.data.repository
                if (typeof res.data.repository === 'object') {
                    repository = res.data.repository.url
                }

                repository = repository.replace(/git\+/i, '')
                repository = repository.replace(/\.git/i, '')

                child_process.exec(`git clone ${repository}`, (err) => {
                    console.log(`Cloning ${repository}`)
                    if (err) {
                        console.log(err)
                        return console.log(' => error')
                    }
                    return console.log(' => success')
                })
                
            } catch (err) {
                console.log(err)
            }
        }
    }

    // console.log(allPackages)
}


run()