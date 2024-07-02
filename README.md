# Vorpal - Grep

[![XO code style](https://img.shields.io/badge/code_style-XO-5ed9c7.svg)](https://github.com/sindresorhus/xo)

A 100% Javascript (ES2017) implementation of the [grep](https://en.wikipedia.org/wiki/Grep) command.

A [Vorpal.js](https://github.com/ApeironTsuka/vorpal) extension, `vorpal-grep` lets you grep content in a Vorpal environment!

Letter-perfect POSIX implementation, 31 tests, 100% coverage.

### Installation

```bash
npm install @ApeironTsuka/vorpal-grep
npm install @ApeironTsuka/vorpal
```

### Getting Started

```js
import Vorpal from '@ApeironTsuka/vorpal';
import hn from '@ApeironTsuka/vorpal-hacker-news';
import grep from '@ApeironTsuka/vorpal-grep';

const vorpal = new Vorpal();

vorpal
  .delimiter('node~$')
  .use(hn)
  .use(grep)
  .show();
```

```bash
$ node hacker-news.js
node~$ hacker-news | grep "Vorpal"
4. Vorpal: a framework for interactive CLIs in Node.js (github.com)
node~$
```

### Contributing

Feel free to contribute! So far 13 options are supported, help get them all supported!

### License

MIT © [David Caccavella](https://github.com/dthree)

