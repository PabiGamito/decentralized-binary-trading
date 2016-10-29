pragma solidity ^0.4.3;
import "github.com/oraclize/ethereum-api/oraclizeAPI.sol";

// TODO: Figure out how to calculate the max you can deposit so that the contract can't go bankrupt.
// TODO: Make all function that can be private or whatever it is called so that no extrenal person can mess with them
/*public - all
private - only this contract
internal - only this contract and contracts deriving from it
external - Cannot be accessed internally, only externally.*/

contract BinaryTrading is usingOraclize {
  // Used to store the contract creator's address
  address minter;

  // Mapping is used to make sure that requests are not processed twice
  mapping(bytes32=>bool) myidList;

  // Exchange Price Variable in cents
  uint public ETHUSD;

  // Struct to store users
  /*struct User {
    address despoitAddress;
    uint balance;
  }*/

  // Maps so that user balances are easily accessible by address
  mapping (address => balance) userBalance;
  /*mapping (address => User) users;*/

  struct Bet {
    uint value;
    bool putOption; // true = Put Option : false = Call Option
  }
  mapping (address => Bet) bets;

  // This function is called upon contract creation
  function BinaryTrading() {
    minter = msg.sender;
    oraclize_setProof(proofType_TLSNotary | proofStorage_IPFS);
  }

  // This function is the fallback function
  function () payable {
    throw;
  }

  // This function can be called by a user to reinvest his funds into a selected contract without withdrawing
  function reinvest() external {
    // TODO: Make is call the function that is needed to execute a certain bet
  }

  // This function allows the user to withdraw his funds
  function withdraw() returns (uint withdrawalBalance) external {
    withdrawalBalance = users[msg.address].balance;
    if (!msg.address.send(withdrawalBalance)) throw;
  }

  /*modifier onlyMinter() {
    if (msg.sender != minter) throw;
    _;
  }*/

  function deposit() payable external returns (uint balance) external {
    return this.balance;
  }

  function internalCallRequest(address userAddress, uint betValue, uint delay) private {
    // TODO: Makes sure delay is short enough otherwise there is too much of a big advantage given to the user
    
    bets[userAddress] = Bet(betValue, false); // (uint betValue, bool putOption)
    // TODO: make oraclize query with selected delay
  }

  // This can only be called from someone outside this contract
  function call() payable external {
    // Registers new user with its balance if necessary
    // TODO: make sure !userBalance[msg.sender] does what we want it to do
    if (!userBalance[msg.sender]) {
      userBalance[msg.sender] = msg.value;
    } else {
      userBalance[msg.sender] += msg.value;
    }
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
  function updateExchangeRate(uint delay) {
    // Costs $0.01 for URL call + $0.04 for TLSNotary = $0.05 per update, so it is important to only update when someone bets
    oraclize_query(delay, "URL",
      "json(https://min-api.cryptocompare.com/data/price?fsym=ETH&tsyms=USD).USD");
  }
}
