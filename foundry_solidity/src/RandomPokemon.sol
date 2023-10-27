// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@phala/solidity/contracts/PhatRollupAnchor.sol";

contract RandomPokemon is ERC721, Ownable, PhatRollupAnchor {
    using Strings for uint256;

    event ResponseReceived(uint reqId, string reqData, bytes value);
    event ErrorReceived(uint reqId, string reqData, uint256 errno);
    event PokemonEncountered(uint reqId, uint256 id, uint256 level, uint256 hp, uint256 attack, uint256 defense, uint256 specialAttack, uint256 specialDefense, uint256 speed);

    uint constant TYPE_RESPONSE = 0;
    uint constant TYPE_ERROR = 2;

    mapping(uint => string) requests;
    uint nextTokenId = 1;

    string public emptyTokenURI;
    string public baseTokenURI;

    constructor(address phatAttestor) ERC721("", "") PhatRollupAnchor()  {
        _grantRole(PhatRollupAnchor.ATTESTOR_ROLE, phatAttestor);
    }

    //
    // PhatRollupAnchor
    //

    function setAttestor(address phatAttestor) public {
        _grantRole(PhatRollupAnchor.ATTESTOR_ROLE, phatAttestor);
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
        } else if (respType == TYPE_ERROR) {
            uint errcode = abi.decode(data, (uint));
            emit ErrorReceived(reqId, requests[reqId], errcode);
            delete requests[reqId];
        }
    }

    //
    // ERC721
    //

  function mintTo(address recipient) public returns (uint256) {
    // assemble the request
    uint id = nextTokenId;
    string memory data = Strings.toHexString(recipient);
    requests[id] = data;
    _pushMessage(abi.encode(id, data));
    _safeMint(recipient, id);
    nextTokenId += 1;
    return id;
  }

  function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
      _requireMinted(tokenId);
      if (keccak256(abi.encodePacked(requests[tokenId])) != keccak256(abi.encodePacked(""))) {
        return bytes(emptyTokenURI).length > 0 ? emptyTokenURI : "";
      }
      string memory baseURI = _baseURI();
      return bytes(baseURI).length > 0 ? string(abi.encodePacked(baseURI, tokenId.toString())) : "";
  }

  function _baseURI() internal view virtual override returns (string memory) {
    return baseTokenURI;
  }

  function setBaseURI(string memory _emptyTokenURI, string memory _baseTokenURI) public onlyOwner {
    emptyTokenURI = _emptyTokenURI;
    baseTokenURI = _baseTokenURI;
  }

  function supportsInterface(bytes4 interfaceId) public view virtual override(AccessControl, ERC721) returns (bool) {
      return
          interfaceId == type(IERC721).interfaceId ||
          interfaceId == type(IERC721Metadata).interfaceId ||
          super.supportsInterface(interfaceId);
  }
}
