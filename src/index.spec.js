import test from 'ava'

import Splinter from './index'

test('should default to the _.identity function', (t) => {
  const splinter = new Splinter()
  const a = splinter.match('a')
  splinter.write('a')
  t.is(a.read(), 'a')
})

test('should filter true/false stream', (t) => {
  const splinter = new Splinter()

  const yes = splinter.match(true)
  const no = splinter.match(false)

  t.is(yes.read(), null)
  t.is(no.read(), null)

  splinter.write(true)
  t.is(yes.read(), true)
  t.is(no.read(), null)

  splinter.write(false)
  t.is(yes.read(), null)
  t.is(no.read(), false)

  splinter.write(false)
  splinter.write(true)
  t.is(yes.read(), true)
  t.is(no.read(), false)
})

test('should filter a stream of strings', (t) => {
  const splinter = new Splinter((chunk) => {
    return chunk.length
  })

  // only matches three letter words
  const short = splinter.match(3)

  const input = [
    'one',
    'two',
    'three',
    'four',
    'five',
    'six',
    'seven',
    'eight',
    'nine',
    'ten'
  ]

  input.forEach((word) => splinter.write(word))

  t.is(short.read(), 'one')
  t.is(short.read(), 'two')
  t.is(short.read(), 'six')
  t.is(short.read(), 'ten')
  t.is(short.read(), null)
})

test('should filter object', (t) => {
  const splinter = new Splinter((chunk) => {
    return chunk.type
  })

  const ansi = splinter.match('ansi')
  const text = splinter.match('text')

  splinter.write({ type: 'ansi', value: [30] })
  splinter.write({ type: 'text', value: 'hello' })
  splinter.write({ type: 'ansi', value: [0] })
  splinter.write({ type: 'text', value: 'world' })

  t.deepEqual(ansi.read(), { type: 'ansi', value: [30] })
  t.deepEqual(ansi.read(), { type: 'ansi', value: [0] })
  t.is(ansi.read(), null)

  t.deepEqual(text.read(), { type: 'text', value: 'hello' })
  t.deepEqual(text.read(), { type: 'text', value: 'world' })
  t.is(text.read(), null)
})

test('should match against a function', (t) => {
  const splinter = new Splinter()

  const bigNumbers = splinter.match((value) => {
    return value > 100
  })

  splinter.write(10)
  splinter.write(100)
  splinter.write(1000)

  t.is(bigNumbers.read(), 1000)
  t.is(bigNumbers.read(), null)
})

test('should pipe the same chunk to multiple matching outputs', (t) => {
  const splinter = new Splinter()

  const strings = splinter.match((chunk) => {
    return typeof (chunk) === 'string'
  })

  const shortObjects = splinter.match((chunk) => {
    return chunk.length < 4
  })

  const startsWithA = splinter.match((chunk) => {
    return chunk[0] === 'a'
  })

  splinter.write('ant')
  splinter.write('bat')
  splinter.write(['a', 'b', 'c'])
  splinter.write('andy')

  t.is(strings.read(), 'ant')
  t.is(strings.read(), 'bat')
  t.is(strings.read(), 'andy')

  t.is(shortObjects.read(), 'ant')
  t.is(shortObjects.read(), 'bat')
  t.deepEqual(shortObjects.read(), ['a', 'b', 'c'])

  t.is(startsWithA.read(), 'ant')
  t.deepEqual(startsWithA.read(), ['a', 'b', 'c'])
  t.is(startsWithA.read(), 'andy')
})

test('should deep equal match values', (t) => {
  const splinter = new Splinter()

  const match = splinter.match({ foo: [ 'bar' ] })

  splinter.write({ foo: ['bar'] })
  splinter.write({ foo: ['qux'] })

  t.deepEqual(match.read(), { foo: ['bar'] })
})

test('should not swallow errors', (t) => {
  const splinter = new Splinter()

  t.throws(() => {
    splinter.match(() => {
      throw new Error('hello world')
    })
    splinter.write('boom')
  }, 'hello world')
})

test('should pass ignored chunks through', (t) => {
  const splinter = new Splinter()

  splinter.match('match')

  splinter.write('ignore')
  splinter.write('match')

  t.is(splinter.read(), 'ignore')
  t.is(splinter.read(), null)
})
