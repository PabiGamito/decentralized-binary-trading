pragma solidity ^0.4.3;

contract Call {
  uint minter;
  address mainContractAddress;

  // This function runs on contract creation
  function Call(address _mainContract) {
    minter = msg.sender;
    mainContractAddress = _mainContract;
  }

  // This function is called when ever someone sends ethers to this contract's address
  function () payable {
    // TODO: Update with actual gas cost, tx.gasprice?
    if(msg.value < (ETHUSD * 10 + 0.05 ) * 1 ether) throw; // reverts the transfer to user if desposit is enough to cover oraclize's costs and contract execution
    // Get the exchange rate at time of transaction
    // TODO: Figure out how to get exact time of transaction
    
    // attempts to redirect all funds to the main contract
    if (!addressOfM.send(msg.value)) throw;
  }

  // TODO: Decide whether or not it is a security risk to be able to change the main contract address, and whether or not is is really necessary to be able to change the main contract address
  function setMainContractAddress(address updatedMainContractAddress) {
    if (msg.sender != minter) throw; // makes sure contract owner is calling this function
    mainContractAddress = updatedMainContractAddress;
  }

}

contract Put {
  // This function is called when ever someone sends ethers to this contract's address
  function () payable {

  }
}
