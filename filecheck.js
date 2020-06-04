const fs = require('fs')
const path = require('path')

function setup (_mode, callback) {
  const fileError = function (i18nKey) {
    return callback(new Error(this.__(i18nKey, { submission: submissionPath })))
  }.bind(this)

  const noFileError = function () {
    return fileError('error.submission_no_file')
  }

  const notRegularError = function () {
    return fileError('error.submission_not_regular')
  }

  const submission = this.args[0]
  const submissionPath = submission ? path.resolve(submission.toString()) : ''

  if (!submission) return noFileError()

  fs.stat(submission.toString(), function (err, stat) {
    if ((err && err.code === 'ENOENT') || !stat) { return noFileError() }

    if (err) { return callback(err) }

    if (!stat.isFile()) { return notRegularError() }

    callback()
  })
}

function filecheck (exercise) {
  exercise.addSetup(setup)
  return exercise
}

module.exports = filecheck
