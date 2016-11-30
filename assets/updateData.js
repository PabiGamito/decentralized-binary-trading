function updatePrice(pair_id, price) {
  app.pairs[pair_id].price = price;
}

// ****** //
// OKCOIN //
// ****** //

// BTC TO CNY //
var socket = io ('https://websocket.btcc.com/');
socket.emit('subscribe', 'marketdata_cnybtc');
socket.on('ticker', function (data) { updatePrice("btc_cny_okcoin", data.ticker.last); });


// ******** //
// POLONIEX //
// ******** //

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
       var lastPrice = parseFloat(args[1]);
       updatePrice( "eth_btc_poloniex", lastPrice );
       priceData[priceData.length - 1] = lastPrice;
     }
   }
};
connection.open();
