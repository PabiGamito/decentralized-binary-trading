// GET HISTORICAL DATA FROM cryptocompare
limit = 24;
dataSet = "histohour";
timeFrame = "day";
app.getHistoricalData("btc_cny_btcc", "BTCCHINA", "BTC", "CNY", limit, dataSet, timeFrame);
app.getHistoricalData("btc_cny_okcoin", "OKCOIN", "BTC", "CNY", limit, dataSet, timeFrame);
app.getHistoricalData("btc_cny_huobi", "HUOBI", "BTC", "CNY", limit, dataSet, timeFrame);
app.getHistoricalData("btc_usd_bitfinex", "BITFINEX", "BTC", "USD", limit, dataSet, timeFrame);
app.getHistoricalData("btc_eur_kraken", "KRAKEN", "BTC", "EUR", limit, dataSet, timeFrame);
app.getHistoricalData("eth_btc_poloniex", "POLONIEX", "ETH", "BTC", limit, dataSet, timeFrame);

function updatePrice(pair_id, price) {
  app.pairs[pair_id].price = price;
}

// BTCCHINA //
var socket = io ('https://websocket.btcc.com/');
socket.emit('subscribe', 'marketdata_cnybtc');
socket.on('ticker', function (data) { updatePrice("btc_cny_btcc", parseFloat(data.ticker.last)); });

// OKCOIN //
// TODO: Figure out how to get it to work without API key

// POLONIEX //
var connection = new autobahn.Connection({url: 'wss://api.poloniex.com', realm: 'poloniex'});
connection.onopen = function (session) {
   // subscribe to a topic
   session.subscribe('ticker', onevent);
   // what to do when it received trade update data
   function onevent(args) {
     if (args[0] === "BTC_ETH") {
       updatePrice("eth_btc_poloniex", parseFloat(args[1]));
     }
   }
};
connection.open();
