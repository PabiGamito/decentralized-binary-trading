pragma solidity ^0.4.3;
import "github.com/oraclize/ethereum-api/oraclizeAPI.sol";

// TODO: Figure out how to calculate the max you can deposit so that the contract can't go bankrupt.
// TODO: Make all function that can be private or whatever it is called so that no extrenal person can mess with them
/*public - all
private - only this contract
internal - only this contract and contracts deriving from it
external - Cannot be accessed internally, only externally.*/

/*TODO: Make sure user can't bet more than what he has in his balance - what is in trade because right now he can*/

contract BinaryTrading is usingOraclize {
  // Used to store the contract creator's address
  address minter;

  // Mapping is used to make sure that requests are not processed twice
  mapping(bytes32 => bool) myidList;

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

  struct Bet private {
    address userAddress;
    uint value;
    bool putOption; // true = put : false = call
    uint openPositionPrice;
  }

  mapping (uint => Bet) bets;
  uint NewBetId;
  mapping (bytes32 => uint) betIdWithQueryId;

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

    // *********************** //
   // CALL POSITION FUNCTIONS //
  // *********************** //

  function internalCallRequest(address userAddress, uint betValue, uint delay) private {
    // TODO: Makes sure delay is short enough otherwise there is too much of a big advantage given to the user
    NewBetId += 1;
    bets[NewBetId] = Bet(userAddress, betValue, false, 0) // (address userAddress, uint value, bool putOption // true = put : false = call, uint openPositionPrice)
    // TODO: make oraclize query with selected delay
    betIdWithQueryId[??] = NewBetId;
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

   // ********************** //
  // PUT POSITION FUNCTIONS //
 // ********************** //

 /*TODO:*/

   // **************** //
  // UPDATE FUNCTIONS //
 // **************** //


 function updateExchangeRateForCallRequest(uint delay, mapping bet) {
   // Costs $0.01 for URL call + $0.04 for TLSNotary = $0.05 per update
   oraclize_query(delay, "URL",
     "json(https://min-api.cryptocompare.com/data/price?fsym=ETH&tsyms=USD).USD");
 }

 // This function is called when the get request results are ready
 function __callback(bytes32 myid, string result, bytes proof) {
   if (msg.sender != oraclize_cbAddress()) throw;
   if (myidList[myid] == true) throw; // check if this myid was already processed before
   myidList[myid] = true; // mark this myid (default bool value is false)

   ETHUSD = parseInt(result, 2); // save it as $ cents

   // check openPositionPrice has been set or not and act upon that
   if (bets[betIdWithQueryId[myid]].openPositionPrice == 0) {
     bets[betIdWithQueryId[myid]].openPositionPrice == ETHUSD;
   } else {
     closePosition(betIdWithQueryId[myid])
   }

 }

 // TODO: check that you can pass struct into a function
 function closePosition(uint betId) private {
   if (bets[betId].putOption) {
     // bet was a put option: bet the value was going to go UP
     if (bets[betId].openPositionPrice < ETHUSD) {
       // Value went UP: wins bet
       // TODO: Decide fair win %
       userBalance[bets[betId].userAddress] += bet.value * (70/100) // reward +70% to the user
     } else if (bets[betId].openPositionPrice > ETHUSD) {
       // Value went DOWN: loses bet
       userBalance[bets[betId].userAddress] -= bet.value
     } else {
       // Just take fee of executing transations
       // TODO: Decide whether or not this is truely necessary
       userBalance[bets[betId].userAddress] -= 0.10 * ETHUSD
     }
   } else {
     // bet was a call option: bet the value was going to go DOWN
     if (bets[betId].openPositionPrice > ETHUSD) {
       // Value went DOWN: wins bet
       // TODO: Decide fair win %
       userBalance[bets[betId].userAddress] += bet.value * (70/100) // reward +70% to the user
     } else if (bets[betId].openPositionPrice < ETHUSD) {
       // Value went UP: loses bet
       userBalance[bets[betId].userAddress] -= bet.value
     } else {
       // Just take fee of executing transations
       userBalance[bets[betId].userAddress] -= 0.10 * ETHUSD
     }
   }
 }



}
