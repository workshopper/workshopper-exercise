const Exercise = require('./exercise')
    , inherits = require('util').inherits
    , chalk    = require('chalk')
    , split    = require('split')
    , tuple    = require('tuple-stream')
    , through2 = require('through2')


function CompareStdoutExercise () {
  if (!(this instanceof CompareStdoutExercise))
    return new CompareStdoutExercise()

  Exercise.call(this)
}


inherits(CompareStdoutExercise, Exercise)


function colourfn (type) {
  return type == 'PASS' ? chalk.green : chalk.red
}


function repeat (ch, sz) {
  return new Array(sz + 1).join(ch)
}


function center (s, sz) {
  var sps = (sz - s.length) / 2
    , sp  = repeat(' ', Math.floor(sps))
  return sp + s + sp + (sp.length != sp ? ' ' : '')
}


function wrap (s_, n) {
  var s = String(s_)
  return s + repeat(' ', Math.max(0, n + 1 - s.length))
}


CompareStdoutExercise.prototype.process = function (mode) {
  this.submissionChild.stderr.pipe(process.stderr)

  if (!this.solutionChild) {
    this.submissionStdout.pipe(process.stdout)
    return
  }

  console.log(chalk.yellow.bold('\nYour submission results compared to the expected:\n'))

  var equal = true
    , line  = 1
    , output

  function transform (chunk, enc, callback) {
    var eq        = chunk[0] === chunk[1]
      , lineStr   = wrap(String(line++ + '.'), 3)
      , _colourfn = colourfn(eq ? 'PASS' : 'FAIL')
      , actual    = chunk[0] == null ? '' : JSON.stringify(chunk[0])
      , expected  = chunk[1] == null ? '' : JSON.stringify(chunk[1])

    equal = equal && eq

    if (this.long) {
      callback(null,
          chalk.yellow.bold(lineStr + '  ACTUAL:  ')
        + _colourfn(actual)
        + '\n'
        + chalk.yellow.bold(lineStr + 'EXPECTED:  ')
        + _colourfn(expected)
        + '\n\n'
      )
    } else {
      callback(null, (
          _colourfn(lineStr)
        + _colourfn(wrap(actual, 40))
        + _colourfn('\u2502')
        + (eq ? '    ' : _colourfn(chalk.bold(' != ')))
        + _colourfn('\u2502   ')
        + _colourfn(wrap(expected, 40))
      ) + '\n')
    }
  }

  function flush (callback) {
    output.push('\n')

    callback(null)

    if (!equal)
      return this.emit('fail')

    if (typeof this.custom != 'function')
      return this.emit('pass')

    this.custom(function (err) {
      this.emit(!err ? 'pass' : 'fail')
    }.bind(this))
  }

  output = through2.obj(transform.bind(this), flush.bind(this))

  if (!this.long) {
    output.push(chalk.bold.yellow(center('ACTUAL', 45) + center('EXPECTED', 45) + '\n'))
    output.push(chalk.bold.yellow(repeat('\u2500', 90)) + '\n\n')
  }

  tuple(this.submissionStdout.pipe(split()), this.solutionStdout.pipe(split()))
    .pipe(output)
    .pipe(process.stdout)

  return output
}

module.exports = CompareStdoutExercise