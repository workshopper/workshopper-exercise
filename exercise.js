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


Exercise.prototype.run = function (submission, args) {
  this.submission     = submission

  // default args, override if you want to pass special args to the
  // solution and/or submission, override this.setup to do this
  this.submissionArgs = Array.prototype.slice.call(args)
  this.solutionArgs   = Array.prototype.slice.call(args)

  this.setup(function (err) {
    if (err)
      this.emit('error', err)

    this.execute('run')
  }.bind(this))
}


// override if you want to mess with stdout
Exercise.prototype.getStdout = function (type, child) {
  // type == 'submission' || 'solution'
  return child.stdout
}


Exercise.prototype.execute = function (mode) {
  this.submissionChild  = spawn(this.submission, this.submissionArgs, this.env)
  this.submissionStdout = this.getStdout('submission', this.submissionChild)

  if (mode == 'verify') {
    this.solutionChild  = spawn(this.solution, this.solutionArgs, this.env)
    this.solutionStdout = this.getStdout('solution', this.solutionChild)
  }

  this.submissionChild.on('end', this.kill.bind(this))

  this.process()
}


Exercise.prototype.kill = function () {
  [ this.submissionChild, this.solutionChild ].forEach(function (child) {
    if (child && typeof child.kill == 'function')
      child.kill()
  })

  setTimeout(this.emit.bind(this, 'end'), 10)
}


Exercise.prototype.process = function () {
  this.submissionStdout.pipe(process.stdout)
  this.submissionChild.stderr.pipe(process.stderr)

  if (this.solutionChild) {
    this.submissionStdout.pipe(process.stdout)
    this.submissionChild.stderr.pipe(process.stderr)
  }
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

          callback(null, path.extname(file).replace(/^\//, ''), text)
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


module.exports = Exercise

/*

Exercise.prototype.getSubmissionCommand = function (file) {
  var args = this._runner.args || this._runner.submissionArgs || []
    , exec

  if (this._runner.wrap || this._runner.submissionWrap) {
    exec = [ require.resolve('./exec-wrapper') ]
    exec = exec.concat(this._runner.wrap || this._runner.submissionWrap)
    exec = exec.concat(file)
  } else {
    exec = [ file ]
  }

  return exec.concat(args)
}

Exercise.prototype.getSolutionCommand = function () {
  var args = this._runner.args || this._runner.solutionArgs || []
    , exec

  if (this._runner.wrap || this._runner.solutionWrap) {
    exec = [ require.resolve('./exec-wrapper') ]
    exec = exec.concat(this._runner.wrap || this._runner.solutionWrap)
    exec = exec.concat(path.join(this._dir, 'solution.js'))
  } else {
    exec = [ path.join(this._dir, 'solution.js') ]
  }

  return exec.concat(args)
}

Exercise.prototype.execute = function (mode, file) {
  var self = this
    , submission
    , solution
    , submissionStdout
    , solutionStdout

  function kill () {
    submission && typeof submission.kill == 'function' && submission.kill()
    solution && typeof solution.kill == 'function' && solution.kill()
    setTimeout(self.emit.bind(self, 'end'), 10)
  }

  submission = spawn(process.execPath, this.getSubmissionCommand(file))
  submissionStdout = this._runner.submissionStdout || submission.stdout

  if (mode == 'run') {
    submissionStdout.pipe(process.stdout)
    submission.stderr.pipe(process.stderr)
    submissionStdout.on('end', kill)
    return
  }

  solution = spawn(process.execPath, this.getSolutionCommand())
  solutionStdout = this._runner.solutionStdout || solution.stdout
}
*/