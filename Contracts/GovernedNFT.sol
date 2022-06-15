// SPDX-License-Identifier: MIT
// Further information: https://eips.ethereum.org/EIPS/eip-2770
pragma solidity ^0.8.5;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/draft-EIP712.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Pausable.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155URIStorage.sol";
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
// - getVotes(voteId) : sends back the data associated to a vote
//
// Inspired from: https://betterprogramming.pub/ethereum-erc-20-meta-transactions-4cacbb3630ee
//

contract GovernedNFT is EIP712, Pausable, ERC1155URIStorage, Ownable {
    using ECDSA for bytes32;

    event HasVoted(address indexed who, uint256 indexed id);

    struct BallotMessage {
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

    struct Person {
        bool    blocked;                // Is this person allowed to vote?
        uint128 lastVote;               // Which the last vote this person has been participating into?
    }

    bytes32 private constant _TYPEHASH = keccak256("BallotMessage(address from,uint128 voteId,bytes data)");

    mapping(address => Person) private _persons;        // persons allowed to cast a vote 
    uint128 private _currentVoteId;                     // The voteId which is currently open
    uint256 private _startTimestamp;                    // start of the current vote
    uint256 private _endTimestamp;                      // end of the current vote
    mapping(uint128 => Ballot[]) private _ballots;      // ballots organised by votes

    constructor(string memory uri_) Ownable() ERC1155(uri_) EIP712("GovernedNFT", "1.0.0") {
        _currentVoteId = 0;
    }

    function mint(uint256 id, uint256 amount, bytes memory data) public onlyOwner {
        _mint(owner(), id, amount, data);
    }

    function _mintBatch(uint256[] memory ids, uint256[] memory amounts, bytes memory data) public onlyOwner {
        _mintBatch(owner(), ids, amounts, data);
    }

    function getVote() public view returns (uint128, uint256, uint256) {
        return (_currentVoteId, _startTimestamp, _endTimestamp);
    }

    function setVote(uint128 voteId, uint256 start, uint256 end) public {
        require( voteId > _currentVoteId, "GovernedNFT: the new vote must have a larger id than the previous ones");
        require( end > start, "GovernedNFT: the end cannot be before the start");
        require( end > block.timestamp, "GovernedNFT: the end cannot be in the past");
        _currentVoteId = voteId;
        _startTimestamp = start;
        _endTimestamp = end;
    }

    function verify(BallotMessage calldata ballot, bytes calldata signature) public view returns (bool) {
        require( ballot.voteId == _currentVoteId, "GovernedNFT: voting is not allowed on this proposal");
        require(_persons[ballot.from].lastVote < _currentVoteId, "GovernedNFT: this individual has already voted");
        require(block.timestamp > _startTimestamp, "GovernedNFT: this vote is not yet open");
        require(block.timestamp < _endTimestamp, "GovernedNFT: this vote is not open anymore");

        address signer = _hashTypedDataV4(keccak256(abi.encode(
            _TYPEHASH,
            ballot.from,
            ballot.voteId,
            keccak256(ballot.data)
        ))).recover(signature);
        return signer == ballot.from;
    }

    function vote(BallotMessage calldata ballot, bytes calldata signature, uint256[] calldata ids) public {
        require(!_persons[ballot.from].blocked, "GovernedNFT: this individual is not allowed to vote");
        require(verify(ballot, signature), "GovernedNFT: invalid vote");
        bool voted = false;
       
        for (uint i = 0 ; i < ids.length ; i++) {
            if (balanceOf(ballot.from, ids[i]) != 0) {
                voted = true;
                _ballots[ballot.voteId].push(Ballot( ballot.from, ids[i], bytes16(ballot.data), signature, block.timestamp ));
                emit HasVoted(ballot.from, ids[i]);
            }
        }
        if (voted) _persons[ballot.from].lastVote = _currentVoteId;
    }

    function hasVoted(address who) public view returns (bool) {
        return _persons[who].lastVote == _currentVoteId;
    }

    function isAllowed(address who) public view returns (bool) {
        return !_persons[who].blocked;
    }

    function revoke(address voter) public {
        _persons[voter].blocked = true;
    }

    function getVotes(uint128 voteId) public view returns(Ballot[] memory) {
        return _ballots[voteId];
    }

    function _beforeTokenTransfer(
        address operator,
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data ) internal override {
        super._beforeTokenTransfer(operator, from, to, ids, amounts, data);

        require(!paused(), "ERC1155Pausable: token transfer while paused");
    }
}
