var app = new Vue({
  el: '#app',
  data: {
    activeNav: 'buy-options',
    activeTimeFrame: '1-day',
    currentView: 'btc_cny',
    balance: 0,
    activePair: 'btc_cny',
    pairs: {
      btc_cny: {
        price: 5680,
        change: 5
      },
      eth_btc: {
        price: 9.8
      }
    }
  },
  components: {
    content: {}
  },
  methods: {
		makeActiveNav: function(item) {
			this.activeNav = item;
      $("nav#menu ul li.active").removeClass("active");
      $("nav#menu ul li." + item).addClass("active");
		},
    makeActivePair: function(pair) {
      this.activePair = pair;
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
