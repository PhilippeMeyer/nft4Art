// SPDX-License-Identifier: MIT
// Further information: https://eips.ethereum.org/EIPS/eip-2770
pragma solidity ^0.8.5;

import './UnorderedKeySetLib.sol';

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/draft-EIP712.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";


//
// GovernedNFT.sol
//
// Basic Openzepplin ERC1555 contract with a voting extension 
//
// The voters are the owners of the different tokens and they vote through signed messages so that voters do not need to own or spend gas.
// Those messages are generated in application accessing the voter's private key and is sent off chain to a server which pays the gas 
// for storing the votes in this contract.
// The votes are stored on 4 bits to represent 16 possible answers per vote
// A ballot is stored on 128 bits which means that there are a maximum of 31 votes per ballot. The first 4 bits are reserved for future use
// Each Ballot has a unique identifier (on 16 bits)
//
// This smart contract offers the following methods:
// - getVote() : returns the next available voteId, the start and the end timestamps
// - setVote(voteId, start, end) : defines the current voteId, its start and end timestamps
// - vote(ballot, signature, ids) : receives and store a ballot if it is valid. The ballot is valid for one or multiple tokens listed in the ids array
// - hasVoted(address): returns true if the address has voted for the current vote
// - revoke(address) : revoke the voting right for a given address
// - getVote(voteId) : sends back the data associated to a vote
//
// Inspired from: https://betterprogramming.pub/ethereum-erc-20-meta-transactions-4cacbb3630ee
//
// In addition to the governance part, this contract also manages tokens sales. For this purpose it implements:
// - a receive function to notify any ether transfer
// - a recordSale function which stores the last sale and potentially when the sale is taking place on the same network performs the transfer
// - a saleUpdate function which updates the sale's status
// - a getSale function which returns the status of a sale
//

