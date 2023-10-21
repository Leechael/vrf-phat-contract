// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./PhatRollupAnchor.sol";

contract OracleConsumerContract is PhatRollupAnchor, Ownable {
    event ResponseReceived(uint reqId, string reqData, bytes value);
    event ErrorReceived(uint reqId, string reqData, uint256 errno);
    event PokemonEncountered(uint reqId, uint256 id, uint256 level, uint256 hp, uint256 attack, uint256 defense, uint256 specialAttack, uint256 specialDefense, uint256 speed);
    // event PokemonEncountered(uint reqId, uint256 id);

    uint constant TYPE_RESPONSE = 0;
    uint constant TYPE_ERROR = 2;

    mapping(uint => string) requests;
    uint nextRequest = 1;

    constructor(address phatAttestor) {
        _grantRole(PhatRollupAnchor.ATTESTOR_ROLE, phatAttestor);
    }

    function setAttestor(address phatAttestor) public {
        _grantRole(PhatRollupAnchor.ATTESTOR_ROLE, phatAttestor);
    }

    function request(string calldata reqData) public {
        // assemble the request
        uint id = nextRequest;
        requests[id] = reqData;
        _pushMessage(abi.encode(id, reqData));
        nextRequest += 1;
    }

    // For test
    function malformedRequest(bytes calldata malformedData) public {
        uint id = nextRequest;
        requests[id] = "malformed_req";
        _pushMessage(malformedData);
        nextRequest += 1;
    }

    function _onMessageReceived(bytes calldata action) internal override {
        // Optional to check length of action
        // require(action.length == 32 * 3, "cannot parse action");
        (uint respType, uint reqId, bytes memory data) = abi.decode(
            action,
            (uint, uint, bytes)
        );
        if (respType == TYPE_RESPONSE) {
            emit ResponseReceived(reqId, requests[reqId], data);
            delete requests[reqId];
            uint256[] memory stats = abi.decode(data, (uint256[]));
            require(stats.length == 8, "stats should 8 numbers");
            emit PokemonEncountered(reqId, stats[0], stats[1], stats[2], stats[3], stats[4], stats[5], stats[6], stats[7]);
            // (uint256 pokemonId, uint256 level, uint256 hp, uint256 attack, uint256 defense, uint256 specialAttack, uint256 specialDefense, uint256 speed) = abi.decode(
            //   data,
            //   (uint256, uint256, uint256, uint256, uint256, uint256, uint256, uint256)
            // );
            // emit PokemonEncountered(
            //   reqId, pokemonId, level, hp, attack, defense, specialAttack, specialDefense, speed
            // );
        } else if (respType == TYPE_ERROR) {
            uint errcode = abi.decode(data, (uint));
            emit ErrorReceived(reqId, requests[reqId], errcode);
            delete requests[reqId];
        }
    }
}
