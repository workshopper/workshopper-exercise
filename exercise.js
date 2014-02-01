const path         = require('path')
    , fs           = require('fs')
    , spawn        = require('child_process').spawn
    , inherits     = require('util').inherits
    , EventEmitter = require('events').EventEmitter
    , after        = require('after')


function Exercise () {
  if (!(this instanceof Exercise))
    return new Exercise()

  EventEmitter.call(this)

  this._setups     = []
  this._processors = []
}


inherits(Exercise, EventEmitter)


// for addVerifyProcessor and addVerifySetup
function verifyOnly (fn) {
  return function (mode, callback) {
    if (mode == 'run')
      return callback(null, true)

    fn.call(this, callback)
  }
}


Exercise.prototype.addProcessor = function (processor) {
  this._processors.push(processor)
  return this
}


// sugar so you don't have to worry about 'run' mode
Exercise.prototype.addVerifyProcessor = function (processor) {
  this._processors.push(verifyOnly(processor))
  return this
}


Exercise.prototype.addSetup = function (setup) {
  this._setups.push(setup)
  return this
}


// sugar so you don't have to worry about 'run' mode
Exercise.prototype.addVerifySetup = function (setup) {
  this._setups.push(verifyOnly(setup))
  return this
}


Exercise.prototype.init = function (id, name, dir, number) {
  this.id     = id
  this.name   = name
  this.dir    = dir
  this.number = number
  // edit/override if you want to alter the child process environment
  this.env    = Array.prototype.slice.call(process.env)

  // set this.solution if your solution is elsewhere
  if (!this.solution)
    this.solution = path.join(dir, './solution/index.js')
}


// override for any pre-run and pre-verify setup
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


function runVerify (mode, submission, args, callback) {
  this.submission     = submission
  // default args, override if you want to pass special args to the
  // solution and/or submission, override this.setup to do this
  this.submissionArgs = Array.prototype.slice.call(args)
  this.solutionArgs   = Array.prototype.slice.call(args)

  this.setup(mode, function (err) {
    if (err)
      return callback('error', err)

    this.execute(mode, callback)
  }.bind(this))
}


Exercise.prototype.run = function (submission, args, callback) {
  runVerify.call(this, 'run', submission, args, callback)
}


Exercise.prototype.verify = function (submission, args, callback) {
  runVerify.call(this, 'verify', submission, args, callback)
}


// override if you want to mess with stdout
Exercise.prototype.getStdout = function (type, child) {
  // type == 'submission' || 'solution'
  return child.stdout
}


Exercise.prototype.execute = function (mode, callback) {
  var ended = after(mode == 'verify' ? 2 : 1, this.kill.bind(this))

  this.submissionChild  = spawn(process.execPath, [ this.submission ].concat(this.submissionArgs), this.env)
  this.submissionStdout = this.getStdout('submission', this.submissionChild)

  this.submissionStdout.on('end', ended)

  if (mode == 'verify') {
    this.solutionChild  = spawn(process.execPath, [ this.solution ].concat(this.solutionArgs), this.env)
    this.solutionStdout = this.getStdout('solution', this.solutionChild)

    this.solutionStdout.on('end', ended)
  }

  this.process(mode, callback)
}


Exercise.prototype.kill = function () {
  ;[ this.submissionChild, this.solutionChild ].forEach(function (child) {
    if (child && typeof child.kill == 'function')
      child.kill()
  })

  setTimeout(function () {
    this.emit('end')
  }.bind(this), 10)
}


// override this to do something with stdout of both submission and solution
Exercise.prototype.process = function (mode, callback) {
  var processors = this._processors
    , passed     = true
    , self       = this

  if (!processors.length) {
    this.submissionStdout.pipe(process.stdout)
    this.submissionChild.stderr.pipe(process.stderr)
    return callback(null, true) // automatic pass!
  }

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
  var solutionDir = path.join(this.dir, './solution/')

  fs.readdir(solutionDir, function (err, list) {
    if (err)
      return callback(err)

    list = list
      .filter(function (f) { return (/\.js$/).test(f) })
      .map(function (f) { return path.join(solutionDir, f)})

    callback(null, list)
  })
}


// override this if you have clean-up to perform
Exercise.prototype.end = function () {}


module.exports = Exercise
