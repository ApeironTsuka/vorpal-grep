'use strict';

import assert from 'assert';
import should from 'should';
import grep from '../src/grep.js';
import Vorpal from '@ApeironTsuka/vorpal';
import strip from 'strip-ansi';

const vorpal = new Vorpal();

let _stdout = '';

function stdout() {
  const out = _stdout;
  _stdout = '';
  return out;
};

vorpal.pipe((str) => {
  _stdout += str;
  return '';
});

describe('vorpal-grep', () => {

  before(() => {
    vorpal.command('foo').action(function (args, cb) {
      this.log('bar1!\nbar2!\nbar3!');
      cb();
    });

    vorpal.command('reverse').action(function (args, cb) {
      this.log(String(args.stdin[0]).split('').reverse().join(''));
      cb();
    });
  });

  it('should exist and be a function', () => {
    should.exist(grep);
    grep.should.be.type('function');
  });

  it('should return the raw command when Vorpal is not passed in.', () => {
    const fn = grep();
    fn.should.be.type('object');
    fn.exec.should.be.type('function');
  });

  it('should import into Vorpal', () => {
    (() => {
      vorpal.use(grep);
    }).should.not.throw();
  });

  it('should exist as a command in Vorpal', () => {
    let exists = false;
    for (let i = 0, l = vorpal.commands.length; i < l; i++) {
      if (vorpal.commands[i]._name === 'grep') {
        exists = true;
      }
    }
    exists.should.be.true;
  });

  it('should find matches in a single file', (done) => {
    vorpal.exec('grep cats ./test/fixtures/a.txt', (err, data) => {
      let out = (
        'a:6| and then the farmer said he liked cats and things are rather repetitive today and such and the like like other things like that okay and yes i get it.' + 
        'a:7| cats' + 
        'a:10| cats and socats and more cats'
      );
      strip(stdout()).should.equal(out);
      done();
    });
  });

  it('should color matches with red', (done) => {
    vorpal.exec('grep cats ./test/fixtures/a.txt', (err, data) => {
      stdout().should.containEql('\u001b[31mcats\u001b[39m');
      done();
    });
  });

  it('should just return when there\'s no input', (done) => {
    vorpal.exec('grep foo', (err, data) => {
      stdout().should.equal('');
      done();
    });
  });

  it('should shit on directories', (done) => {
    vorpal.exec('grep cats ./test/fixtures', (err, data) => {
      stdout().should.containEql('Is a directory');
      done();
    });
  });

  it('should shit on invalid files', (done) => {
    vorpal.exec('grep cats ./fixturesandsoon**', (err, data) => {
      strip(stdout()).should.containEql('grep ./fixturesandsoon**: No such file or directory');
      done();
    });
  });

  it('should handle wildcards', (done) => {
    vorpal.exec('grep cats ./test/fixtures/*.*', (err, data) => {
      const fix1 = './test/fixtures/a.txt:a:10| cats and socats and more cats',
            fix2 = './test/fixtures/b.txt:b:5| can you cats please',
            fix3 = './test/fixtures/b.txt:b:13| yeah i said cats',
            fix4 = './test/fixtures/c.txt:c:17| what did you cat cat cat and cats';
      let out = strip(stdout());
      out.should.containEql(fix1);
      out.should.containEql(fix2);
      out.should.containEql(fix3);
      out.should.containEql(fix4);
      done();
    });
  });

  it('should color multiple files magenta and cyan', (done) => {
    vorpal.exec('grep cats ./test/fixtures/*.*', (err, data) => {
      const fix = '\u001b[35m./test/fixtures/a.txt\u001b[39m\u001b[36m:\u001b[39m';
      stdout().should.containEql(fix);
      done();
    });
  });

  it('should be case-insensitive by default', (done) => {
    vorpal.exec('grep cats ./test/fixtures/*.*', (err, data) => {
      stdout().should.not.containEql('CATS');
      done();
    });
  });
  
  it('should be case-sensitive with the -i flag.', (done) => {
    vorpal.exec('grep cats ./test/fixtures/*.* -i', (err, data) => {
      stdout().should.containEql('CATS');
      done();
    });
  });

  it('should match partial words by default', (done) => {
    vorpal.exec('grep words ./test/fixtures/a.txt', (err, data) => {
      const fix1 = 'a:13| words and wholewords',
            fix2 = 'a:14| and wholewords plus',
            fix3 = 'a:15| and notwholewords and soon';
      let out = strip(stdout());
      out.should.containEql(fix1);
      out.should.containEql(fix2);
      out.should.containEql(fix3);
      done();
    });
  });

  it('should recurse with the -r flag', (done) => {
    vorpal.exec('grep cats ./test -r', (err, data) => {
      const fix1 = './test/fixtures/a.txt:a:10| cats and socats and more cats',
            fix2 = './test/fixtures/b.txt:b:5| can you cats please',
            fix3 = './test/fixtures/b.txt:b:13| yeah i said cats',
            fix4 = './test/fixtures/c.txt:c:17| what did you cat cat cat and cats';
      let out = strip(stdout());
      out.should.containEql(fix1);
      out.should.containEql(fix2);
      out.should.containEql(fix3);
      out.should.containEql(fix4);
      done();
    });
  });

  it('should match only whole words with the -w flag', (done) => {
    vorpal.exec('grep words ./test/fixtures/a.txt -w', (err, data) => {
      const fix1 = 'a:13| words and wholewords',
            fix2 = 'a:14| and wholewords plus',
            fix3 = 'a:15| and notwholewords and soon';
      let out = strip(stdout());
      out.should.containEql(fix1);
      out.should.not.containEql(fix2);
      out.should.not.containEql(fix3);
      done();
    });
  });

  it('should suppress messages with the -s flag', (done) => {
    vorpal.exec('grep cats ./fixturesandsoon** -s', (err, data) => {
      strip(stdout()).should.not.containEql('grep ./fixturesandsoon**: No such file or directory');
      done();
    });
  });

  it('should match inverted lines with the -v flag', (done) => {
    vorpal.exec('grep words ./test/fixtures/a.txt -v', (err, data) => {
      const fix1 = 'a:13| words and wholewords',
            fix2 = 'a:14| and wholewords plus',
            fix3 = 'a:15| and notwholewords and soon',
            fix4 = 'a:1|',
            fix5 = 'a:3|',
            fix6 = 'a:4|',
            fix7 = 'a:5|';
      let out = strip(stdout());
      out.should.not.containEql(fix1);
      out.should.not.containEql(fix2);
      out.should.not.containEql(fix3);
      out.should.containEql(fix4);
      out.should.containEql(fix5);
      out.should.containEql(fix6);
      out.should.containEql(fix7);
      done();
    });
  });

  it('should shit on an invalid max count', (done) => {
    vorpal.exec('grep cats ./test/fixtures/*.txt -m andso', (err, data) => {
      stdout().should.equal('grep: invalid max count');
      done();
    });
  });

  it('should output a max results per file with the -m flag', (done) => {
    vorpal.exec('grep carrot ./test/fixtures/*.txt -m 1', (err, data) => {
      let out = strip(stdout());
      out.should.containEql('a:2| carrot');
      out.should.containEql('b:21| carrot');
      out.should.containEql('c:18| carrot');
      out.should.not.containEql('a:3| carrot');
      out.should.not.containEql('a:5| carrot');
      out.should.not.containEql('a:8| carrot');
      out.should.not.containEql('b:22| carrot and some');
      out.should.not.containEql('b:23| carrot');
      out.should.not.containEql('c:29| carrot');
      done();
    });
  });

  it('should show the byte offset with the -b flag', (done) => {
    vorpal.exec('grep cats ./test/fixtures/*.* -bi', (err, data) => {
      const fix = './test/fixtures/c.txt:91:c:17| what did you cat cat cat and cats';
      let out = strip(stdout());
      out.should.containEql(fix);
      done();
    });
  });

  it('should color the byte offset green', (done) => {
    vorpal.exec('grep cats ./test/fixtures/*.* -bi', (err, data) => {
      const fix = '\u001b[32m91\u001b[39m\u001b[36m:\u001b[39m';
      let out = stdout();
      out.should.containEql(fix);
      done();
    });
  });

  it('should show the line number with the -n flag', (done) => {
    vorpal.exec('grep cats ./test/fixtures/*.* -nb', (err, data) => {
      const fix = './test/fixtures/c.txt:17:91:c:17| what did you cat cat cat and cats';
      let out = strip(stdout());
      out.should.containEql(fix);
      done();
    });
  });

  it('should color the line number green', (done) => {
    vorpal.exec('grep cats ./test/fixtures/*.* -nb', (err, data) => {
      const fix = '\u001b[32m17\u001b[39m\u001b[36m:\u001b[39m';
      let out = stdout();
      out.should.containEql(fix);
      done();
    });
  });

  it('should not show the filename for single file matches', (done) => {
    vorpal.exec('grep asinglematchbecause ./test/fixtures/a.txt', (err, data) => {
      let out = strip(stdout());
      out.should.not.containEql('./test/fixtures/a.txt');
      out.should.containEql('a:22| asinglematchbecause');
      done();
    });
  });

  it('should show the filename for single file matches with the -H flag', (done) => {
    vorpal.exec('grep asinglematchbecause ./test/fixtures/a.txt -H', (err, data) => {
      let out = strip(stdout());
      out.should.containEql('./test/fixtures/a.txt:');
      out.should.containEql('a:22| asinglematchbecause');
      done();
    });
  });

  it('should suppress the file name with the -h flag', (done) => {
    vorpal.exec('grep cats ./test/fixtures/*.* -h', (err, data) => {
      let out = strip(stdout());
      out.should.not.containEql('./test/fixtures/a.txt');
      out.should.not.containEql('./test/fixtures/b.txt');
      out.should.not.containEql('./test/fixtures/c.txt');
      done();
    });
  });

  it('should suppress stdout with -q', (done) => {
    vorpal.exec('grep cats ./test/fixtures/a.txt -q', (err, data) => {
      stdout().should.not.containEql('cats');
      done();
    });
  });

  it('should not suppress errors with -q', (done) => {
    vorpal.exec('grep cats ./test/fixtures/a.txt --silent -m andso', (err, data) => {
      stdout().should.equal('grep: invalid max count');
      done();
    });
  });

  it('should only match patterns with the --include flag', (done) => {
    vorpal.exec('grep 14 ./test/fixtures/*.* --include \'*.md\' ', (err, data) => {
      let out = strip(stdout());
      out.should.containEql('d:14');
      out.should.not.containEql('a:14');
      out.should.not.containEql('b:14');
      out.should.not.containEql('c:14');
      done();
    });
  });

  describe('piping', () => {
    it('should work with piped output.', (done) => {
      vorpal.exec('foo | grep bar2!', (err, data) => {
        let out = strip(stdout());
        out.should.equal('bar2!');
        done();
      });
    });
  });
});
