const Exercise = require('./exercise')
    , inherits = require('util').inherits


function CompareStdoutExercise () {
  if (!(this instanceof CompareStdoutExercise))
    return new CompareStdoutExercise()

  Exercise.call(this)
}


inherits(CompareStdoutExercise, Exercise)


CompareStdoutExercise.prototype.verify = function () {
  return compare(
      submissionStdout
    , solutionStdout
    , this._runner.longOutput
    , function (err, status) {
        kill()
        if (err)
          return self.emit('error')
        self.emit(status)
      }
  )
}


module.exports = CompareStdoutExercise