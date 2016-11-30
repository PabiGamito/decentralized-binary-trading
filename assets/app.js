// TODO: Save all app data into IndexedDB to load faster

var app = new Vue({
  el: '#app',
  data: {
    activeNav: 'buy-options',
    activeTimeFrame: '1-day',
    balance: 0,
    searchString: "",
    activePair: 'btc_cny_okcoin',
    pairs: {
      btc_cny_btcc: {
        id: "btc_cny_btcc",
        name: "BTC/CNY",
        exchange: "btcchina",
        price: 0,
        change: 0,
        historicalPrices: []
      },
      btc_cny_okcoin: {
        id: "btc_cny_okcoin",
        name: "BTC/CNY",
        exchange: "okcoin",
        price: 0,
        change: 0,
        historicalPrices: []
      },
      btc_cny_huobi: {
        id: "btc_cny_huobi",
        name: "BTC/CNY",
        exchange: "huobi",
        price: 0,
        change: 0,
        historicalPrices: []
      },
      btc_usd_bitfinex: {
        id: "btc_usd_bitfinex",
        name: "BTC/USD",
        exchange: "bitfinex",
        price: 0,
        change: 0,
        historicalPrices: []
      },
      btc_eur_kraken: {
        id: "btc_eur_kraken",
        name: "BTC/EUR",
        exchange: "kraken",
        price: 0,
        change: 0,
        historicalPrices: []
      },
      eth_btc_poloniex: {
        id: "eth_btc_poloniex",
        name: "ETH/BTC",
        exchange: "poloniex",
        price: 0,
        change: 0,
        historicalPrices: []
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

      pairs = pairs.filter( function(pair) {
        if (pair.key_words.toLowerCase().indexOf(searchString) !== -1) {
            return pair;
        }
      });

      // Return an array with the filtered data.
      return pairs;
    }
  },
  methods: {
    initialize: function() {
      $("#menu-open-bar ul li.pair").first().addClass("active");
    },
		makeActiveNav: function(item) {
			this.activeNav = item;
      $("nav#menu ul li.active").removeClass("active");
      $("nav#menu ul li." + item).addClass("active");
		},
    makeActivePair: function(pair) {
      this.activePair = pair;
      console.log(pair);
      $("#menu-open-bar ul li.pair.active").removeClass("active");
      $("#menu-open-bar ul li.pair." + pair).addClass("active");
    },
    makeActiveTimeFrame: function(timeFrame) {
      this.activeTimeFrame = timeFrame;
      $("#content nav.time-frame-menu ul li.active").removeClass("active");
      $("#content nav.time-frame-menu ul li." + timeFrame).addClass("active");
    }
	}
});

app.initialize();
