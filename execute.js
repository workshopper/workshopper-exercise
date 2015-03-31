const spawn     = require('child_process').spawn
    , path      = require('path')
    , fs        = require('fs')
    , after     = require('after')
    , xtend     = require('xtend')
    , interpret = require('interpret')

function execute (exercise, opts) {
  if (!opts) opts = {}

  exercise.addSetup(setup)
  exercise.addProcessor(processor)


  // override if you want to mess with stdout
  exercise.getStdout = function (type, child) {
    // type == 'submission' || 'solution'
    return child.stdout
  }

  exercise.getSolutionFiles = function (callback) {
    var translated = path.join(this.dir, './solution_' + this.lang)
    fs.exists(translated, function (exists) {
      var solutionDir = exists ? translated : path.join(this.dir, './solution')

      fs.readdir(solutionDir, function (err, list) {
        if (err)
          return callback(err)

        list = list
          .filter(function (f) { return !!interpret.jsVariants[path.extname(f)] })
          .map(function (f) { return path.join(solutionDir, f)})

        callback(null, list)
      })
    }.bind(this))
  }

  return exercise

  function setup (mode, callback) {
    this.submission = this.args[0] // first arg obviously

    // default args, override if you want to pass special args to the
    // solution and/or submission, override this.setup to do this
    this.submissionArgs = Array.prototype.slice.call(1, this.args)
    this.solutionArgs   = Array.prototype.slice.call(1, this.args)

    // edit/override if you want to alter the child process environment
    this.env            = xtend(process.env)

    // set this.solution if your solution is elsewhere
    if (!this.solution) {
      var self = this
      Object.keys(interpret.jsVariants).some(function (extension) {
        var localisedSolutionPath = path.join(self.dir, './solution_' + self.lang + '/solution' + extension)
        var solutionPath = path.join(self.dir, './solution/solution' + extension)

        if (fs.existsSync(localisedSolutionPath)) {
          self.solution = localisedSolutionPath
          return true
        } else if (fs.existsSync(solutionPath)) {
          self.solution = solutionPath
          return true
        }
        return false
      })
    }

    process.nextTick(callback)
  }


  function kill () {
    ;[ this.submissionChild, this.solutionChild ].forEach(function (child) {
      if (child && typeof child.kill == 'function')
        child.kill()
    })

    setTimeout(function () {
      this.emit('executeEnd')
    }.bind(this), 10)
  }


  function processor (mode, callback) {
    var ended = after(mode == 'verify' ? 2 : 1, kill.bind(this))

    var submissionExtension = path.extname(this.submission),
        solutionExtension = path.extname(this.solution)

    // fail an exercise if the submission and solution file extensions don't match
    if (submissionExtension !== solutionExtension) {
      return process.nextTick(function () {
        callback('submission should be a ' + solutionExtension + ' file', false)
      })
    }

    // backwards compat for workshops that use older custom setup functions
    if (!this.solutionCommand) this.solutionCommand = [ this.solution ].concat(this.solutionArgs)
    if (!this.submissionCommand) this.submissionCommand = [ this.submission ].concat(this.submissionArgs)

    // add extensions from interpret, if needed
    if (solutionExtension !== '.js' && interpret.jsVariants[solutionExtension]) {
      this.solutionCommand.unshift('-r', interpret.extensions[solutionExtension])
      this.submissionCommand.unshift('-r', interpret.extensions[solutionExtension])
    }

    this.submissionChild  = spawn(opts.exec || process.execPath, this.submissionCommand, this.env)
    this.submissionStdout = this.getStdout('submission', this.submissionChild)

    setImmediate(function () { // give other processors a chance to overwrite stdout
      this.submissionStdout.on('end', ended)
    }.bind(this))

    if (mode == 'verify') {
      this.solutionChild  = spawn(opts.exec || process.execPath, this.solutionCommand, this.env)
      this.solutionStdout = this.getStdout('solution', this.solutionChild)

      setImmediate(function () { // give other processors a chance to overwrite stdout
        this.solutionStdout.on('end', ended)
      }.bind(this))
    }

    process.nextTick(function () {
      callback(null, true)
    })
  }

}

module.exports = execute
