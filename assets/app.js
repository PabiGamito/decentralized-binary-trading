// TODO: Save all app data into IndexedDB to load faster
var historicalDataHash = {
  day: [],
  week: [],
  month: [],
  month3: [],
  month6: [],
  year: []
};

function pairHash(fsym, tsym, exchange) {
  return jQuery.extend(true, {}, {
    id: fsym + "_" + tsym + "_" + exchange,
    fsym: fsym,
    tsym: tsym,
    exchange: exchange,
    price: 0,
    change: 0,
    changePercent: 0,
    historicalData: closeHash(historicalDataHash)
  });
}
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
    activePair: "btc_cny_btcchina",
    pairs: {
      // NOTE: Pair naming must respect this naming convention to work: fsym_tsym_exchange
      btc_cny_btcchina: pairHash("btc", "cny", "btcchina"),
      btc_cny_okcoin: pairHash("btc", "cny", "okcoin"),
      btc_cny_huobi: pairHash("btc", "cny", "huobi"),
      // btc_usd_bitmex: pairHash("btc", "usd", "bitmex"),
      btc_usd_bitfinex: pairHash("btc", "usd", "bitfinex"),
      btc_eur_kraken: pairHash("btc", "eur", "kraken"),
      eth_btc_poloniex: pairHash("eth", "btc", "poloniex"),
      eth_btc_kraken: pairHash("eth", "btc", "kraken"),
      ltc_usd_okcoin: pairHash("ltc", "usd", "okcoin"),
      xrp_btc_poloniex: pairHash("xrp", "btc", "poloniex"),
      xmr_btc_poloniex: pairHash("xmr", "btc", "poloniex")
    },
    pairsSearchData: [
      // To be used and filled by filterPairs function
    ]
  },
  computed: {
    // A computed property that holds only those articles that match the searchString.
    filteredPairs: function () {
      var pairsSearchData = this.pairsSearchData,
        searchString = this.searchString;

      if(!pairsSearchData.length) {
        var keys = Object.keys(this.pairs);
        for(var i in keys) {
            var pair = this.pairs[keys[i]];
            pairsSearchData.push({
              id: pair.id,
              keyWords: [pair.fsym, pair.tsym, pair.exchange]
            });
        }
      }

      if(!searchString){
        return pairsSearchData;
      }

      searchString = searchString.trim().toLowerCase();
      var searchArray = searchString.split(" ");

      pairsSearchData = pairsSearchData.filter( function(pair) {
        var match = true;
        for (i = 0; i < searchArray.length; i++) {
          if (pair.keyWords.join().toLowerCase().indexOf(searchArray[i]) === -1) {
              match = false;
          }
        }
        if (match) {
          return pair;
        }
      });

      // Return an array with the filtered data.
      return pairsSearchData;
    }
  },
  methods: {
    initialize: function() {
      if (!this.activePair) {
        this.makeActivePair(this.pairs[0].id);
      }
      $("#menu-open-bar ul li.pair").first().addClass("active");

      var limit = 24;
        dataSet = "histohour";
        timeFrame = "day";
      var keys = Object.keys(this.pairs);
      for(var i in keys) {
          var pair = this.pairs[keys[i]];
          this.getHistoricalData(pair.id, pair.exchange, pair.fsym, pair.tsym, limit, dataSet, timeFrame);
      }
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
          case "month6":
            dataSet = "histoday";
            limit = 30*6;
            break;
          case "year":
            dataSet = "histoday";
            limit = 365;
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
