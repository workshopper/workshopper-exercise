const path         = require('path')
    , fs           = require('fs')
    , spawn        = require('child_process').spawn
    , inherits     = require('util').inherits
    , EventEmitter = require('events').EventEmitter
    , after        = require('after')


function Exercise () {}


inherits(Exercise, EventEmitter)


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
Exercise.prototype.setup = function (callback) {
  process.nextTick(callback)
}

function runVerify (mode, submission, args) {
  this.submission     = submission
  // default args, override if you want to pass special args to the
  // solution and/or submission, override this.setup to do this
  this.submissionArgs = Array.prototype.slice.call(args)
  this.solutionArgs   = Array.prototype.slice.call(args)

  this.setup(function (err) {
    if (err)
      this.emit('error', err)

    this.execute(mode)
  }.bind(this))
}


Exercise.prototype.run = function (submission, args) {
  runVerify.call(this, 'run', submission, args)
}


Exercise.prototype.verify = function (submission, args) {
  runVerify.call(this, 'verify', submission, args)
}


// override if you want to mess with stdout
Exercise.prototype.getStdout = function (type, child) {
  // type == 'submission' || 'solution'
  return child.stdout
}


Exercise.prototype.execute = function (mode) {
  this.submissionChild  = spawn(process.execPath, [ this.submission ].concat(this.submissionArgs), this.env)
  this.submissionStdout = this.getStdout('submission', this.submissionChild)

  if (mode == 'verify') {
    this.solutionChild  = spawn(process.execPath, [ this.solution ].concat(this.solutionArgs), this.env)
    this.solutionStdout = this.getStdout('solution', this.solutionChild)
  }

  this.submissionChild.on('end', this.kill.bind(this))

  this.process(mode)
}


Exercise.prototype.kill = function () {
  [ this.submissionChild, this.solutionChild ].forEach(function (child) {
    if (child && typeof child.kill == 'function')
      child.kill()
  })

  setTimeout(this.emit.bind(this, 'end'), 10)
}


// override this to do something with stdout of both submission and solution
Exercise.prototype.process = function (/* mode */) {
  this.submissionStdout.pipe(process.stdout)
  this.submissionChild.stderr.pipe(process.stderr)
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
