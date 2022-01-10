// Set Dimensions
const xSize = document.getElementById("myPlot").getBoundingClientRect().width;
const ySize = document.getElementById("myPlot").getBoundingClientRect().height;
const margin = 40;
// const xMax = xSize - margin*2;
// const yMax = ySize - margin*2;

// Processes data to create timeseries chart for temperature
// Returns array of x,y coordinates for plotting
function tempTimeseries(quantifier) {
  // Subset data to specific quantifier
  var subset = [];
  for (var i = 0; i < rawData.length; i++) {
    if (rawData[i].name == quantifier) {
      subset.push(rawData[i]);
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

var fileIn = document.getElementById("file-input");
var fileContents;
fileIn.onchange = e => {
  var file = e.target.files[0];

  var reader = new FileReader();
  reader.readAsText(file, "UTF-8");

  reader.onload = readerEvent => {
    fileContents = readerEvent.target.result;
    console.log("File Loaded");
    // console.log(fileContents);
  }
}

var datapoints;
var rawData;
function parseFile() {
  Papa.parse(fileContents, {
    header: true,
    before: function (file, inputElem) {
      console.log("Parsing file...", file);
    },
    error: function (err, file) {
      console.log("ERROR:", err, file);
    },
    complete: function (results) {
      console.log("Done with all files");
      console.log(results.data);
      rawData = results.data;
      datapoints = tempTimeseries("Q01");
      convertPoints();
      draw();
    }
  });
}

// Function to convert the x, y coordinates into coordinates sized for the browser window
var xMin, xMax, yMin, yMax;
var data = [];
function convertPoints() {
  // Determine range of x and y axes
  xMin = 0;
  xMax = datapoints[datapoints.length - 1].x;
  yMin = Number.MAX_SAFE_INTEGER;
  yMax = Number.MIN_SAFE_INTEGER;
  for (var i = 0; i < datapoints.length; i++) {
    if (datapoints[i].y == null) {
      // console.log(i);
    } else if (parseFloat(datapoints[i].y) < yMin) {
      yMin = datapoints[i].y;
    } else if (parseFloat(datapoints[i].y) > yMax) {
      yMax = datapoints[i].y;
    }
  }
  console.log(ySize);

  // Transform points to fit on svg
  data.push({x: datapoints[0].x / (xMax - xMin) * (xSize - 2 * margin), y: datapoints[0].y / (yMax - yMin) * (ySize - 2 * margin)})
 for (var i = 1; i < datapoints.length; i++) {
    var xPoint = datapoints[i].x / (xMax - xMin) * (xSize - 2 * margin);
    var yPoint = datapoints[i].y / (yMax - yMin) * (ySize - 2 * margin);

    data.push({ x: xPoint, y: yPoint, x0: data[data.length - 1].x, y0: data[data.length - 1].y});
  }
  console.log("Range: x: {" + xMin + ", " + xMax + "}; y: {" + yMin + ", " + yMax + "}");
  console.log(data);
}

// const numPoints = 100;
// const data = [];
// for (let i = 0; i < numPoints; i++) {
//   data.push([Math.random() * xMax, Math.random() * yMax]);
// }

// Draw points onto SVG
function draw() {
  // Append SVG Object to the Page
  const svg = d3.select("#myPlot")
    .append("svg")
    .append("g")
    .attr("transform", "translate(" + margin + "," + margin + ")");

  // Y Axis
  const y = d3.scaleLinear()
    .domain([yMin, yMax])
    .range([ySize - margin * 2, 0]);

  svg.append("g")
    .call(d3.axisLeft(y));

  // X Axis
  const x = d3.scaleLinear()
    .domain([xMin, xMax])
    .range([0, xSize - margin * 2]);

  svg.append("g")
    .attr("transform", "translate(0," + y(0) + ")")
    .call(d3.axisBottom(x));

  // Dots
  svg.append('g')
    .selectAll("dot")
    .data(data).enter()
    .append("circle")
    .attr("cx", function (d) { return d.x })
    .attr("cy", function (d) { return -d.y })
    .attr("transform", "translate(0," + y(0) + ")")
    .attr("r", 2)
    .style("fill", "Blue");

  // Lines
  svg.append('g')
    .selectAll("line")
    .data(data).enter()
    .append("line")
    .attr("x1", function (d) { return d.x })
    .attr("y1", function (d) { return -d.y })
    .attr("x2", function (d) { return d.x0 })
    .attr("y2", function (d) { return -d.y0 })
    .attr("transform", "translate(0," + y(0) + ")")
    .attr("linewidth", 2)
    .style("stroke", "Blue");
}
