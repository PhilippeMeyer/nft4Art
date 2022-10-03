// SPDX-License-Identifier: MIT
// Further information: https://eips.ethereum.org/EIPS/eip-2770
pragma solidity ^0.8.5;

//
// UnorderedKeySetLib
// Library implementing a set used to maintain the list of tokens owned by the owners
//
// coming from: https://github.com/rob-Hitchens/UnorderedKeySet/blob/master/contracts/HitchensUnorderedKeySet.sol
//

library UnorderedKeySetLib {

    struct Set {
        mapping(uint256 => uint) keyPointers;
        uint256[] keyList;
    }

    function insert(Set storage self, uint256 key) internal returns (bool) {
        require(key != 0x0, "UnorderedKeySet - Key cannot be 0x0");
        if(exists(self, key)) return false;
        self.keyList.push(key);
        self.keyPointers[key] = self.keyList.length - 1;
        return true;
    }

    function remove(Set storage self, uint256 key) internal {
        require(exists(self, key), "UnorderedKeySet - Key does not exist in the set.");
        uint256 keyToMove = self.keyList[count(self)-1];
        uint rowToReplace = self.keyPointers[key];
        self.keyPointers[keyToMove] = rowToReplace;
        self.keyList[rowToReplace] = keyToMove;
        delete self.keyPointers[key];
        self.keyList.pop();
    }

    function count(Set storage self) internal view returns(uint) {
        return(self.keyList.length);
    }

    function exists(Set storage self, uint256 key) internal view returns(bool) {
        if(self.keyList.length == 0) return false;
        return self.keyList[self.keyPointers[key]] == key;
    }

    function keyAtIndex(Set storage self, uint index) internal view returns(uint256) {
        return self.keyList[index];
    }

    function values(Set storage self) internal view returns(uint256[] memory) {
        return self.keyList;
    }

    function nukeSet(Set storage self) public {
        delete self.keyList;
    }
}
