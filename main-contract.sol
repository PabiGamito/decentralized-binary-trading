pragma solidity ^0.4.3;
import "github.com/oraclize/ethereum-api/oraclizeAPI.sol";

// TODO: Figure out how to calculate the max you can deposit so that the contract can't go bankrupt.

contract BinaryTrading is usingOraclize {
  // Used to store the contract creator's address
  address minter;

  // Mapping is used to make sure that requests are not processed twice
  mapping(bytes32=>bool) myidList;

  // Exchange Price Variable in cents
  uint public ETHUSD;

  // Struct to store users
  struct User {
    address despoitAddress;
    uint optionValue;

  }

  // This function is called upon contract creation
  function BinaryTrading() {
    minter = msg.sender;
    oraclize_setProof(proofType_TLSNotary | proofStorage_IPFS);
  }

  // This function is called when funds are sent to the contract: the fallback function
  function () payable {
    // TODO: Update with actual gas cost, tx.gasprice?
    if(msg.value < (ETHUSD * 10 + 0.05 ) * 1 ether) throw; // reverts the transfer to user if desposit is enough to cover oraclize's costs and contract execution
    // Get the exchange rate at time of transaction
    // TODO: Figure out how to get exact time of transaction
  }

  modifier onlyMinter() {
    if (msg.sender != minter) throw;
    _;
  }

  function deposit() payable returns (uint balance) {
    return this.balance;
  }

  // This function is called when the get request results are ready
  function __callback(bytes32 myid, string result, bytes proof) {
    if (msg.sender != oraclize_cbAddress()) throw;
    if (myidList[myid] == true) throw; // check if this myid was already processed before
    myidList[myid] = true; // mark this myid (default bool value is false)

    ETHUSD = parseInt(result, 2); // save it as $ cents
    // do something with ETHUSD
    updateExchangeRate(60); // Update data in 60 seconds
  }

  // This function updates all the exchange rates
  function updateExchangeRate(uint delay){
    // Costs $0.01 for URL call + $0.04 for TLSNotary = $0.05 per update, so it is important to only update when someone bets
    oraclize_query(delay, "URL",
      "json(https://min-api.cryptocompare.com/data/price?fsym=ETH&tsyms=USD).USD");
  }
}
