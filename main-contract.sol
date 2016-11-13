pragma solidity ^0.4.3;
import "github.com/oraclize/ethereum-api/oraclizeAPI_0.4.sol";

// TODO: Figure out how to calculate the max you can deposit so that the contract can't go bankrupt.
// TODO: Make all function that can be private or whatever it is called so that no extrenal person can mess with them
/*public - all
private - only this contract
internal - only this contract and contracts deriving from it
external - Cannot be accessed internally, only externally.
TODO: Pay some of the extra brokerBalance as interest to users who have money inside the contract to incite them to deposit and then trade*/

/*TODO: Make sure user can't bet more than what he has in his balance - what is in trade because right now he can*/
/*TODO: Figure out a way to have varying returnRate based on total succesful bets*/
/*TODO: Figure out a way for extra money to come in so it isn't a 0 sum game*/
/*TODO: Figure out how to deal with contract only being executed every 10-15 seconds*/

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
  mapping (address => uint) userBalance;
  uint brokerBalance;
  uint public returnRate;

  struct Bet {
    address userAddress;
    uint value;
    bool putOption; // true = put : false = call
    uint openPositionPrice;
  }

  mapping (uint => Bet) bets;
  uint latestBetId;
  mapping (bytes32 => uint) betIdWithQueryId;
  mapping (bytes32 => uint) delayWithQueryId;
  uint constant maxBet = brokerBalance/(returnRate/100);
  uint valueInBets; // TODO: Make the changes to this value were needed in code

  // ************** //
  // MAIN FUNCTIONS //
  // ************** //

  // This function is called upon contract creation
  function BinaryTrading(uint _returnRate) {
    minter = msg.sender;
    returnRate = _returnRate;
    oraclize_setProof(proofType_TLSNotary | proofStorage_IPFS);
  }

  // This function is the fallback function
  function () {
    throw;
  }

  modifier onlyMinter {
    if (msg.sender != minter) throw;
    _;
  }

  function updateReturnRate(uint newReturnRate) onlyMinter {
    returnRate = newReturnRate;
  }

  function brokerWithdrawl(uint amountInEther) external onlyMinter {
    if (amountInEther * 1 ether > brokerBalance) throw;
    if (!minter.send(amountInEther * 1 ether)) throw;
  }

  // This function allows the user to withdraw his funds
  function withdraw() external returns (uint withdrawalBalance) {
    withdrawalBalance = userBalance[msg.sender];
    if (!msg.sender.send(withdrawalBalance)) throw;
  }

  function brokerDeposit() payable external returns (uint balance) {
    // TODO: Make it so this can be an investment in contract/company and pays back interests
    brokerBalance += msg.value;
    return this.balance;
  }

  // User deposit
  function deposit() payable external {
    userBalance[msg.sender] += msg.value;

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
    latestBetId += 1;
    bets[latestBetId] = Bet(userAddress, betValue, false, 0); // (address userAddress, uint value, bool putOption // true = put : false = call, uint openPositionPrice)
    // TODO: make oraclize query with selected delay
    bytes32 myid = oraclize_query(0, "URL", "json(https://min-api.cryptocompare.com/data/price?fsym=ETH&tsyms=USD).USD");
    betIdWithQueryId[myid] = latestBetId;
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
    latestBetId += 1;
    bets[latestBetId] = Bet(userAddress, betValue, true, 0); // (address userAddress, uint value, bool putOption // true = put : false = call, uint openPositionPrice)
    // TODO: make oraclize query with selected delay
    bytes32 myid = oraclize_query(0, "URL", "json(https://min-api.cryptocompare.com/data/price?fsym=ETH&tsyms=USD).USD");
    betIdWithQueryId[myid] = latestBetId;
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
     closePosition(betIdWithQueryId[myid]);
   }

 }

 // TODO: check that you can pass struct into a function
 function closePosition(uint betId) private {
   if (bets[betId].putOption) {
     // bet was a put option: bet the value was going to go UP
     if (bets[betId].openPositionPrice < ETHUSD) {
       // Value went UP: WINS bet
       brokerBalance -= bets[betId].value * (returnRate/100);
       userBalance[bets[betId].userAddress] += bets[betId].value * (returnRate/100);
     } else if (bets[betId].openPositionPrice > ETHUSD) {
       // Value went DOWN: LOSES bet
       brokerBalance += bets[betId].value;
       userBalance[bets[betId].userAddress] -= bets[betId].value;
     } else {
       // Just take fee of executing transations
       // TODO: Decide whether or not this is truely necessary
       // userBalance[bets[betId].userAddress] -= 0.10 * ETHUSD;
     }
   } else {
     // bet was a call option: bet the value was going to go DOWN
     if (bets[betId].openPositionPrice > ETHUSD) {
       // Value went DOWN: WINS bet
       brokerBalance -= bets[betId].value * (returnRate/100);
       userBalance[bets[betId].userAddress] += bets[betId].value * (returnRate/100);
     } else if (bets[betId].openPositionPrice < ETHUSD) {
       // Value went UP: LOSES bet
       brokerBalance += bets[betId].value;
       userBalance[bets[betId].userAddress] -= bets[betId].value;
     } else {
       // Just take fee of executing transations
       // userBalance[bets[betId].userAddress] -= 0.10 * ETHUSD;
     }
   }
 }

} /* Contract End */
