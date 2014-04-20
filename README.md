splinter
========

> Split an object-mode stream into multiple streams by filtering the chunks

## Install

```
npm install --save splinter
```

## Example Usage

```javascript
var Splinter = require('splinter');

// create a new instance
var splinter = new Splinter(function (chunk) {
    // this converts the chunk into a value that can be matched against
    return typeof(chunk);
});

// create some new output streams
var booleans = splinter.match('boolean')
var numbers  = splinter.match('number');
var objects  = splinter.match('object');

// send some data into the splinter
splinter.write(true);
splinter.write(10);
splinter.write({ foo: 'bar' });

// ... and it is automatically sent to the right output
booleans.read(); // true
numbers.read();  // 10
objects.read();  // { foo: 'bar' }

// ... anything that doesn't match will be passed through the splinter
splinter.write('no matches');
splinter.read(); // 'no matches'
```

## API

### Splinter([toValue])

Create a new instance. Can be called with or without `new`.

Inherits from `Stream.Transform`.

**Parameters:**

- `toValue`: *optional*. Converts the chunk into a value. By default it just
  uses the chunk as the value.

**Example:**

```javascript
var splinter = new Splinter(function (chunk) {
    return chunk.length;
});

splinter.match(3); // match chunks with a length of 3
```

### Splinter.prototype.match(value)

**Parameters:**

- `value`: What to check the chunk against. Can be a value or a function.

**Returns:**

A Readable stream that will output any chunks that match the `value`.

**Example:**

```javascript
var splinter = new Splinter();

// match against a value
var streamA = splinter.match('a value');

// match against an object with deep equality
var streamB = splinter.match({ foo: [ 'bar' ] });

// functions are passed the output of `toValue`.
var streamC = splinter.match(function (value) {
    // should return true/false
    return value > 20;
});
```

## License

MIT

