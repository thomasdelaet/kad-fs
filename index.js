/**
 * @module kad-fs
 */

'use strict'

var fs = require('fs')
var assert = require('assert')
var stream = require('readable-stream')
var _ = require('lodash')

/**
 * Constructs a Kad FS storage adapter
 * @constructor
 * @param {String} datadir
 */
function KadFSAdapter (datadir) {
  if (!(this instanceof KadFSAdapter)) {
    return new KadFSAdapter(datadir)
  }

  this.datadir = datadir + '/'

  if (!fs.existsSync(datadir)) {
    fs.mkdirSync(datadir)
  }

  assert(fs.statSync(datadir).isDirectory(), 'Invalid data directory')
}

/**
 * Fetches the contents of the file at key
 * #get
 * @param {String} key
 * @param {Function} callback
 */
KadFSAdapter.prototype.get = function (key, callback) {
  assert(_.isString(key), 'key is not a valid string')
  assert(_.isFunction(callback), 'callback is not a valid function')
  var self = this
  key = new Buffer(key, 'utf8').toString('base64')
  fs.exists(self.datadir + key, function (exists) {
    if (!exists) {
      return callback(new Error('Not found'))
    }

    fs.readFile(self.datadir + key, function (err, contents) {
      if (err) {
        return callback(err)
      }
      callback(null, contents.toString())
    })
  })
}

/**
 * Places the value at a file named key
 * #put
 * @param {String} key
 * @param {String} value
 * @param {Function} callback
 */
KadFSAdapter.prototype.put = function (key, value, callback) {
  assert(_.isString(key), 'key is not a valid string')
  assert(!callback || _.isFunction(callback), 'callback is not a valid function')
  assert(_.isString(value), 'value is not a valid string')
  key = new Buffer(key, 'utf8').toString('base64')
  fs.writeFile(this.datadir + key, value, callback)
}

/**
 * Deletes the value at the given key
 * #del
 * @param {String} key
 * @param {Function} callback
 */
KadFSAdapter.prototype.del = function (key, callback) {
  assert(_.isString(key), 'key is not a valid string')
  assert(!callback || _.isFunction(callback), 'callback is not a valid function')
  var self = this
  key = new Buffer(key, 'utf8').toString('base64')

  fs.exists(self.datadir + key, function (exists) {
    if (!exists) {
      return callback()
    }

    fs.unlink(self.datadir + key, callback)
  })
}

/**
 * Retruns a stream of the entire database
 * #createReadStream
 */
KadFSAdapter.prototype.createReadStream = function () {
  var adapter = this
  var items = fs.readdirSync(this.datadir)
  var current = 0

  return new stream.Readable({
    objectMode: true,
    read: function () {
      var stream = this
      var key = items[current]

      if (!key) {
        return stream.push(null)
      }
      key = new Buffer(key, 'utf8').toString('base64')

      fs.readFile(adapter.datadir + key, function (err, contents) {
        if (err) {
          return stream.emit('error', err)
        }

        current++
        stream.push({ key: key, value: contents.toString() })
      })
    }
  })
}

module.exports = KadFSAdapter
