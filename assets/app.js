var app = new Vue({
  el: '#app',
  data: {
    activeNav: 'buy-options',
    activeTimeFrame: '1-day',
    balance: 0,
    searchString: "",
    activePair: 'btc_cny_okcoin',
    pairs: {
      btc_cny_okcoin: {
        id: "btc_cny_okcoin",
        name: "BTC/CNY",
        exchange: "okcoin",
        price: 5680,
        change: 5
      },
      eth_btc_poloniex: {
        id: "eth_btc_poloniex",
        name: "ETH/BTC",
        exchange: "poloniex",
        price: 9.8,
        change: -2
      }
    }
  },
  computed: {
    // A computed property that holds only those articles that match the searchString.
    filteredPairs: function () {
      var pairs = this.pairs,
        searchString = this.searchString;

      if(!searchString){
        return pairs;
      }

      searchString = searchString.trim().toLowerCase();

      pairs = pairs.filter(function(item) {
        if(item.title.toLowerCase().indexOf(searchString) !== -1){
            return item;
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
