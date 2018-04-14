import {
  Transform as TransformStream,
  Readable as ReadableStream
} from 'stream'
import { deepEqual } from 'fast-equals'

const IGNORE = () => {}
const I = (x) => x

class Splinter extends TransformStream {
  constructor (toValue = I) {
    super({ objectMode: true })
    this._matches = []
    this._toValue = toValue
  }

  _transform (chunk, encoding, done) {
    const value = this._toValue(chunk)
    let foundMatch = false
    for (let i = 0, len = this._matches.length; i < len; i++) {
      const [predicate, outStream] = this._matches[i]
      if (predicate(value)) {
        foundMatch = true
        outStream.push(chunk)
      }
    }
    if (foundMatch === false) {
      this.push(chunk)
    }
    done()
  }

  // predicate can either be a function or a value to compare against
  match (predicate) {
    const outStream = new ReadableStream({ objectMode: true })
    outStream._read = IGNORE
    const fn = (typeof predicate === 'function')
      ? predicate
      : deepEqual.bind(null, predicate)
    this._matches.push([fn, outStream])
    return outStream
  }
}

export default Splinter
