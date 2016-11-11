// Defines c as the canvas object
var c = document.getElementById('sparkline');
var ctx = c.getContext("2d");
var margin = 10;
var priceData = [];
var frame = 0;
var animating = false;
var latestPricePointDate = null;
var firstPricePointDate = null;

resizeCanvas();
window.addEventListener('resize', resizeCanvas, false);
function resizeCanvas() {
  c.width = window.innerWidth;
  c.height = window.innerHeight / 2;
}

var currentMousePos = { x: -1, y: -1 };
$("canvas").mousemove(function(e) {
  currentMousePos.x = e.offsetX;
  currentMousePos.y = e.offsetY;
  ctx.clearRect(0, 0, c.width, c.height);
  renderCanvas();
  renderPointer(e.offsetX, e.offsetY);
});

function updatePriceData(period, dataPoints) {
  updateBTC_ETHPrice(period, dataPoints);
}

updatePriceData(300, 50);

// BTC TO USD //
function updateCNY_BTCPrice(period, dataPoints) {
  $.ajax({
    dataType: "json",
    url: "https://data.btcchina.com/data/trades"
  }).done(function (data) {
    var foundDataPoints = 0;
    var unixPeriod = parseInt(data[data.length - 1].date/period);
    console.log(unixPeriod);
    for (i = data.length - 1; i >= 0; i--) {
      if (parseInt(data[i].date/period) !== unixPeriod) {
        unixPeriod = parseInt(data[i].date/period);
        console.log(data[i].price);
        foundDataPoints += 1;
      }
      if (foundDataPoints >= dataPoints) {
        break;
      }
    }
  });
}
updateCNY_BTCPrice(300, 15);

var socket = io ('https://websocket.btcc.com/');
socket.emit('subscribe', 'marketdata_cnybtc');
// socket.on('ticker', function (data) { console.log(data.ticker.last); });

// ETH TO BTC //
function updateBTC_ETHPrice(period, dataPoints) {
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
    priceData = [];
    for (i = 0; i < data.length; i++) {
      priceData.push(data[i].close);
    }
    var latestPricePoint = data[data.length - 1];
    latestPricePointDate = latestPricePoint.date;
    firstPricePointDate = data[0].date;
    var updateInSeconds = latestPricePointDate + period - Math.floor(Date.now() / 1000);
    if (updateInSeconds < 0) updateInSeconds = 5;
    setTimeout(function() {
      updatePriceData(period, dataPoints);
    }, updateInSeconds * 1000);
    if (!animating) {
      $("#live-price").text((latestPricePoint.close * 1000).toFixed(3));
      animate();
      renderCanvas();
    }
  });
}

var connection = new autobahn.Connection({url: 'wss://api.poloniex.com', realm: 'realm1'});
connection.onopen = function (session) {
   // subscribe to a topic
   session.subscribe('ticker', onevent);
   // what to do when it received trade update data
   function onevent(args) {
     if (args[0] === "BTC_ETH") {
       // TODO: Take this price and update it in the chart live
       var lastPrice = args[1];
       $("#live-price").text((lastPrice * 1000).toFixed(3));
       priceData[priceData.length - 1] = lastPrice;
     }
   }
};
connection.open();

// Functions to get the max and min value of an array
function maxVal(array) {
	return Math.max.apply(Math, array);
}
function minVal(array) {
	return Math.min.apply(Math, array);
}

function animate(){
  animating = true;
  setTimeout(function() {
    requestAnimationFrame(animate);
  }, 500);
  ctx.clearRect(0, 0, c.width, c.height);
  renderCanvas();
  frame++;
}

// Function that draws the graph
function renderCanvas() {
  var timeNow = new Date();
  var sparkLineBeginTime = new Date(firstPricePointDate*1000).getTime();
  var sparkLineEndTime = new Date(latestPricePointDate*1000).getTime();
  var nextHour = timeNow.getHours()+1;
  var endOptionTime = new Date(timeNow.getFullYear(), timeNow.getMonth(), timeNow.getDate(), nextHour, 0, 0).getTime();
  var secondsTillExpiration = (endOptionTime-timeNow.getTime());
  var sparkLineTime = sparkLineEndTime - sparkLineBeginTime;
  var graphTime = secondsTillExpiration + sparkLineTime;

  sparkLineWidth = ( (c.width-margin*2-50) * sparkLineTime ) / graphTime;

  renderSparkLine(sparkLineWidth); // rendersSparkLine and returns SparkLine end Coordinates
  renderOptionExpirationLine(c.width - margin - 50);
  if ( $('canvas').is(":hover") ) {
    renderPointer(currentMousePos.x, currentMousePos.y);
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

function setGradiantColor(width = c.width) {
  // Define the line color gradiant
	var grad = ctx.createLinearGradient(0, 0, c.width, c.height);
	grad.addColorStop(0, "#007AC9");  // Initial path colour
	grad.addColorStop(1, "#00c972");  // End stroke colour
	ctx.strokeStyle = grad;
	ctx.fillStyle = grad;
}

function renderSparkLine(width) {
  renderPriceLabels(minVal(priceData)*1000, maxVal(priceData)*1000);

  var spark = priceToSparkData(priceData);
  var ratioW = ( width - margin*2 ) / spark.length;
	var ratioH = ( c.height - margin*2 ) / maxVal(spark);

	var x = 0;
	var y = 0;

  setGradiantColor(width);
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

  // Renders blinking dot
  if (frame % 2 === 0) {
    renderDot(x, y);
  }
}

function renderDot(x, y) {
  ctx.beginPath();
  ctx.arc(x, y, 8, 0, 2 * Math.PI);
	setGradiantColor();
  ctx.fill();
  ctx.stroke();
}

function renderPriceLabels(minPrice, maxPrice) {
  var totalPriceLabels = 5;
  var priceInterval = (maxPrice-minPrice)/totalPriceLabels;
  var price = minPrice;
  for(i = 0; i<totalPriceLabels; i++) {
    ctx.font = "bold 16px Arial";
    var y = c.height-margin-i*((c.height-(2*margin))/totalPriceLabels);
    ctx.fillText(price.toFixed(3), c.width-50, y);
    renderHorizontalLine(y, "#E9E9E9", 1);
    price += priceInterval;
  }
}

function renderHorizontalLine(y, color, width) {
  ctx.beginPath();
  ctx.moveTo(0, y);
  ctx.lineTo(c.width, y);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
}

function renderVerticalLine(x, color, width) {
  ctx.beginPath();
  ctx.moveTo(x, 0);
  ctx.lineTo(x, c.height);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
}

function renderPointer(x, y) {
  renderHorizontalLine(y, "#E9E9E9", 1);
  renderVerticalLine(x, "#E9E9E9", 1);
  renderPointerPrice(y, minVal(priceData)*1000, maxVal(priceData)*1000);
}

function renderPointerPrice(y, minPrice, maxPrice) {
  ctx.font = "bold 16px Arial";
  price = ( (maxPrice-minPrice)*(c.height-y-margin) ) / (c.height-2*margin) + minPrice;
  ctx.fillText(price.toFixed(3), c.width-50, y);
}

function renderTimeLabels() {

}

function renderOptionExpirationLine(x) {
  ctx.beginPath();
  ctx.moveTo(x, 0);
  ctx.lineTo(x, c.height);
  ctx.strokeStyle = "red";
  ctx.lineWidth = "3";
  ctx.stroke();
}
