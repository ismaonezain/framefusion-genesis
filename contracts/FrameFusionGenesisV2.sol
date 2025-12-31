hahaha
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title FrameFusion Genesis V2
 * @dev NFT Collection with On-Chain Metadata Storage
 * Stores FID, background, accessories, clothing, character class, and color palette
 */
contract FrameFusionGenesisV2 is ERC721, ERC721URIStorage, Ownable {
    uint256 private _tokenIdCounter;
    uint256 public constant MAX_SUPPLY = 3000;

    // Struct to store NFT metadata on-chain
    struct NFTMetadata {
        uint256 fid;
        string characterClass;
        string classDescription;
        string gender;
        string background;
        string backgroundDescription;
        string colorPalette;
        string colorVibe;
        string clothing;
        string accessories;
        string items;
        uint256 mintedAt;
    }

    // Mappings
    mapping(uint256 => uint256) public fidToTokenId;
    mapping(uint256 => uint256) public tokenIdToFid;
    mapping(uint256 => NFTMetadata) public tokenMetadata;
    mapping(uint256 => bool) public fidMinted;

    // Events
    event NFTMinted(
        address indexed to,
        uint256 indexed tokenId,
        uint256 indexed fid,
        string characterClass,
        string background,
        string colorPalette
    );

    constructor() ERC721("FrameFusion Genesis", "FFG") Ownable(msg.sender) {
        _tokenIdCounter = 1; // Start from 1
    }

    /**
     * @dev Mint NFT with full metadata
     */
    function safeMint(
        address _to,
        string memory _tokenURI,
        uint256 _fid,
        string memory _characterClass,
        string memory _classDescription,
        string memory _gender,
        string memory _background,
        string memory _backgroundDescription,
        string memory _colorPalette,
        string memory _colorVibe,
        string memory _clothing,
        string memory _accessories,
        string memory _items
    ) public returns (uint256) {
        require(_tokenIdCounter <= MAX_SUPPLY, "Max supply reached");
        require(!fidMinted[_fid], "FID already minted");
        require(_to != address(0), "Cannot mint to zero address");

        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;

        // Store metadata using storage pointer to reduce stack depth
        NFTMetadata storage metadata = tokenMetadata[tokenId];
        metadata.fid = _fid;
        metadata.characterClass = _characterClass;
        metadata.classDescription = _classDescription;
        metadata.gender = _gender;
        metadata.background = _background;
        metadata.backgroundDescription = _backgroundDescription;
        metadata.colorPalette = _colorPalette;
        metadata.colorVibe = _colorVibe;
        metadata.clothing = _clothing;
        metadata.accessories = _accessories;
        metadata.items = _items;
        metadata.mintedAt = block.timestamp;

        // Store mappings
        fidToTokenId[_fid] = tokenId;
        tokenIdToFid[tokenId] = _fid;
        fidMinted[_fid] = true;

        // Mint NFT
        _safeMint(_to, tokenId);
        _setTokenURI(tokenId, _tokenURI);

        emit NFTMinted(_to, tokenId, _fid, _characterClass, _background, _colorPalette);

        return tokenId;
    }

    /**
     * @dev Check if FID has already minted
     */
    function hasMinted(uint256 _fid) public view returns (bool) {
        return fidMinted[_fid];
    }

    /**
     * @dev Get token ID by FID
     */
    function getTokenIdByFid(uint256 _fid) public view returns (uint256) {
        require(fidMinted[_fid], "FID has not minted");
        return fidToTokenId[_fid];
    }

    /**
     * @dev Get FID by token ID
     */
    function getFidByTokenId(uint256 _tokenId) public view returns (uint256) {
        require(_ownerOf(_tokenId) != address(0), "Token does not exist");
        return tokenIdToFid[_tokenId];
    }

    /**
     * @dev Get full metadata by token ID
     */
    function getMetadata(uint256 _tokenId) public view returns (NFTMetadata memory) {
        require(_ownerOf(_tokenId) != address(0), "Token does not exist");
        return tokenMetadata[_tokenId];
    }

    /**
     * @dev Get total minted count
     */
    function totalSupply() public view returns (uint256) {
        return _tokenIdCounter - 1;
    }

    /**
     * @dev Get remaining supply
     */
    function remainingSupply() public view returns (uint256) {
        return MAX_SUPPLY - (_tokenIdCounter - 1);
    }

    // Required overrides
    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
