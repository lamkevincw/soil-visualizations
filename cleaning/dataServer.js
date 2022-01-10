// Dependencies
const http = require('http');
const fs = require("fs");
const papa = require("papaparse");
const path = require("path");

// Load csv
var filePath = path.join(__dirname + "./../data/site_A.csv");
const loadedFile = fs.createReadStream(filePath);
var dataJSON;
var data;

papa.parse(loadedFile, {
    header: true,
    worker: true,
    complete: function (results) {
        // console.log(results);
        data = results.data;
        // console.log(data.length);

        tempTimeseries("Q01");
    },
    error: function (err) {
        console.log(err);
    }
});

// Processes data to create timeseries chart for temperature
// Returns array of x,y coordinates for plotting
function tempTimeseries(quantifier) {
    // Subset data to specific quantifier
    var subset = [];
    for (var i = 0; i < data.length; i++) {
        if (data[i].name == quantifier) {
            subset.push(data[i]);
        }
    }

    // Process subset to create timeseries chart
    var startTime = subset[0].timestamp;
    var endTime = subset[subset.length - 1].timestamp;
    var totalX = (endTime - startTime) / 1000 / 60 / 30;

    // Calculate time from start in seconds and minutes
    for (var i = 0; i < subset.length; i++) {
        subset[i].timeElapsed = (subset[i].timestamp - startTime) / 1000;
        subset[i].timeElapsedMin = subset[i].timeElapsed / 60;
        subset[i].timeElapsed30 = Math.round(subset[i].timeElapsedMin / 30);
    }
    // Create array of standardized 30 minute times and average data points with the same 30 minute points
    var timeseries = [];
    for (var i = 0; i < totalX; i++) {
        timeseries.push({ x: i, y: null });
    }
    for (var i = 0; i < subset.length; i++) {
        for (var j = 0; j < totalX; j++) {
            if (subset[i].timeElapsed30 == timeseries[j].x &&
                timeseries[j].y == null) {
                timeseries[j].y = subset[i].tcm_temp;
            }
        }
    }

    console.log(timeseries);
    return timeseries;
}
// http.createServer(function (req, res) {
//     res.writeHead(200, { 'Content-Type': 'application/json' });
//     res.write(JSON.stringify(data));
//     res.end();
// }).listen(8080);

// GoogleMap image with clickable location
// Click quantifier and show all datas
// AWS for hosting
// Host on git for now
// S3 buckets for aws