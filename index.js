var _ = require('underscore');
var Stream = require('stream');
var util = require('util');

var OPTS = { objectMode: true };
var IGNORE = function () {};

var Splinter = function (toValue) {
  if (! (this instanceof Splinter)) return new Splinter(toValue);
  Splinter.super_.call(this, OPTS);
  this._matches = [];
  this._toValue = _.isFunction(toValue) ? toValue : _.identity;
};

util.inherits(Splinter, Stream.Transform);

_.extend(Splinter.prototype, {

  _transform: function (chunk, encoding, done) {
    var ignored = true;
    var value = this._toValue(chunk);
    _.each(this._matches, function (match) {
      var pass;
      try {
        pass = match[0](value);
      } catch (e) {
        return;
      }
      if (pass) {
        ignored = false;
        match[1].push(chunk);
      }
    });
    if (ignored) this.push(chunk);
    done();
  },

  match: function (predicate) {
    var output = new Stream.Readable(OPTS);
    output._read = IGNORE;

    var fn = _.isFunction(predicate) ?
      predicate : _.partial(_.isEqual, predicate);

    this._matches.push([fn, output]);
    return output;
  }

});

module.exports = Splinter;
