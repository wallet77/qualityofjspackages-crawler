const axios = require('axios')
const child_process = require('child_process')
const path = require('path')

const cloneRepo = (repository) => {
    return new Promise((resolve, reject) => {
        child_process.exec(`git clone ${repository}`, {
            cwd: path.join(process.cwd(), 'repos')
        }, (err, stdout) => {
            const msg = `Clone ${repository}`
            if (err) {
                console.log(`${msg} => error`)
                return reject(err)
            }
            console.log(`${msg} => done`)
            return resolve(stdout)
        })
    })
}

const runQualscan = (repository) => {
    return new Promise((resolve, reject) => {
        child_process.exec(`git clone ${repository}`, (err, stdout) => {
            const msg = `Clone ${repository}`
            if (err) {
                console.log(`${msg} => error`)
                return reject(err)
            }
            console.log(`${msg} => done`)
            return resolve(stdout)
        })
    })
}

const run = async () => {
    const res = await axios.get('https://gist.githubusercontent.com/anvaka/8e8fa57c7ee1350e3491/raw/b6f3ebeb34c53775eea00b489a0cea2edd9ee49c/01.most-dependent-upon.md')
    const packages = res.data.split('\n')
    const allPackages = {}

    for (let i = 0; i < 10; i++) {
        const npmPackage = packages[i]

        const name = npmPackage.substring(
            npmPackage.lastIndexOf('[') + 1,
            npmPackage.lastIndexOf(']')
        )

        if (name !== '') {
            const url = npmPackage.substring(
                npmPackage.lastIndexOf('(') + 1,
                npmPackage.lastIndexOf(')')
            )

            const rank = npmPackage.substring(
                0,
                npmPackage.indexOf('.')
            )

            const currentPackage = {
                name,
                url,
                rank
            }

            try {
                const res = await axios.get(`https://registry.npmjs.org/${name}`)
                let repository = res.data.repository
                if (typeof res.data.repository === 'object') {
                    repository = res.data.repository.url
                }

                repository = repository.replace(/git\+/i, '')
                repository = repository.replace(/\.git/i, '')

                const npmsRes = await axios.get(`https://api.npms.io/v2/package/${name}`)

                currentPackage.npms = {
                    final: npmsRes.data.score.final,
                    quality: npmsRes.data.score.detail.quality
                }

                await cloneRepo(repository)
                // await runQualscan(repository)
            } catch (err) {
                console.log(err)
            }

            allPackages[name] = currentPackage
        }
    }

    console.log(allPackages)
}

run()
