var fs = require('fs');
var html = require('./_func/influxHtml.js');
var influx = require('./_func/influxAws.js');

var express = require('express');
var formidable = require('formidable');
const influxAws = require('./_func/influxAws.js');
//const { Lambda } = require('./node_modules/aws-sdk/index.js');
const port = 1337;

var app = express();
module.exports = app;

app.use('/_css', express.static('_css'));
app.use('/_img', express.static('_img'));
app.use('/_js', express.static('_js'));


async function ShowPage (req, res) {
    var pathArr = req.url.split('/');
    var page = pathArr.length > 1 ? pathArr[1] : 'home';
    if (page == 'download') {
        Download(req, res);
    }
    else if (page == 'convert') {
        Convert(req, res);
    }
    else {
        var page = './_pages/' + page + '.js';
        if (!fs.existsSync(page)) {
            page = './_pages/home.js';
        }

        console.log("Requested url: " + req.url + "\nRequested timestamp: " + new Date() + "\nReturned script: " + page + "\n");
        var pg = require(page);

        var jsLoggers = await influx.objects(null);

        var content =
            html.header +
            html.navigation(jsLoggers, pathArr[3]) +
            await pg.html(pathArr, jsLoggers) +
            html.footer;

        res.send(content);
    }
}

async function Download(req, res) {
    var pathArr = req.url.split('/');
    pathArr.splice(0, 2);
    path = pathArr.join('/');
    console.log(path);
    influx.downloadfile(path, res);
}

function httpGet(url) {
    return new Promise((resolve, reject) => {
        const http = require('http'),
            https = require('https');

        let client = http;

        if (url.toString().indexOf("https") === 0) {
            client = https;
        }

        client.get(url, (resp) => {
            let chunks = [];

            // A chunk of data has been recieved.
            resp.on('data', (chunk) => {
                chunks.push(chunk);
            });

            // The whole response has been received. Print out the result.
            resp.on('end', () => {
                resolve(Buffer.concat(chunks));
            });

        }).on("error", (err) => {
            reject(err);
        });
    });
}

async function Convert(req, res) {
    var pathArr = req.url.split('/');
    var type = pathArr[2];

    pathArr.splice(0, 3);
    path = pathArr.join('/');

    var init = require("./_func/initialization.js");
    var lambdascript =
        "https://ylgq45ta3y3bnng2qgcpgreogy0fqirw.lambda-url." + init.AwsRegion + ".on.aws/?" +
        "bucket=" + init.AwsBucket +
        "&filename=" + path +
        "&conversion=" + type;

    (async (url) => {
        var buf = await httpGet(url);
        var csv = path.split('.').slice(0, -1).join('.') + '.' + type;
        influx.downloadfile(csv, res);

    })(lambdascript);
}

async function UploadData(req, res) {
    var pathArr = req.url.split('/');
    var logger = pathArr[3];

    const form = formidable({ multiples: true });

    var files = await new Promise(function (resolve, reject) {
        form.parse(req, function (err, fields, files) {
            if (err) {
                reject(err);
                return;
            }
            resolve(files);
        });
    });

    var file = null;
    var dest = '';
    if (files.xml) {
        file = files.xml;
        dest = 'Configuration.xml';
    }
    else if (files.rxc) {
        file = files.xml;
        dest = 'Configuration.rxc';
    }
    else if (files.dbc) {
        file = files.dbc;
        dest = 'ExportDBC.dbc';
    }
    if (file) {
        var stream = fs.createReadStream(file.filepath);
        await influxAws.upload(logger + "/" + dest, stream);
        fs.unlink(file.filepath, (err => { }));
    }
    ShowPage(req, res);
}

app.get('/*', async (req, res) => ShowPage(req, res));
app.post('/*', async (req, res) => UploadData(req, res));

var server = app.listen(port, () => console.log(`Server running at http://127.0.0.1/${port}`));


