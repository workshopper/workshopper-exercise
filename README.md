[![NPM](https://nodei.co/npm/workshopper-exercise.png?foo)](https://nodei.co/npm/workshopper-exercise/)

## How to fail an exercise

In `/exercises/${EXERCISE_NAME}/exercise.js`:

```javascript
const exercise = require('workshopper-exercise')();

function sureToFail(errback) {
    exercise.emit('fail', 'told you it was going to fail');
    errback(null, false);
}

exercise.addVerifyProcessor(sureToFail);

module.exports = exercise;
```

This exercise will always fail, with the output:

```bash
 ✗ 

 told you it was going to fail

 # FAIL Your solution to ${EXERCISE_NAME} didn't pass. Try again!

─────────────────────────────────────────────────────────────────────────────

  » To print these instructions again, run: ${WORKSHOP_NAME} print
  » To execute your program in a test environment, run: ${WORKSHOP_NAME} run
    program.js
  » To verify your program, run: ${WORKSHOP_NAME} verify program.js
  » For help run: ${WORKSHOP_NAME} help 
```

## How use i18n-ed messages in an exercise

The term "i18n" is short for "internationalisation".
A workshopper exercise can surface messages in multiple languages
through its built-in i18n functionality:

1. Use `exercise.__(...)` in place of hard-coded strings, and
2. add the values to the relevant i18n file,
   as per workshopper's folder structure conventions.

In `/exercises/${EXERCISE_NAME}/exercise.js`:

```javascript
const exercise = require('workshopper-exercise')();

function pureLuck(errback) {
    const chance = Math.random();
    const pass = chance < 0.5;
    if (pass) {
        exercise.emit('pass', exercise.__('pass.lucky', { chance }));
    } else {
        exercise.emit('fail', exercise.__('fail.unlucky', { chance }));
    }
    errback(null, pass);
}

exercise.addVerifyProcessor(pureLuck);

module.exports = exercise;
```

`exercise.__(...)`:

- The 1st parameter is a `.` delimited key used for lookups in i18n files.
- The 2nd (optional) parameter is a hash of substitutions,
  and should be used for messages whose content is dynamic.

In `/i18n/${LANGUAGE_CODE}.json`:

```json
{
  ...
  "exercises": {
    "${EXERCISE_NAME}": {
      "pass": {
        "lucky": "You were lucky :) {{chance}}"
    },
      "fail": {
        "unlucky": "You were unlucky :( {{chance}}"
      }
    }
  }
}
```

Workshopper's i18n looks in several different places for the string values,
as i18n is used in many other parts of workshopper.
For exercises, the logical place to put them is in `exercises -> ${EXERCISE_NAME} -> ...`.
The `pass` and `fail` sub-objects are merely convention, 
and you do not have to use them -
any nesting below this is completely free-form.
The `{{...}}` are markers for templating,
using key-value pairs from the 2nd parameter to `exercise.__(...)`.

In order for your exercise to display multiple languages,
you will need to create one of these files per language,
where the keys are identical and the values are translated into each language.
For example, the line for `pass.lucky` for the தமிழ் language would be: 
`"lucky": "நீ அதிர்ஷ்டசாலி :) {{chance}}"`,
and would be in the `/i18n/ta.json` file.

When this exercise fails, it will output:

```bash
 ✗ 

 You were unlucky :( 0.5738622391092318

 # FAIL Your solution to ${EXERCISE_NAME} didn't pass. Try again!

─────────────────────────────────────────────────────────────────────────────

  » To print these instructions again, run: ${WORKSHOP_NAME} print
  » To execute your program in a test environment, run: ${WORKSHOP_NAME} run                                                                          
    program.js                                                                
  » To verify your program, run: ${WORKSHOP_NAME} verify program.js            
  » For help run: ${WORKSHOP_NAME} help
```

... and when it passes, it will output:

```bash
 ✓ 

 You were lucky :) 0.2753477873643899

 # PASS Your solution to ${EXERCISE_NAME} passed!

 You have ${REMAINING_EXERCISE_COUNT} challenges left.

 Type '${WORKSHOP_NAME}' to show the menu.

─────────────────────────────────────────────────────────────────────────────

  » To print these instructions again, run: ${WORKSHOP_NAME} print             
  » To execute your program in a test environment, run: ${WORKSHOP_NAME} run
    program.js
  » To verify your program, run: ${WORKSHOP_NAME} verify program.js
  » For help run: ${WORKSHOP_NAME} help
```

## How to get command line arguments

The command line arguments passed into the `verify` subcommand
can be accessed within an exercise via the `args` property.

In `/exercises/${EXERCISE_NAME}/exercise.js`:

```javascript
const exercise = require('workshopper-exercise')();

function firstArgMustBeFoo(errback) {
    const pass = exercise.args[0] === 'foo';
    if (pass) {
      exercise.emit('pass', 'first CLI argument was foo');
    } else {
      exercise.emit('fail', 'first CLI argument wasn\'t foo');
    }
    errback(null, pass);
}

exercise.addVerifyProcessor(firstArgMustBeFoo);

module.exports = exercise;
```

Command line arguments have a variety of use cases,
and in workshopper exercises,
one would typically use it to specify the submission file name.

When you run `${WORKSHOP_NAME} verify bar`, it will output:

```bash
 ✗ 

 first CLI argument wasn't foo

 # FAIL Your solution to ${EXERCISE_NAME} didn't pass. Try again!

─────────────────────────────────────────────────────────────────────────────

  » To print these instructions again, run: ${WORKSHOP_NAME} print
  » To execute your program in a test environment, run: ${WORKSHOP_NAME} run
    program.js
  » To verify your program, run: ${WORKSHOP_NAME} verify program.js
  » For help run: ${WORKSHOP_NAME} help
```

... and when you run `${WORKSHOP_NAME} verify foo`, it will output:

```bash
 ✓ 

 first CLI argument was foo

 # PASS Your solution to ${EXERCISE_NAME} passed!

 You have ${REMAINING_EXERCISE_COUNT} challenges left.

 Type '${WORKSHOP_NAME}' to show the menu.

─────────────────────────────────────────────────────────────────────────────

  » To print these instructions again, run: ${WORKSHOP_NAME} print
  » To execute your program in a test environment, run: ${WORKSHOP_NAME} run
    program.js
  » To verify your program, run: ${WORKSHOP_NAME} verify program.js
  » For help run: ${WORKSHOP_NAME} help
```
