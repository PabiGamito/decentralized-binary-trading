window.addEventListener('load', function() {
  // Checking if Web3 has been injected by the browser (Mist/MetaMask)
  if (typeof web3 !== 'undefined') {
    // Use Mist/MetaMask's provider
    web3 = new Web3(web3.currentProvider);
  } else {
    alert('No web3? You should consider trying MetaMask!');
    // fallback - use your fallback strategy (local node / hosted node + in-dapp id mgmt / fail)
    web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
  }
  if(!web3.isConnected()) {
   alert("Couldn't connect to a node...");
  }

  var account = web3.eth.accounts[0];
  web3.eth.defaultAccount = web3.eth.accounts[0];
  // console.log(web3.version.ethereum);
  // console.log(web3.version.network);

  // Listens for Selected Account Changes
  var accountInterval = setInterval(function() {
    if (web3.eth.accounts[0] !== account) {
      account = web3.eth.accounts[0];
      web3.eth.defaultAccount = web3.eth.accounts[0];
      updateInterface();
    }
  }, 100);

  var balance = null;
  function updateBalance() {
    web3.eth.getBalance( account, function(error, result) {
      if (!error) {
        updateBalanceCallback(result);
      } else {
        updateBalance();
      }
    });
  }
  updateBalance();

  function updateBalanceCallback(result) {
    var balanceWei = result.toNumber();
    balance = parseFloat(web3.fromWei(balanceWei, 'ether'));
    app.balance = balance.toFixed(3);
  }

  var network = null;
  function connectedNetwork() {
    web3.eth.getBlock(0, function (error, result) {
      if (result.hash === "0xd4e56740f876aef8c010b86a40d5f56745a118d0906a34e69aec8c0db1cb8fa3") {
        // TODO: Check whether it is ETC or ETH
        network = "mainnet";
      } else if (result.hash === "0x0cd786a2425d16f152c658316c423e6ce1181e15c3295826d7c9904cba9ce303") {
        network = "testnet";
      } else {
        network = "private";
      }
    });
  }

  var abi = [{"constant":false,"inputs":[{"name":"newPrice","type":"string"}],"name":"updatePrice","outputs":[],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"myid","type":"bytes32"},{"name":"result","type":"string"},{"name":"proof","type":"bytes"}],"name":"__callback","outputs":[],"payable":false,"type":"function"},{"constant":false,"inputs":[],"name":"getPairPrice","outputs":[],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"ethusd","outputs":[{"name":"","type":"string"}],"payable":false,"type":"function"},{"inputs":[],"payable":false,"type":"constructor"},{"payable":true,"type":"fallback"}];

  var binarytradingContract = web3.eth.contract(abi).at("0x2831899bAa68F655764d17e7a65c8E526E4ac53C");

  var ethusd = binarytradingContract.ethusd.call(function(error, result) {
    console.log(result);
  });

  function getPairPrice() {
    binarytradingContract.getPairPrice(function(error, result) {
      console.log(result);
    });
  }
  getPairPrice();

  function brokerDeposit(amount) {
    binarytradingContract.brokerDeposit.sendTransaction({from: web3.eth.coinbase, value:web3.toWei(amount,'ether')}, function(error, result) {
      console.log(result);
    });
  }

  function userDeposit(amount) {
    binarytradingContract.deposit.sendTransaction({from: web3.eth.coinbase, value:web3.toWei(amount,'ether')}, function(error, result) {
      console.log(result);
    });
  }

  function callRequest(amount, expireIn) {
    binarytradingContract.externalCallRequest.sendTransaction(expireIn, {from: web3.eth.coinbase, value:web3.toWei(amount,'ether')}, function(error, result) {
      console.log(result);
    });
  }

  // callRequest(1, 500);

  function putRequest() {
    binarytradingContract.externalPutRequest.sendTransaction({from: web3.eth.coinbase, value:web3.toWei(amount,'ether')}, function(error, result) {
      // console.log(result);
    });
  }




  // watch for an event
  // var myEvent = myContractInstance.MyEvent({some: 'args'}, additionalFilterObject);
  // myEvent.watch(function(error, result){
  //    ...
  // });
  //
  // // would get all past logs again.
  // var myResults = myEvent.get();

});
