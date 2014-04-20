var _ = require('underscore');
var assert = require('chai').assert;
var Splinter = require('./index');

describe('splinter', function () {

  it('should default to the _.identity function', function () {
    var splinter = Splinter();
    var a = splinter.match('a');
    splinter.write('a');
    assert.equal(a.read(), 'a');
  });

  it('should filter true/false stream', function () {
    var splinter = Splinter();

    var yes = splinter.match(true);
    var no = splinter.match(false);

    assert.equal(yes.read(), null);
    assert.equal(no.read(), null);

    splinter.write(true);
    assert.equal(yes.read(), true);
    assert.equal(no.read(), null);

    splinter.write(false);
    assert.equal(yes.read(), null);
    assert.equal(no.read(), false);

    splinter.write(false);
    splinter.write(true);
    assert.equal(yes.read(), true);
    assert.equal(no.read(), false);
  });

  it('should filter a stream of strings', function () {
    var splinter = Splinter(function (chunk) {
      return chunk.length;
    });

    var short = splinter.match(3);

    _.each([
      'one', 'two', 'three', 'four', 'five',
      'six', 'seven', 'eight', 'nine', 'ten'
    ], splinter.write, splinter);

    assert.equal(short.read(), 'one');
    assert.equal(short.read(), 'two');
    assert.equal(short.read(), 'six');
    assert.equal(short.read(), 'ten');
    assert.equal(short.read(), null);
  });

  it('should filter object', function () {
    var splinter = Splinter(function (chunk) {
      return chunk.type;
    });

    var ansi = splinter.match('ansi');
    var text = splinter.match('text');

    splinter.write({ type: 'ansi', value: [30] });
    splinter.write({ type: 'text', value: 'hello' });
    splinter.write({ type: 'ansi', value: [0] });
    splinter.write({ type: 'text', value: 'world' });

    assert.deepEqual(ansi.read(), { type: 'ansi', value: [30] });
    assert.deepEqual(ansi.read(), { type: 'ansi', value: [0] });
    assert.equal(ansi.read(), null);

    assert.deepEqual(text.read(), { type: 'text', value: 'hello' });
    assert.deepEqual(text.read(), { type: 'text', value: 'world' });
    assert.equal(text.read(), null);
  });

  it('should match against a function', function () {
    var splinter = new Splinter();

    var bigNumbers = splinter.match(function (value) {
      return value > 100;
    });

    splinter.write(10);
    splinter.write(100);
    splinter.write(1000);

    assert.equal(bigNumbers.read(), 1000);
    assert.equal(bigNumbers.read(), null);
  });

  it('should pipe the same chunk to multiple matching outputs', function () {
    var splinter = new Splinter();

    var strings = splinter.match(function (chunk) {
      return typeof(chunk) === 'string';
    });

    var shortObjects = splinter.match(function (chunk) {
      return chunk.length < 4;
    });

    var startsWithA = splinter.match(function (chunk) {
      return chunk[0] === 'a';
    });

    splinter.write('ant');
    splinter.write('bat');
    splinter.write(['a', 'b', 'c']);
    splinter.write('andy');

    assert.equal(strings.read(), 'ant');
    assert.equal(strings.read(), 'bat');
    assert.equal(strings.read(), 'andy');

    assert.equal(shortObjects.read(), 'ant');
    assert.equal(shortObjects.read(), 'bat');
    assert.deepEqual(shortObjects.read(), ['a','b', 'c']);

    assert.equal(startsWithA.read(), 'ant');
    assert.deepEqual(startsWithA.read(), ['a','b', 'c']);
    assert.equal(startsWithA.read(), 'andy');
  });

  it('should deep equal match values', function () {
    var splinter = new Splinter();

    var match = splinter.match({ foo: [ 'bar' ] });

    splinter.write({ foo: ['bar'] });
    splinter.write({ foo: ['qux'] });

    assert.deepEqual(match.read(), { foo: ['bar'] });
  });

  it('should catch errors', function () {
    var splinter = new Splinter();

    var match = splinter.match(function () {
      throw new Error('hello world');
    });

    splinter.write('boom');
  });

  it('should pass ignored chunks through', function () {
    var splinter = new Splinter();

    splinter.match('match');

    splinter.write('ignore');
    splinter.write('match');

    assert.equal(splinter.read(), 'ignore');
    assert.equal(splinter.read(), null);
  });

});
