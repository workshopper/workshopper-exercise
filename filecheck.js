const fs = require('fs')
    , path = require('path')


function setup (mode, callback) {
  var submission = this.args[0]

  fs.stat(submission.toString(), function (err, stat) {
    if ((err && err.code == 'ENOENT') || !stat)
      return callback(new Error(this.__('error.submission_no_file', {submission: path.resolve(submission.toString())})))

    if (err)
      return callback(err)

    if (!stat.isFile())
      return callback(new Error(this.__('error.submission_not_regular', {submission: path.resolve(submission.toString())})))

    callback()
  }.bind(this))
}


function filecheck (exercise) {
  exercise.addSetup(setup)
  return exercise
}


module.exports = filecheck
