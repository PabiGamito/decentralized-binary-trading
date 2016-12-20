import "github.com/oraclize/ethereum-api/oraclizeAPI.sol";
import "github.com/Arachnid/solidity-stringutils/strings.sol";

contract BinaryTrading is usingOraclize {
  using strings for *;

  // ********* //
  // VARIABLES //
  // ********* //
  address minter;

  uint brokerBalance;

  mapping (address => uint) userAvailableBalance;
  mapping (address => uint) userLockedBalance;

  mapping (uint => uint ) priceAt; // ts => price

  struct Bet {
    address userAddress;
    uint value;
    bool putOption; // true = put : false = call
    uint openTs;
    uint closeTs;
  }
  mapping (address => Bet[]) bets; //address => Bet[]

  mapping (bytes32 => uint) pairOfId; // oraclizeId => ts
  mapping (uint => bool) priceRequestedFor; // ts => bool


  // ********* //
  // FUNCTIONS //
  // ********* //

  // This function is called upon contract creation
  function BinaryTrading() {
    minter = msg.sender;
    oraclize_setProof(proofType_TLSNotary | proofStorage_IPFS);
  }

  // This function is the fallback function
  function () payable {
    userAvailableBalance[msg.sender] += msg.value;
  }

  function deposit() payable external returns(bool success) {
    userAvailableBalance[msg.sender] += msg.value;
    return true;
  }

  modifier onlyMinter {
    if (msg.sender != minter) throw;
    _;
  }

  function withdraw(uint amountInWei) external returns(bool success) {
    if ( amountInWei > userAvailableBalance[msg.sender]) throw;
    if (!msg.sender.send(amountInWei)) throw;
    userAvailableBalance[msg.sender] -= amountInWei;
    return true;
  }

  function put(uint amountInWei, uint openTs, uint closeTs) external {
    placeBet(amountInWei, openTs, closeTs, true, msg.sender);
  }

  function call(uint amountInWei, uint openTs, uint closeTs) external {
    placeBet(amountInWei, openTs, closeTs, false, msg.sender);
  }

  function placeBet(uint amountInWei, uint openTs, uint closeTs, bool putOption, address senderAddress) private {
    if (amountInWei > userAvailableBalance[senderAddress] || openTs % 10800 != 0 || closeTs % 10800 != 0 || openTs + 300 < now || openTs >= closeTs || bets[senderAddress].length >= 15) throw; // 10800 = 60*60*3 = 3 days ; user has 300s max to place bet after openTs
    userAvailableBalance[senderAddress] -= amountInWei;
    userLockedBalance[senderAddress] += amountInWei;
    bets[senderAddress].push( Bet(senderAddress, amountInWei, putOption, openTs, closeTs) );
    if (priceRequestedFor[openTs] != true) {
      getPrice(openTs);
    }
  }

  // This function is called when the oraclized request results are ready
  function __callback(bytes32 myid, string result, bytes proof) {
    if (msg.sender != oraclize_cbAddress()) throw;
      priceAt[ pairOfId[myid] ] = parseInt(result);
  }

  function bytes32ToString(bytes32 data) returns (string) {
    bytes memory bytesString = new bytes(32);
    for (uint j=0; j<32; j++) {
      byte char = byte(bytes32(uint(data) * 2 ** (8 * j)));
      if (char != 0) {
        bytesString[j] = char;
      }
    }
    return string(bytesString);
  }

  function uint256ToBytes32(uint256 n) returns (bytes32) {
    return bytes32(n);
  }

  function parseString(bytes32 data) returns (string) {
    string memory myString = bytes32ToString( data) );
    return myString;
  }

  function getPrice(uint ts) {
    string timestamp = parseString(uint256ToBytes32(ts));
    if (ts % 10800 != 0 || ts > now) throw;
    bytes32 myid = oraclize_query("URL", "json(https://www.cryptocompare.com/api/data/histohour/?e=BTCCHINA&fsym=BTC&tsym=CNY&limit=1&toTs=".toSlice().concat(timestamp.toSlice().concat(").Data.1.close".toSlice())) );
    pairOfId[myid] = ts;
    priceRequestedFor[ts] = true;
  }

  function unlockBets() external {
    for (uint i = 0; i < bets[msg.sender].length; i++) {
      uint closeTs = bets[msg.sender][i].closeTs;
      if (closeTs <= now) throw;
      // TODO: Check this works as intended
      if (priceAt[closeTs] != 0) {
        if (priceAt[closeTs] > priceAt[bets[msg.sender][i].openTs]) {
          uint betValue = bets[msg.sender][i].value;
          userLockedBalance -= betValue;
          userAvailableBalance += betValue;
          delete bets[msg.sender][i];
          if (bets[msg.sender].length >= 1) {
            bets[msg.sender][i] = bets[msg.sender][bets[msg.sender].length - 1];
          }
          bets[msg.sender].length--;
        }
      } else if (priceRequestedFor(closeTs) == true ) {
        // if getPrice request is in proccess but answer has not yet been given
      } else {
        getPrice(closeTs);
      }
    }
  }

}
