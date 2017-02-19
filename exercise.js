const path         = require('path')
    , fs           = require('fs')
    , inherits     = require('util').inherits
    , EventEmitter = require('events').EventEmitter
    , i18n         = require('i18n-core')
    , i18nFs       = require('i18n-core/lookup/fs')(path.join(__dirname, 'i18n'))


function Exercise () {
  if (!(this instanceof Exercise))
    return new Exercise()

  EventEmitter.call(this)

  this._prepares   = []
  this._setups     = []
  this._processors = []
  this._cleanups   = []

  this.passed      = true // explicitly fail
}

inherits(Exercise, EventEmitter)

// exercise plugin convenience
// plugin arg is just a function that takes an exercise
// variable args to `use` are forwarded to plugin
Exercise.prototype.use = function use(plugin) {
  var args = [].slice.call(arguments, 1)
  return plugin.apply(this, [ this ].concat(args))
}

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
  this.__defineGetter__('lang', function () {
    var i18n = workshopper.i18n
    if (workshopper.lang) {
      return workshopper.lang
    } else {
      return i18n.lang()
    }
  })
  this.i18n        = i18n({
    get: function (key) {
      var i18n = workshopper.i18n
        , lookup = 'exercises.' + name + '.' + key
        , fallback = 'common.exercise.' + key
      return i18n.has(lookup) ? i18n.get(lookup) :
             i18nFs.get(this.lang + '.' + key) || (
               i18n.has(fallback) ? i18n.get(fallback) :
               i18n.get(key)
             )
    }.bind(this)
  })
  this.i18n.fallback = function (key) {
    if (!key)
      return '(???)'

    return '?exercises.' + name + '.' + key + ' || common.exercise.' + key + ' || ' + key + '?'
  }
  this.__          = this.i18n.__
  this.__n         = this.i18n.__n
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
    , self       = this

  ;(function next (i) {
    if (i == processors.length) {
      return process.nextTick(function () {
        callback(null, self.passed)
      })
    }

    processors[i].call(self, mode, function (err, pass) {
      if (err)
        return callback(err)

      if (pass === false)
        self.passed = false

      next(++i)
    })
  })(0)
}


Exercise.prototype.getProblemFile = function (callback) {
  var uncheckedFiles = [
        'problem.' + this.lang + '.md'
      , 'problem.' + this.lang + '.txt'
      , 'problem.md'
      , 'problem.txt'
      , 'problem.' + this.defaultLang + '.md'
      , 'problem.' + this.defaultLang + '.txt'
    ]
    , scope = this
  function checkNextFile() {
    var file = uncheckedFiles.shift()
    if (!file)
      return callback(null)

    file = path.resolve(scope.dir, file)
    fs.exists(file, function (exists) {
      if (!exists)
        return checkNextFile()

      fs.stat(file, function (err, stat) {
        if (err)
          return callback(err)

        if (stat && stat.isFile())
          return callback(null, file)

        checkNextFile()
      })
    })
  }
  checkNextFile();
}

Exercise.prototype.getExerciseText = function (callback) {
  this.getProblemFile(function (err, file) {
    if (err)
      return callback(err)

    if (!file)
      return callback(new Error(this.__('error.missing_problem', {name: this.__('exercise.' + this.name), err: err})))

    fs.readFile(file, 'utf8', function (err, text) {
      if (err)
        return callback(err)

      callback(null, path.extname(file).replace(/^\./, ''), text)
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
