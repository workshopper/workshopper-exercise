const path         = require('path')
    , fs           = require('fs')
    , after        = require('after')
    , inherits     = require('util').inherits
    , EventEmitter = require('events').EventEmitter


function Exercise () {
  if (!(this instanceof Exercise))
    return new Exercise()

  EventEmitter.call(this)

  this._prepares   = []
  this._setups     = []
  this._processors = []
  this._cleanups   = []
}


inherits(Exercise, EventEmitter)


// for addVerifyProcessor and addVerifySetup
function verifyOnly (fn) {
  return function (mode) {
    if (mode == 'run')
      // there's either 2 or 3 args, with callback last
      return arguments[arguments.length - 1](null, true)

    fn.apply(this, Array.prototype.slice.call(arguments, 1))
  }
}

// for addRunProcessor and addRunSetup
function runOnly (fn) {
  return function (mode) {
    if (mode == 'verify')
      // there's either 2 or 3 args, with callback last
      return arguments[arguments.length - 1](null, true)

    fn.apply(this, Array.prototype.slice.call(arguments, 1))
  }
}


'Prepare Setup Processor Cleanup'.split(' ').forEach(function (t) {

  Exercise.prototype['add' + t] = function (fn) {
    this['_' + t.toLowerCase() + 's'].push(fn)
    return this
  }

  Exercise.prototype['addRun' + t] = function (fn) {
    this['_' + t.toLowerCase() + 's'].push(runOnly(fn))
    return this
  }

  Exercise.prototype['addVerify' + t] = function (fn) {
    this['_' + t.toLowerCase() + 's'].push(verifyOnly(fn))
    return this
  }

})


Exercise.prototype.init = function (workshopper, id, name, dir, number) {
  this.workshopper = workshopper
  this.id          = id
  this.name        = name
  this.dir         = dir
  this.number      = number
}


Exercise.prototype.prepare = function (callback) {
  var prepares = this._prepares
    , self   = this

  if (!prepares.length)
    return process.nextTick(callback)

  ;(function next (i) {
    if (i == prepares.length)
      return process.nextTick(callback)

    prepares[i].call(self, function (err) {
      if (err)
        return callback(err)

      next(++i)
    })
  })(0)
}


Exercise.prototype.setup = function (mode, callback) {
  var setups = this._setups
    , self   = this

  if (!setups.length)
    return process.nextTick(callback)

  ;(function next (i) {
    if (i == setups.length)
      return process.nextTick(callback)

    setups[i].call(self, mode, function (err) {
      if (err)
        return callback(err)

      next(++i)
    })
  })(0)
}


function runVerify (mode, args, callback) {
  this.args = Array.prototype.slice.call(args)

  this.setup(mode, function (err) {
    if (err)
      return callback(err)

    this.process(mode, callback)
  }.bind(this))
}


Exercise.prototype.run = function (args, callback) {
  runVerify.call(this, 'run', args, callback)
}


Exercise.prototype.verify = function (args, callback) {
  runVerify.call(this, 'verify', args, callback)
}


Exercise.prototype.process = function (mode, callback) {
  var processors = this._processors
    , passed     = true
    , self       = this

  ;(function next (i) {
    if (i == processors.length) {
      return process.nextTick(function () {
        callback(null, passed)
      })
    }

    processors[i].call(self, mode, function (err, pass) {
      if (err)
        return callback(err)

      if (pass === false)
        passed = false

      next(++i)
    })
  })(0)
}


Exercise.prototype.getExerciseText = function (callback) {
  var file
    , done = after(2, function (err) {
        if (err)
          return callback(err)

        if (!file)
          return callback(new Error('Could not find problem.txt or problem.md for [' + this.name + ']', err))

        fs.readFile(file, 'utf8', function (err, text) {
          if (err)
            return callback(err)

          callback(null, path.extname(file).replace(/^\./, ''), text)
        })
      })

  'txt md'.split(' ').forEach(function (ext) {
    var _file = path.join(this.dir, 'problem.' + ext)
    fs.stat(_file, function (err, stat) {
      if (stat && stat.isFile() && (!file || file == 'problem.txt')) // prefer .md
        file = _file

      done()
    })
  }.bind(this))
}


Exercise.prototype.getSolutionFiles = function (callback) {
  process.nextTick(function () {
    callback(null, [])
  })
}


Exercise.prototype.end = function (mode, pass, callback) {
  var cleanups = this._cleanups
    , self     = this

  if (!cleanups.length)
    return process.nextTick(callback)

  ;(function next (i) {
    if (i == cleanups.length)
      return process.nextTick(callback)

    cleanups[i].call(self, mode, pass, function (err) {
      if (err)
        return callback(err)

      next(++i)
    })
  })(0)
}


module.exports = Exercise
