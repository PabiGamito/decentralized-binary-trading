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

  // ********* //
  // VARIABLES //
  // ********* //

  // Used to store the contract creator's address
  address minter;

  // Mapping is used to make sure that requests are not processed twice
  mapping(bytes32 => bool) myidList;

  // Exchange Price Variable in cents
  uint public ETHUSD;

  // Maps so that user balances are easily accessible by address
  mapping (address => balance) userBalance;
  uint brokerBalance;

  struct Bet private {
    address userAddress;
    uint value;
    bool putOption; // true = put : false = call
    uint openPositionPrice;
  }

  mapping (uint => Bet) bets;
  uint newBetId;
  mapping (bytes32 => uint) betIdWithQueryId;
  mapping (bytes32 => uint) delayWithQueryId;

  // ************** //
  // MAIN FUNCTIONS //
  // ************** //

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
  function withdraw() external returns (uint withdrawalBalance) {
    withdrawalBalance = users[msg.sender].balance;
    if (!msg.sender.send(withdrawalBalance)) throw;
  }

  function brokerWithdrawl(uint amountInEther) external {
    if (msg.sender != minter) throw;
    if (amountInEther * 1 ether > brokerBalance) throw;
    if (!minter.send(amountInEther * 1 ether)) throw;
  }

  function brokerDeposit() payable external returns (uint balance) {
    brokerBalance += msg.value;
    return this.balance;
  }

  // User deposit
  function deposit() payable external returns (uint balance) {
    userBalance[msg.sender] += balance;
    returns userBalance[msg.sender];
  }

  // *********************** //
  // CALL POSITION FUNCTIONS //
  // *********************** //

  // This can only be called from someone outside this contract as it requires a deposit
  function externalCallRequest(uint secondsToExpiration) payable external {
    // TODO: Check if you can deposit money through this function and the get a throw in placeCallOption and get refunded with increased balance.
    userBalance[msg.sender] += msg.value;
    placeCallOption(msg.sender, msg.value, secondsToExpiration);
  }

  function placeCallOption(address userAddress, uint betValue, uint delay) private {
    // Max delay is 30 minutes
    if (delay > 30*60) throw;
    newBetId += 1;
    bets[newBetId] = Bet(userAddress, betValue, false, 0) // (address userAddress, uint value, bool putOption // true = put : false = call, uint openPositionPrice)
    // TODO: make oraclize query with selected delay
    bytes32 myid = oraclize_query(0, "URL", "json(https://min-api.cryptocompare.com/data/price?fsym=ETH&tsyms=USD).USD");
    betIdWithQueryId[myid] = newBetId;
    delayWithQueryId[myid] = delay;
  }

  // ********************** //
  // PUT POSITION FUNCTIONS //
  // ********************** //

  // This can only be called from someone outside this contract as it requires a deposit
  function externalPutRequest(uint secondsToExpiration) payable external {
    // TODO: Check if you can deposit money through this function and the get a throw in placeCallOption and get refunded with increased balance.
    userBalance[msg.sender] += msg.value;
    placePutOption(msg.sender, msg.value, secondsToExpiration);
  }

  function placePutOption(address userAddress, uint betValue, uint delay) private {
    // Max delay is 30 minutes
    if (delay > 30*60) throw;
    newBetId += 1;
    bets[newBetId] = Bet(userAddress, betValue, true, 0) // (address userAddress, uint value, bool putOption // true = put : false = call, uint openPositionPrice)
    // TODO: make oraclize query with selected delay
    bytes32 myid = oraclize_query(0, "URL", "json(https://min-api.cryptocompare.com/data/price?fsym=ETH&tsyms=USD).USD");
    betIdWithQueryId[myid] = newBetId;
    delayWithQueryId[myid] = delay;
  }

  // ****************** //
  // CALLBACK FUNCTIONS //
  // ****************** //

 // This function is called when the get request results are ready
 function __callback(bytes32 myid, string result, bytes proof) {
   if (msg.sender != oraclize_cbAddress()) throw;
   if (myidList[myid] == true) throw; // check if this myid was already processed before
   myidList[myid] = true; // mark this myid (default bool value is false)

   ETHUSD = parseInt(result, 2); // save it as $ cents

   // check openPositionPrice has been set or not and act upon that
   if (bets[betIdWithQueryId[myid]].openPositionPrice == 0) {
     bets[betIdWithQueryId[myid]].openPositionPrice = ETHUSD;
     bytes32 newMyid = oraclize_query(delayWithQueryId[myid], "URL", "json(https://min-api.cryptocompare.com/data/price?fsym=ETH&tsyms=USD).USD");
     betIdWithQueryId[newMyid] = betIdWithQueryId[myid];
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

} /* Contract End */
