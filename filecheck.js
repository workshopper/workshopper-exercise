const fs = require('fs')


function setup (mode, callback) {
  var submission = this.args[0]

  fs.stat(submission, function (err, stat) {
    if ((err && err.code == 'ENOENT') || !stat)
      return callback(new Error('No such file: ' + submission))

    if (err)
      return callback(err)

    if (!stat.isFile())
      return callback(new Error('Not a regular file: ' + submission))

    callback()
  })
}


function filecheck (exercise) {
  exercise.addSetup(setup)
  return exercise
}


module.exports = filecheck