contract GovernedNFT is EIP712, Pausable, ERC1155, Ownable {
    using ECDSA for bytes32;
    using UnorderedKeySetLib for UnorderedKeySetLib.Set;


    event VoteCreated(address indexed who, uint256 indexed voteId);         // Emitted when a vote has been created
    event HasVoted(address indexed who, uint256 indexed tokenId);           // Emitted when a vote has been performed on a specific token
    event ReceivedEth(address, uint);                                       // Emitted when some ether has been received
    event Sale( uint256 indexed tokenId,                                    // Emitted when a sale on tokenId is performed
                bytes32 indexed buyer,                                      // Buyer's address (can also be a bitcoin address)
                uint128 price,                                              // Price as an integer
                uint8   decimals,                                           // Decimals applied to the price
                bytes3  currency,                                           // Currency 3 letters Iso country code + ETH and BTC 
                bytes1  network,                                            // Network on which the payment is performed
                bytes1  status);                                            // Sale's status: initiated, payed, completed, ....
    event SaleUpdate( uint256 indexed tokenId,                              // Emitted when a sale on tokenId is performed
                      bytes32 indexed buyer,                                // Buyer's address (can also be a bitcoin address)
                      bytes1  status);                                      // Sale's status: initiated, payed, completed, ....

    struct BallotMessage {              // Structure used to communicate the Ballot
        address     from;               // Externally-owned account (EOA) of the voter.
        uint128     voteId;             // Vote Identifier.
        bytes       data;               // Data of the vote to be stored if the message is genuine.
    }

    struct Ballot {                     // Storage structure for audit purpose
        address     from;               // Voter's address
        uint256     tokenId;            // Id of the token for that vote
        bytes16     data;               // Data of the vote
        bytes       signature;          // Signature received and verified
        uint256     timestamp;          // Timestamp of the vote (from the blockchain)
    }

    struct Vote {                       // Storage structure for a vote 
        uint256 startDate;              // Start date
        uint256 endDate;                // End date
        string  cid;                    // Ipfs Cid of the form used for the vote
        uint256 hash;                   // Hash of the file (to be able to check the integrity of what has been downloaded from Ipfs)
    }

    struct Person {
        bool    blocked;                // Is this person allowed to vote?
        mapping(uint128 => bool) done;  // Has this person been participating to the vote?
    }

    struct SaleRecord {
        bytes32 buyer;                  // Buyer's address (can also be a bitcoin address)
        uint128 price;                  // Price as an integer
        uint8   decimals;               // Decimals applied to the price
        bytes3  currency;               // Currency 3 letters Iso country code + ETH and BTC 
        bytes1  network;                // Network on which the payment is performed
        bytes1  status;                 // Sale's status: initiated, payed, completed, ....
    }

    bytes32 private constant _TYPEHASH = keccak256("BallotMessage(address from,uint128 voteId,bytes data)");

    mapping(address => Person) private _persons;                    // persons allowed to cast a vote 
    uint128 private _currentVoteId;                                 // The voteId which is currently open
    mapping(uint128 => Vote) private _votes;                      // list of the votes created, indexed by their voteId
    mapping(uint128 => Ballot[]) private _ballots;                  // ballots organised by votes
    mapping(uint256 => SaleRecord) private _sales;                  // sale status per tokenId
    mapping(uint256 => string) private _uris;                       // specific uris for some tokens overriding the default one
    string private _defaultUri;                                     // default URI to be used by all the tokens
    mapping(address => UnorderedKeySetLib.Set) private _owners;     // List of tokens owned by an address
    mapping(uint256 => uint256) private _totalSupply;               // Quantity of tokens per token
    uint256[] private _tokensId;                                    // List of tokens that have been issued


    constructor() Ownable() ERC1155("") EIP712("GovernedNFT", "1.0.0") {
        _currentVoteId = 0;
    }

    // setDefaultURI
    // Sets the default URI for the tokens
    //
    // Parameters:
    //  - The generic URI for all the tokens (ipfs://<cid>/{id}.json)
    //
    // The default URI is generally an Ipfs directory and has the following structure
    // ipfs://<cid>/{tokenId}.json. The expected parameter is the full chain not only the cid
    //
    function setDefaultURI(string memory uri_) public {
        _defaultUri = uri_;
    }

    // getDefaultURi
    // Returns the default URI for the whole smart contract
    //
    // No parameter
    //
    // Returns the uri which has been set by setDefaultURI
    //
    function getDefaultURi() public view returns (string memory) {
        return _defaultUri;
    }

    //
    // setURI
    // Sets a specific Uri for a specific token
    //
    // Parameters:
    //  - the tokenId for which a specific Uri is defined
    //  - the uri to associate with the token
    //
    // This function stores in the mapping _uris the uri passed as argument
    //
    function setURI(uint256 tokenId_, string memory uri_) public {
        _uris[tokenId_] = uri_;
    }

    //
    // uri
    // Returns the URI associated with a token
    //
    // Parameters:
    //  - tokenId : uint256 containing the tokenId for which the uri is requested
    //
    // A specific uri can be set by setURI to override the default uri set by setDefaultURI
    // This function looks into the mapping of the specific uris and returns either the specific uri 
    // if specified or the default one
    //
    function uri(uint256 tokenId_) public view virtual override returns (string memory) {
        if (bytes(_uris[tokenId_]).length != 0) return _uris[tokenId_];
        return _defaultUri;
    }

    //
    // tokensOwned
    // Returns the tokens owned by a specific address
    //
    // Parameters:
    //  - address of the owner
    //
    // Returns:
    //  - An array containing the tokens ids owned by this address
    //
    function tokensOwned(address owner) public view returns(uint256[] memory) {
        return _owners[owner].values();
    }

    //
    // tokensIssued
    // Returns the list of tokens that have been issued
    //
    // Parameters: None
    //
    // Returns: 
    //  - An array of token Ids (uint256) of all the minted Ids 
    //
    function tokensIssued() public view returns(uint256[] memory) {
        return _tokensId;
    }

    //
    // numberOfPieces
    // Returns the number of pieces minted for a given token
    //
    // Parameters:
    //  - tokenId : the token for which the number of pieces is requested
    //
    // Returns: 
    //  - The number of pieces (uint256) minted for that token Id
    //
    function numberOfPieces(uint256 tokenId) public view returns(uint256) {
        return _totalSupply[tokenId];
    }

    //
    // mint
    // Mints a new token
    //
    // Parameters: 
    //  - tokenId: the id of token
    //  - amount: number of tokens minted
    //  - data: opaque data sent to the transfer function 
    //
    function mint(uint256 id, uint256 amount, bytes memory data) public onlyOwner {
        require(_totalSupply[id] == 0, "GovernedNFT: cannot re-mint an existing token");
        _mint(owner(), id, amount, data);
    }

    //
    // mintBatch
    // Mints new tokens
    //
    // Parameters: 
    //  - ids: array of the id of tokens
    //  - amounts: array of the number of tokens minted
    //  - data: opaque data sent to the transfer function 
    //
    function mintBatch(uint256[] memory ids, uint256[] memory amounts, bytes memory data) public onlyOwner {
        for (uint i = 0 ; i < ids.length ; i++) {
            require(_totalSupply[ids[i]] == 0, "GovernedNFT: cannot re-mint an existing token");
        }
        _mintBatch(owner(), ids, amounts, data);
    }

    //
    // getVote
    // returns the current vote set by the administrator
    //
    // Returns: 
    //  - the current voteId
    //  - the vote details (Vote structure)
    //
    function getVote() public view returns (uint128, Vote memory) {
        return (_currentVoteId, _votes[_currentVoteId]);
    }

    //
    // getVoteById
    // returns the specified vote
    //
    // Parameter:
    //  - voteId uint128 vote identifier
    //
    // Returns:
    //  - the current voteId
    //  - the vote details (Vote structure)
    //
    function getVoteById(uint128 voteId) public view returns (uint128, Vote memory) {
        return (voteId, _votes[voteId]);
    }

    //
    // setVote
    // sets the current vote 
    //
    // Parameters: 
    //  - the current voteId
    //  - the starting time of the vote
    //  - the ending time of the vote
    //
    // The new vote must be greater than the previous ones, the starting time has to be before the end and the vote cannot happen in the past
    //
    function setVote(uint128 voteId, uint256 start, uint256 end, string memory cid, uint256 hash) public onlyOwner {
        require( voteId > _currentVoteId, "GovernedNFT: the new vote must have a larger id than the previous ones");
        require( end > start, "GovernedNFT: the end cannot be before the start");
        require( end > block.timestamp, "GovernedNFT: the end cannot be in the past");
        _currentVoteId = voteId;
        _votes[voteId] = Vote(start, end, cid, hash);

        emit VoteCreated(msg.sender, voteId);
    }

    //
    // verify
    // verifies a vote's signature 
    //
    // Parameters: 
    //  - the ballot message
    //  - the signature of this message
    //
    // Returns: true or false depending on the signature's validity
    //
    // The verification checks that the vote is taking place on the current vote, that the voter has not voted yet and that vote is taking place in the 
    // defined timeframe. The function then verifies that the ballot message has been signed by the signer
    //
    function verify(BallotMessage calldata ballot, bytes calldata signature) public view returns (bool) {
        Vote memory lcl = _votes[ballot.voteId];
        require( lcl.startDate != 0, "GovernedNFT: this voteId does not exist");
        require(!_persons[ballot.from].blocked, "GovernedNFT: this individual is not allowed to vote");
        require(_persons[ballot.from].done[ballot.voteId] == false, "GovernedNFT: this individual has already voted");
        require(block.timestamp > lcl.startDate, "GovernedNFT: this vote is not yet open");
        require(block.timestamp < lcl.endDate, "GovernedNFT: this vote is not open anymore");

        address signer = _hashTypedDataV4(keccak256(abi.encode(
            _TYPEHASH,
            ballot.from,
            ballot.voteId,
            keccak256(ballot.data)
        ))).recover(signature);
        return signer == ballot.from;
    }

    //
    // vote
    // vote for the current vote 
    //
    // Parameters: 
    //  - the ballot message
    //  - the signature of this message
    //  - the id on which the voter is voting
    //
    // Verifies the signature, stores the ballot and emits the associated event if the signature is valid
    //
    function vote(BallotMessage calldata ballot, bytes calldata signature, uint256 id) public {
        require(balanceOf(ballot.from, id) != 0, "GovernedNFT: this individual is not owning that token");
        require(verify(ballot, signature), "GovernedNFT: invalid vote");
                
        _ballots[ballot.voteId].push(Ballot( ballot.from, id, bytes16(ballot.data), signature, block.timestamp ));
        _persons[ballot.from].done[ballot.voteId] = true;

        emit HasVoted(ballot.from, id);
    }

    //
    // hasVoted
    // hasVoted for the current vote 
    //
    // Parameters: 
    //  - address of the voter
    //  - id of the vote
    //
    // Returns the true or false
    //
    function hasVoted(address who, uint128 voteId) public view returns (bool) {
        return _persons[who].done[voteId];
    }

    //
    // isAllowed
    // is the voter allowed to vote?
    //
    // Parameters: 
    //  - address of the voter
    //
    // Returns true or false depending on the voter's authorization
    //
    function isAllowed(address who) public view returns (bool) {
        return !_persons[who].blocked;
    }

    //
    // revoke
    // revoke a voter 
    //
    // Parameters: 
    //  - address of the voter
    //
    function revoke(address voter) public onlyOwner {
        _persons[voter].blocked = true;
    }

    //
    // getBallots
    // retrieve all the ballots for a vote 
    //
    // Parameters: 
    //  - id of the vote
    //
    // Returns:
    //  - an array of ballots
    //
    function getBallots(uint128 voteId) public view returns(Ballot[] memory) {
        return _ballots[voteId];
    }

    //
    // _beforeTokenTransfer
    // internal method which is called before a transfer is taking place 
    //
    // Parameters: Parameters of the transfer method
    //    address operator : who is calling for the transfer
    //    address from : from where are the tokens transferred
    //    address to : to where are the tokens transferred
    //    uint256[] memory ids : array of tokens to be transferred identified by their ids
    //    uint256[] memory amounts : array of amounts to be transferred 
    //    bytes memory data : opaque data
    //
    // As the token is pausable, this function manages the pause flag for transfers
    //
    function _beforeTokenTransfer(
        address operator,
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data ) internal override {
        super._beforeTokenTransfer(operator, from, to, ids, amounts, data);

        require(!paused(), "GovernedNFT: token transfer while paused");
    }

    //
    // _afterTokenTransfer
    // internal method which is called after a transfer is taking place 
    //
    // Parameters: Parameters of the transfer method
    //    address operator : who is calling for the transfer
    //    address from : from where are the tokens transferred
    //    address to : to where are the tokens transferred
    //    uint256[] memory ids : array of tokens to be transferred identified by their ids
    //    uint256[] memory amounts : array of amounts to be transferred 
    //    bytes memory data : opaque data
    //
    // We use that hook to maintain the list of owners
    //
    function _afterTokenTransfer(
        address operator,
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data ) internal override {
        super._afterTokenTransfer(operator, from, to, ids, amounts, data);

        for(uint i = 0 ; i < ids.length ; i++) {
            _owners[to].insert(ids[i]);                                     // The to address is receiving some tokens
        
            if (from == address(0)) {                                       // This is a mint -> register the tokens
                _totalSupply[ids[i]] += amounts[i];
                _tokensId.push(ids[i]);
            }
        }

        if (from == address(0)) return;                                     // Mint nothing to remove from any user
        
        for(uint i = 0 ; i < ids.length ; i++) 
            if(balanceOf(from, ids[i]) == 0) _owners[from].remove(ids[i]);
    }

    //
    // receive
    // method called when the smart contract receives ether 
    //
    // This method only signals the reception of eth. 
    //
    receive() external payable {
        emit ReceivedEth(msg.sender, msg.value);
    }

    //
    // withdraw
    // method to withdraw the eth received on the contract
    //
    function withdraw() public payable onlyOwner {
        payable(msg.sender).transfer(address(this).balance);
    }

    //
    // saleRecord
    // Records a sale on a token and emits the corresponding event
    //
    // Parameters: 
    //  - tokenId: the id of token
    //  - sale: a sales record
    //
    function saleRecord(uint256 tokenId_, SaleRecord calldata sale_)  public onlyOwner {
        _sales[tokenId_] = sale_;
        emit Sale(tokenId_, sale_.buyer, sale_.price, sale_.decimals, sale_.currency, sale_.network, sale_.status);
    }

    //
    // saleUpdate
    // Updates a sale on a token and emits the corresponding event
    //
    // Parameters: 
    //  - tokenId: the id of token
    //  - status: updated status 
    //
   function saleUpdate(uint256 tokenId_, bytes1 status_)  public onlyOwner {
        _sales[tokenId_].status = status_;
        emit SaleUpdate(tokenId_, _sales[tokenId_].buyer, status_);
    }

    //
    // getSale
    // returns a sale on a token
    //
    // Parameters: 
    //  - tokenId: the id of token
    //
    function getSale(uint256 tokenId_) public view onlyOwner returns(SaleRecord memory) {
        return _sales[tokenId_];
    }
}
