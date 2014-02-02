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

  if (mode == 'run' || !this.solutionChild) // no compare needed
    return this.submissionStdout.pipe(process.stdout)

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
      , output

    equal = equal && eq

    if (this.long) {

      output =
          chalk.yellow.bold(lineStr + '  ACTUAL:  ')
        + _colourfn(actual)
        + '\n'
        + chalk.yellow.bold(lineStr + 'EXPECTED:  ')
        + _colourfn(expected)
        + '\n\n'

    } else {

      output =
          _colourfn(lineStr)
        + _colourfn(wrap(actual, 40))
        + _colourfn('\u2502')
        + _colourfn(chalk.bold(eq ? ' == ' : ' != '))
        + _colourfn('\u2502   ')
        + _colourfn(expected)
        + '\n'

    }

      callback(null, output)
  }

  function flush (_callback) {
    output.push('\n')

    _callback(null)

    callback(null, equal) // process() callback
  }

  output = through2.obj(transform.bind(this), flush.bind(this))

  if (!this.long) {
    output.push(chalk.bold.yellow(center('ACTUAL', 45) + center('EXPECTED', 45) + '\n'))
    output.push(chalk.bold.yellow(repeat('\u2500', 90)) + '\n\n')
  }

  tuple(this.submissionStdout.pipe(split()), this.solutionStdout.pipe(split()))
    .pipe(output)
    .pipe(process.stdout)
}

module.exports = comparestdout