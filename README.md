## Introduction

Extract localized strings from .php files and create a .pot file for translation. WordPress compatible. No dependencies.

**Note: this library covers 90% of everyday cases. However, some complex strings may be missing in the output - add those strings manually.**

## Getting Started

Install the package:
```bash
npm install -g makepot
```

Usage:
```bash
makepot path/to/php/folder path/to/out/folder
```

## Command Line

```
Usage:
  makepot [options] <php-dir> <out-dir>

Options:
  --help          Print this message
  --json          Save extracted strings in JSON file
  --force         Force overwrite file
  --verbose       Enable detailed logging
  --version       Print version number

Examples:
  makepot --version
  makepot --verbose . lang
  makepot --json wp-content/themes wp-content/languages
```

## Using as library

```javascript
var makepot = require('makepot');
makepot({ dir: 'path/to/php/folder' }, function(error, result) {
  if (error) return console.error(error);
  console.log(result.data);
  console.log(result.pot[0].name);
  console.log(result.pot[0].content);
});
```

console.log(result.data);
```javascript
[
  {
    "hits": 65,
    "file": "includes/ajax.php",
    "data": [
      {
        "func": "__",
        "name": "wp_theme",
        "args": [ " ago" ],
        "match": "__(' ago', 'wp_theme')",
        "line": 43,
        "file": "includes/ajax.php"
      },
      {
        "func": "__",
        "name": "wp_theme",
        "args": [ " about " ],
        "match": "__(' about ', 'wp_theme')",
        "line": 51,
        "file": "includes/ajax.php"
      },
      ...
      {
        "func": "_e",
        "name": "wp_theme",
        "args": [ "Demo settings will import \"theme options\", \"widgets\", \"revolution slider\" and \"visual composer templates\"" ],
        "match": "_e('Demo settings will import \"theme options\", \"widgets\", \"revolution slider\" and \"visual composer templates\"', 'wp_theme')",
        "line": 135,
        "file": "includes/ajax.php"
      }
    ]
  },
  ...
]
```

console.log(result.pot[0].name);
```
wp_theme
```

console.log(result.pot[0].content);
```
msgid ""
msgstr ""
"Language: en\n"
"Content-Type: text/plain; charset=UTF-8\n"
"Content-Transfer-Encoding: 8bit\n"
"X-Generator: makepot.js 0.3.0\n"

#: includes/ajax.php:43
msgid " ago"
msgstr ""

#: includes/ajax.php:51
msgid " about "
msgstr ""

...

#: includes/ajax.php:135
msgid "Demo settings will import \"theme options\", \"widgets\", \"revolution slider\" and \"visual composer templates\""
msgstr ""
```