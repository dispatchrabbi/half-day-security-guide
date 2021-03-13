# The Half-Day Security Guide

Got half a day and nothing to do? Level up your electronic privacy!

This is the code that powers the guide. Looking for the actual guide? Go to https://halfdaysecurity.guide!

## Structure

There are several directories in this project, each for a different aspect of it:
- _lib/_ contains the code that does the site generation
- _layout/_ contains the template for the text to fit into
- _src/_ contains the actual text for the guide
- _static/_ contains any static assets to be copied as-is into _dist/_ (Not yet implemented)
- _dist/_ is where the output goes, so that's the directory that should get served

## Setup

Clone the repo:
```bash
$ git clone https://github.com/dispatchrabbi/half-day-security-guide.git
$ cd half-day-security-guide
```

Install dependencies:
```bash
$ npm install
```

Build:
```bash
$ npm run build
```

See the site:
```bash
$ npx http-server -p 8888 ./dist
# or whatever little http server you want!
```

## Contributing

- Pick an issue
- Assign yourself
- Make a branch with the issue number in it (`emh/8/making-it-pretty` or whatever)
- Submit a PR and get the nod
- Merge to main

## Deploying

The site deploys automatically on any push to main (including a merge to main via PR).
