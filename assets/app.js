// TODO: Save all app data into IndexedDB to load faster
var historicalDataHash = {
  day: [],
  week: [],
  month: [],
  year: []
};

function closeHash(hash) {
  return jQuery.extend(true, {}, hash);
}

var app = new Vue({
  el: '#app',
  data: {
    activeNav: 'buy-options',
    activeTimeFrame: 'day',
    balance: 0,
    searchString: "",
    activePair: "btc_cny_btcc",
    pairs: {
      btc_cny_btcc: {
        id: "btc_cny_btcc",
        fsym: "BTC",
        tsym: "CNY",
        exchange: "btcchina",
        price: 0,
        change: 0,
        changePercent: 0,
        historicalData: closeHash(historicalDataHash)
      },
      btc_cny_okcoin: {
        id: "btc_cny_okcoin",
        fsym: "BTC",
        tsym: "CNY",
        exchange: "okcoin",
        price: 0,
        change: 0,
        changePercent: 0,
        historicalData: closeHash(historicalDataHash)
      },
      btc_cny_huobi: {
        id: "btc_cny_huobi",
        fsym: "BTC",
        tsym: "CNY",
        exchange: "huobi",
        price: 0,
        change: 0,
        changePercent: 0,
        historicalData: closeHash(historicalDataHash)
      },
      btc_usd_bitfinex: {
        id: "btc_usd_bitfinex",
        fsym: "BTC",
        tsym: "USD",
        exchange: "bitfinex",
        price: 0,
        change: 0,
        changePercent: 0,
        historicalData: closeHash(historicalDataHash)
      },
      btc_eur_kraken: {
        id: "btc_eur_kraken",
        fsym: "BTC",
        tsym: "EUR",
        exchange: "kraken",
        price: 0,
        change: 0,
        changePercent: 0,
        historicalData: closeHash(historicalDataHash)
      },
      eth_btc_poloniex: {
        id: "eth_btc_poloniex",
        fsym: "ETH",
        tsym: "BTC",
        exchange: "poloniex",
        price: 0,
        change: 0,
        changePercent: 0,
        historicalData: closeHash(historicalDataHash)
      }
    },
    pairsSearchData: [
      {
        id: "btc_cny_btcc",
        key_words: "btc, cny, btcchina, bitcoin, chinese yuan"
      },{
        id: "btc_cny_okcoin",
        key_words: "btc, cny, okcoin, bitcoin, chinese yuan"
      },{
        id: "btc_cny_huobi",
        key_words: "btc, cny, huobi, bitcoin, chinese yuan"
      },{
        id: "btc_usd_bitfinex",
        key_words: "btc, usd, bitfinex, bitcoin, us dollar"
      },{
        id: "btc_eur_kraken",
        key_words: "btc, eur, kraken, bitcoin, euro"
      },{
        id: "eth_btc_poloniex",
        key_words: "eth, btc, poloniex, ether, bitcoin"
      }
    ]
  },
  computed: {
    // A computed property that holds only those articles that match the searchString.
    filteredPairs: function () {
      var pairs = this.pairsSearchData,
        searchString = this.searchString;

      if(!searchString){
        return pairs;
      }

      searchString = searchString.trim().toLowerCase();
      var searchArray = searchString.split(" ");

      pairs = pairs.filter( function(pair) {
        var match = true;
        for (i = 0; i < searchArray.length; i++) {
          if (pair.key_words.toLowerCase().indexOf(searchArray[i]) === -1) {
              match = false;
          }
        }
        if (match) {
          return pair;
        }
      });

      // Return an array with the filtered data.
      return pairs;
    }
  },
  methods: {
    initialize: function() {
      if (!this.activePair) {
        this.makeActivePair(this.pairs[0].id);
      }
      $("#menu-open-bar ul li.pair").first().addClass("active");
    },
		makeActiveNav: function(item) {
			this.activeNav = item;
      $("nav#menu ul li.active").removeClass("active");
      $("nav#menu ul li." + item).addClass("active");
		},
    makeActivePair: function(pairId) {
      this.activePair = pairId;
      $("#menu-open-bar ul li.pair.active").removeClass("active");
      $("#menu-open-bar ul li.pair." + pairId).addClass("active");
      this.updateChartPriceData(pairId);
    },
    makeActiveTimeFrame: function(timeFrame) {
      this.activeTimeFrame = timeFrame;
      $("#content nav.time-frame-menu ul li.active").removeClass("active");
      $("#content nav.time-frame-menu ul li." + timeFrame).addClass("active");
      this.updateChartPriceData(this.activePair);
    },
    updateChartPriceData: function(pairId) {
      pair = this.pairs[pairId];
      if (!pair.historicalData[this.activeTimeFrame].length) {
        var dataSet = null;
        var limit = null;
        switch (this.activeTimeFrame) {
          case "day":
            dataSet = "histohour";
            limit = 24;
            break;
          case "week":
            dataSet = "histohour";
            limit = 24*7;
            break;
          case "month":
            dataSet = "histoday";
            limit = 30;
            break;
          case "month3":
            dataSet = "histoday";
            limit = 30*3;
            break;
        }
        this.getHistoricalData(pairId, pair.exchange, pair.fsym, pair.tsym, limit, dataSet, this.activeTimeFrame);
      } else {
        var data = this.pairs[pairId].historicalData[this.activeTimeFrame];
        priceData = [];
        for(i=0; i < data.length; i++) {
          priceData.push(data[i].close);
        }
        latestPricePointDate = data[0].time;
        firstPricePointDate = data[data.length-1].time;
        if (!animating) {
          animate();
        }
        ctx.clearRect(0, 0, c.width, c.height);
        renderCanvas();
        renderCanvas();
      }
    },
    getHistoricalData: function(pairId, exchange, fsym, tsym, limit, dataSet, timeFrame) {
      $.get({
        url: "https://www.cryptocompare.com/api/data/" + dataSet + "/",
        data: {
          e: exchange, // the exchange, CCCAGG = all exchanges avg
          fsym: fsym,
          tsym: tsym,
          limit: limit
        }
      }).done(function(data) {
        if (data.Response === "Success") {
          data = data.Data;
          app.pairs[pairId].price = data[data.length-1].close;
          app.pairs[pairId].historicalData[timeFrame] = data;
          if (timeFrame === "day") {
            app.pairs[pairId].change = (data[data.length-1].close * 1000000000 - data[0].open * 1000000000) / 1000000000;
            app.pairs[pairId].changePercent = ((data[data.length-1].close - data[0].open) / data[0].open) * 100;
          }
          app.updateChartPriceData(pairId);
        } else {
          setTimeout(function () {
            app.getHistoricalData(pairId, exchange, fsym, tsym, limit, dataSet, timeFrame);
          }, 1000);
        }
      });
    }
	}
});

app.initialize();
