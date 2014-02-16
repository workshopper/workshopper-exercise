const chalk    = require('chalk')
    , split    = require('split')
    , tuple    = require('tuple-stream')
    , through2 = require('through2')


function comparestdout (exercise) {
  return exercise.addProcessor(processor)
}


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


function processor (mode, callback) {
  this.submissionChild.stderr.pipe(process.stderr)

  if (mode == 'run' || !this.solutionChild) {
    // no compare needed
    this.submissionStdout.pipe(process.stdout)
    return this.on('executeEnd', function () {
      callback(null, true)
    })
  }

  var equal = true
    , line  = 1
    , outputStream

  function transform (chunk, enc, callback) {

    if (line == 1) {
      outputStream.push('\nYour submission results compared to the expected:\n\n')

      if (!this.longCompareOutput)
        outputStream.push(chalk.yellow(center('ACTUAL', 40) + center('EXPECTED', 40) + '\n'))

      outputStream.push(chalk.yellow(repeat('\u2500', 80)) + '\n\n')
    }

    var eq        = chunk[0] === chunk[1]
      , lineStr   = wrap(String(line++ + '.'), 3)
      , _colourfn = colourfn(eq ? 'PASS' : 'FAIL')
      , actual    = chunk[0] == null ? '' : JSON.stringify(chunk[0])
      , expected  = chunk[1] == null ? '' : JSON.stringify(chunk[1])
      , output

    equal = equal && eq

    if (this.longCompareOutput) {

      output =
          chalk.yellow(lineStr + '  ACTUAL:  ')
        + _colourfn(actual)
        + '\n'
        + chalk.yellow(lineStr + 'EXPECTED:  ')
        + _colourfn(expected)
        + '\n\n'

    } else {

      output =
          //_colourfn(lineStr)
          '   '
        + _colourfn(wrap(actual, 34))
        + _colourfn(chalk.bold(eq ? ' == ' : ' != '))
        + '   '
        + _colourfn(wrap(expected, 34))
        + '\n'

    }

    callback(null, output)
  }

  function flush (_callback) {
    outputStream.push('\n' + chalk.yellow(repeat('\u2500', 80)) + '\n\n')

    this.emit(equal ? 'pass' : 'fail', 'Submission results match expected')

    _callback(null)

    callback(null, equal) // process() callback
  }

  outputStream = through2.obj(transform.bind(this), flush.bind(this))

  tuple(this.submissionStdout.pipe(split()), this.solutionStdout.pipe(split()))
    .pipe(outputStream)
    .pipe(process.stdout)
}

module.exports = comparestdout