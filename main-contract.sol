pragma solidity ^0.4.3;
import "github.com/oraclize/ethereum-api/oraclizeAPI.sol";

contract BinaryTrading is usingOraclize {
  address minter;

  /* Exchange Price Variables */
  uint public ETHUSD;
  /*
  uint public ETHBTC;
  uint public BTCUSD;
  uint
  */

  /* Mapping is used to make sure that requests are not processed twice */
  mapping(bytes32=>bool) myidList;

  /* This function called upon contract creation */
  function BinaryTrading() {
    oraclize_setProof(proofType_TLSNotary | proofStorage_IPFS);
    update(0);
  }



  /* This function is called when the get request results are ready  */
  function __callback(bytes32 myid, string result, bytes proof) {
    if (msg.sender != oraclize_cbAddress()) throw;
    if (myidList[myid] == true) throw; // check if this myid was already processed before
    myidList[myid] = true; // mark this myid (default bool value is false)

    ETHUSD = parseInt(result, 2); // save it as $ cents
    // do something with ETHUSD
    update(60); // Update data in 60 seconds
  }

  function update(uint delay){
    // Costs $0.01 for URL call + $0.04 for TLSNotary = $0.05 per update, so it is important to only update when someone bets
    oraclize_query(delay, "URL",
      "json(https://min-api.cryptocompare.com/data/price?fsym=ETH&tsyms=USD).USD");
  }
}
