
/*
 * Used dataset:
 * _____________
 *
 * Link: http://statline.cbs.nl/Statweb/publication/?DM=SLNL&PA=37296ned&D1=0-2,8-13,19-21,25-35,52-56,68&D2=0,10,20,30,40,50,60,64-65&HDR=G1&STB=T&VW=T
 * Title: Bevolking; kerncijfers
 * Date published: 22-02-2017
 */

/*
 * Barchart used from: https://bl.ocks.org/mbostock/3885304
 * Tooltip used from: https://bl.ocks.org/sarubenfeld/56dc691df199b4055d90e66b9d5fc0d2
 */

// Select the SVG element:
var svg = d3.select('svg');

// Define the margins:
var margin = {
	top: 100, 
	right: 72, 
	bottom: 50, 
	left: 100
};

// Define the axes:
var x = d3.scaleBand().padding(0.2);
var y = d3.scaleLinear();

// Create a variable for the appended group in the SVG:
var g = svg
  .append('g')
  .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

// Load in the dirty data file:
d3.text('data.txt')
	.get(onload);

function onload(err, doc) {
	// If an error occured, give the error back:
	if (err) throw err;

	/*
	 * Cleaning the dirty data file
	 */

	// Select the start of the data:
	var header = doc.indexOf('BEGIN DATA');
	var end = doc.indexOf('\n', header);

	// Slice off the header of the data file:
	doc = doc.slice(end).trim();

	// Select the end of the data:
	var footer = doc.indexOf('END DATA.');

	// Slice off the information below the data:
	doc = doc.substring(0, footer).trim();

	// Remove all the whitespace, enters and periods from the data and separate the columns with a comma (,):
	doc = doc.replace(/ \n/g, '')
	doc = doc.replace(/ +/g, ',');
	doc = doc.replace(/\./g, '');

	// Format the data file into a CSV format using the map function:
	var data = d3.csvParseRows(doc, map);

	// Function that returns the needed data into a structured format (key: value):
	function map(d) {
    return {
      year: Number(d[0].slice(0, 4)),
      populationTotal: Number(d[1]),
      population: Number(d[5])
    }
  }

  /*
   * Creating the chart
   */

  // Set the domains:
  x.domain(data.map(year));
  y.domain([0, d3.max(data, population)]);

  //Add a group for the x axis:
  var xAxis = g
    .append('g')
    .attr('class', 'axis axis-x');

  // Add a group for the y axis:
  var yAxis = g
    .append('g')
    .attr('class', 'axis axis-y');

  // Add bars for the data:
  var bars = g
    .selectAll('.bar')
    .data(data)
    .enter()
    .append('rect')
    .attr('class', 'bar')
    .on('mouseover', function (d) {
    	var xPosition = parseFloat(d3.select(this).attr("x")) + x.bandwidth() * 1.5;
    	var yPosition = parseFloat(d3.select(this).attr("y"));
    	console.log(yPosition);

    	d3.select("#tooltip")
    		.style("left", xPosition + "px")
    		.style("top", yPosition + "px")
    		.select("#value")
    		.text(d.population);

    	d3.select("#tooltip").classed("hidden", false);
    })
    .on('mouseout', function () {
    	d3.select("#tooltip").classed("hidden", true);
    });

  // Trigger the initial resize:
  onresize();

  // Listen to the checkbox for changes:
  d3.select('input').on('change', onchange);

  // Listen to future resizes:
  d3.select(window).on('resize', onresize);

  function onresize() {
    // Get the current dimensions:
    var width = parseInt(svg.style('width'), 10) - margin.left - margin.right;
    var height = parseInt(svg.style('height'), 10) - margin.top - margin.bottom;

    // Set the scales range:
    x.rangeRound([0, width]);
    y.rangeRound([height, 0]);

    // Size the bars:
    bars
      .attr('x', barX)
      .attr('y', barY)
      .attr('width', x.bandwidth())
      .attr('height', barHeight);

    // Render the x and y axis:
    xAxis.call(d3.axisBottom(x)).attr('transform', 'translate(0,' + height + ')');
    yAxis.call(d3.axisLeft(y).ticks(10));

    // Calculate the height for a bar:
    function barHeight(d) {
      return height - barY(d);
    }
  }

  function onchange() {
  	// Check if the sorting checkbox is checked, if true: sort on population, else sort on year:
    var sort = this.checked ? sortOnpopulation : sortOnYear;
    var x0 = x.domain(data.sort(sort).map(year)).copy();
    
    // Create a transition:
    var transition = svg.transition();

    // Initial sort:
    svg.selectAll('.bar').sort(sortBar);

    // Move the bars over the x axis:
    transition.selectAll('.bar')
      .delay(delay)
      .attr('x', barX0);

    // Move the labels on the x axis:
    transition.select('.axis-x')
      .call(d3.axisBottom(x))
      .selectAll('g')
      .delay(delay);

    // Sort the bars 
    function sortBar(a, b) {
      return x0(year(a)) - x0(year(b));
    }

    // Select all the years and return them to the transition:
    function barX0(d) {
      return x0(year(d));
    }

    // Set the delay for the transition:
    function delay(d, i) {
      return i * 50;
    }
  }

  function change() {
    d3
      .select('input')
      .property('checked', true)
      .dispatch('change');
  }

  // Calculate x for a bar:
  function barX(d) {
    return x(year(d));
  }

  // Calculate y for a bar:
  function barY(d) {
    return y(population(d));
  }
}

// Sort on population:
function sortOnpopulation(a, b) {
  return population(b) - population(a);
}

// Sort on year:
function sortOnYear(a, b) {
  return d3.ascending(year(a), year(b));
}

// Get the year field for a row:
function year(d) {
  return d.year;
}

// Get the population field for a row:
function population(d) {
  return d.population;
}
