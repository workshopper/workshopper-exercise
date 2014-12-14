const fs = require('fs')


function setup (mode, callback) {
  var submission = this.args[0]

  fs.stat(submission, function (err, stat) {
    if ((err && err.code == 'ENOENT') || !stat)
      return callback(new Error(this.__('error.exercise.submission_no_file', {submission: submission})))

    if (err)
      return callback(err)

    if (!stat.isFile())
      return callback(new Error(this.__('error.exercise.submission_not_regular', {submission: submission})))

    callback()
  }.bind(this))
}


function filecheck (exercise) {
  exercise.addSetup(setup)
  return exercise
}


module.exports = filecheck
