#! /usr/bin/env node
// -*- js -*-
"use strict";

var fs = require('fs');
var UglifyJS = require("uglify-js");
var nunjucks = require('nunjucks');

var compressor = UglifyJS.Compressor();

var data = JSON.parse(fs.readFileSync('package.json'));
data.build_date = (new Date()).toUTCString();

function uglify(code, opts) {
    var ast = UglifyJS.parse(code);

    ast.figure_out_scope();
    ast = ast.transform(compressor);

    ast.figure_out_scope();
    ast.compute_char_frequency();
    ast.mangle_names();

    return ast.print_to_string(opts)
}

function concat(opts) {

    var out = opts.src.map(function (filePath) {
        return fs.readFileSync(filePath);
    }).join('\n\n');

    out = (new nunjucks.Template(out)).render(data);

    out = uglify(out, opts.uglify || {});


    fs.writeFileSync(opts.dest, out);
    console.log(' ' + opts.dest + ' built.');
}

concat({
    src:[
        'src/polyfills/json.js',
        'src/bb.js'
    ],
    dest:'dist/bb.min.js',
    uglify:{
        max_line_len:79,
        comments:/@license|@usage/
    }
});

concat({
    src:[
        'src/bb-loader.js'
    ],
    dest:'dist/bb-loader.min.js',
    uglify: {
        inline_script:true,
        max_line_len:79,
        comments: /[@license|@usage]/
    }
});
