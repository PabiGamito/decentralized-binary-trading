// Defines c as the canvas object
var c = document.getElementById('sparkline');
var ctx = c.getContext("2d");
var priceData = [];
var latestPricePoint = null;
var frame = 0;

resizeCanvas();
window.addEventListener('resize', resizeCanvas, false);
function resizeCanvas() {
  c.width = window.innerWidth;
  c.height = window.innerHeight / 2;
}

function loadPriceData(period, dataPoints) {
  $.ajax({
    dataType: "json",
    url: "https://poloniex.com/public",
    data: {
      "command": "returnChartData",
      "currencyPair": "BTC_ETH",
      "start": Math.floor(Date.now() / 1000) - period * dataPoints,
      "end": 9999999999,
      "period": period
    }
  }).done(function (data) {
    console.log("Historical Price Data", data);
    for (i = 0; i < data.length; i++) {
      priceData.push(data[i].close);
    }
    latestPricePoint = data[data.length - 1].date;
    renderCanvas();
    animate();
  });
}
loadPriceData(300, 50);

var connection = new autobahn.Connection({url: 'wss://api.poloniex.com', realm: 'realm1'});

connection.onopen = function (session) {

   // 1) subscribe to a topic
   function onevent(args) {
     if (args[0] === "BTC_ETH") {
       // TODO: Take this price and update it in the chart live
       console.log(args[1]); //last price
     }
   }
   session.subscribe('ticker', onevent);
};

connection.open();

function updateLatestPrice() {

}

// Functions to get the max and min value of an array
function max(array) {
	return Math.max.apply(Math, array);
}
function minVal(array) {
	return Math.min.apply(Math, array);
}

function animate(){
    setTimeout(function() {
      requestAnimationFrame(animate);
    }, 500);
    ctx.clearRect(0, 0, c.width, c.height);
    renderCanvas();
    frame++;
}

// Function that draws the graph
function renderCanvas() {
  // Define the line color gradiant
	var grad = ctx.createLinearGradient(0, 0, c.width, c.height);
	grad.addColorStop(0, "#007AC9");  // Initial path colour
	grad.addColorStop(1, "#00c972");  // End stroke colour
	ctx.strokeStyle = grad;
	ctx.fillStyle = grad;

  var lineEndCoordinated = renderLines();
  if (frame % 2 === 0) {
    renderDot(lineEndCoordinated.x, lineEndCoordinated.y);
  }
}

// Converts priceData to spark data points so that the min value has y = 0
// This allows for easier calculating height ratio to scale height properly
// Otherwise it often looks like a strait line
function priceToSparkData(priceData) {
  var min = minVal(priceData);
  var spark = [];
  for (i=0; i < priceData.length; i++) {
    spark.push(priceData[i]-min);
  }
  return spark;
}

function renderLines() {
  var spark = priceToSparkData(priceData);
	var margin = 10;
	var ratioW = ( c.width - margin*2 ) / spark.length;
	var ratioH = ( c.height - margin*2 ) / max(spark);

	var x = 0;
	var y = 0;

	ctx.beginPath();
	ctx.lineWidth = "6";
	ctx.fill();
	ctx.stroke();

	for (var index in spark) {
		if (index === 0) {
			// First time
			ctx.beginPath();
			ctx.lineWidth = "6";
			ctx.moveTo(margin, c.height - ( spark[index] * ratioH + margin ) );
		} else {
			x = index * ratioW + margin;
			y = c.height - ( spark[index] * ratioH + margin );
			ctx.lineTo(x,y);
		}
	}

	ctx.stroke();

	ctx.beginPath();
	ctx.lineWidth = "6";

  var lineEndCoordinated = {"x": x, "y": y};
  return lineEndCoordinated;
}

function renderDot(x, y) {
  ctx.beginPath();
  ctx.arc(x, y, 8, 0, 2 * Math.PI);
  ctx.fill();
  ctx.stroke();
}
