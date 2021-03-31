# Quality of JS packages - crawler

## Prerequesites

- Node.js >= 14.x
- npm >= 6
- git

If you want to use scaphandre it should be install following the [official documentation](https://github.com/hubblo-org/scaphandre).

## Purpose

This project aims to crawl the top most famous Javascript packages and run some analysis on them.  
Here is the current workflow:
- download the list of the most dependend packages (multiple options, see section crawler input)
- for each of them
    * request npm registry to retrieve global information
    * git clone the project from github
    * run [scaphandre](https://github.com/hubblo-org/scaphandre)
    * install dependencies
    * stop scaphandre
    * run [Qualscan](https://github.com/wallet77/qualscan)
    * request [npms.io](https://www.npms.io) to get more data

This crawler need an input file which contains the list of packages to crawl.  
See section `Crawler input`.

## Overview

![Overview diagram](https://github.com/wallet77/qualityofjspackages-crawler/blob/main/doc/crawler_overview.png)


## Details

Qualscan run with [the default configuration](https://github.com/wallet77/qualscan#budget).

## Crawler input

Three possibilities:
- use exporter for [anvaka rank list](https://gist.githubusercontent.com/anvaka/8e8fa57c7ee1350e3491/raw/b6f3ebeb34c53775eea00b489a0cea2edd9ee49c/01.most-dependent-upon.md)
- use exporter for [npm most depended list](https://www.npmjs.com/browse/depended)
- use your custom exporter (see examples in exporters directory)

In any case all exporters should write in a JSON file with the following convention:
```json
{
    "myModule": {
        "name": "myModule"
    },
    "myModule2": {
        "name": "myModule2"
    }
}
```

Run crawler like this (by default it uses npm):
```bash
node ./exporters/runExporter.js
```

To customize exporter:
```bash
EXPORTER=anvaka OUTPUT_FILE=/path/to/report/report.json node ./exporters/runExporter.js
```

The only required field is the property `name` and it must be the name of the package in the npm registry.

## Project setup
```
npm install
```

## run
```
SCAPHANDRE_BIN=/pathTo/scaphandre node index.js
```

### Permissions

If the program stop at the step `Installing dependencies ...` without error message.
Or if you get some error message related to scaphandre, then you should run this 2 commands:

```bash
chmod 775 /usr/local/bin/scaphandre
chmod a+s /usr/local/bin/scaphandre
```

## run with docker

```bash
docker build -t packages-quality-report .
```

```bash
docker run -v /sys/class/powercap:/sys/class/powercap -v /proc:/proc -ti packages-quality-report
```

## Lints and fixes files
```
npm run linter
```
