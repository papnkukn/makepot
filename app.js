var fs = require('fs');
var path = require('path');
var makepot = require('./lib/makepot.js');

//Default configuration
var config = {
  force: false,
  verbose: process.env.NODE_VERBOSE == "true" || process.env.NODE_VERBOSE == "1",
  source: undefined,
  target: undefined
};

//Prints help message
function help() {
  console.log("Usage:");
  console.log("  makepot [options] <php-dir> <out-dir>");
  console.log("");
  console.log("Options:");
  console.log("  --help          Print this message");
  console.log("  --json          Save extracted strings in JSON file");
  console.log("  --force         Force overwrite file");
  console.log("  --verbose       Enable detailed logging");
  console.log("  --version       Print version number");
  console.log("");
  console.log("Examples:");
  console.log("  makepot --version");
  console.log("  makepot --verbose . lang");
  console.log("  makepot --json wp-content/themes wp-content/languages");
}

//Command line interface
var args = process.argv.slice(2);
for (var i = 0; i < args.length; i++) {
  switch (args[i]) {
    case "--help":
      help();
      process.exit(0);
      break;
      
    case "-f":
    case "--force":
      config.force = true;
      break;
      
    case "-j":
    case "--json":
      config.json = true;
      break;
      
    case "--verbose":
      config.verbose = true;
      break;
    
    case "-v":    
    case "--version":
      console.log(require('./package.json').version);
      process.exit(0);
      break;
      
    default:
      if (args[i].indexOf('-') == 0) {
        console.error("Unknown command line argument: " + args[i]);
        process.exit(2);
      }
      else if (!config.source) {
        config.source = args[i];
      }
      else if (!config.target) {
        config.target = args[i];
      }
      else {
        console.error("Too many arguments: " + args[i]);
        process.exit(2);
      }
      break;
  }
}

//Help message when no argument specified
if (args.length == 0) {
  help();
  process.exit(0);
}

//Check if the source argument is defined
if (!config.source) {
  console.error("Source directory not defined!");
  process.exit(2);
}

//Check if the source directory exists
if (!fs.existsSync(config.source) || !fs.lstatSync(config.source).isDirectory()) {
  console.error("Directory not found: " + config.source);
  process.exit(2);
}

//Check if the target argument is defined
if (!config.target) {
  console.error("Output directory not defined!");
  process.exit(2);
}

//Check if output file is ready to overwrite
if (fs.existsSync(config.target) && fs.lstatSync(config.target).isDirectory() && fs.readdirSync(config.target).length > 0 && !config.force) {
  console.error("Directory not empty: " + config.target);
  process.exit(3);
}

//Build options
var options = {
  dir: config.source
};

//Start the process
makepot(options, function(error, result) {
  if (error) {
    console.error(config.verbose ? error : error.message);
    process.exit(1);
  }
  
  //Create output directory
  if (!fs.existsSync(config.target)) {
    fs.mkdirSync(config.target);
  }
  
  //Save JSON data
  if (config.json) {
    var jsonfile = path.join(config.target, "makepot.json");
    var json = JSON.stringify(result.data, " ", 2);
    if (config.verbose) {
      console.log("Creating makepot.json");
    }
    fs.writeFileSync(jsonfile, json);
  }
  
  //Save .pot files
  for (var i = 0; i < result.pot.length; i++) {
    var pot = result.pot[i];
    if (!pot.name || !/^[\w\d\-_ ]+$/gi.test(pot.name)) {
      if (config.verbose) {
        console.log("Skipping " + (pot.name || "[unknown]"));
      }
      continue;
    }
    var potfile = path.join(config.target, pot.name + ".pot");
    if (config.verbose) {
      console.log("Creating " + pot.name + ".pot");
    }
    fs.writeFileSync(potfile, pot.content);
  }
  
  console.log("Done!");
});