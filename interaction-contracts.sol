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
