// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// This is a Remix-ready version with all OpenZeppelin imports included
// Deploy this file directly in Remix IDE

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title FrameFusionGenesisV2
 * @dev NFT contract that stores complete metadata on-chain
 */
contract FrameFusionGenesisV2 is ERC721, ERC721URIStorage, Ownable {
    
    // Struct to store complete NFT metadata on-chain
    struct NFTMetadata {
        uint256 fid;                    // Farcaster ID
        string characterClass;          // e.g., "Swordmaster", "Tech Hacker"
        string classDescription;        // e.g., "elite dual-blade wielder"
        string gender;                  // "male" or "female"
        string background;              // e.g., "Crystal Palace"
        string backgroundDescription;   // Detailed background description
        string colorPalette;            // e.g., "Crimson Abyss"
        string colorVibe;               // e.g., "dramatic and fierce"
        string clothing;                // e.g., "armored jacket with leather straps"
        string accessories;             // e.g., "floating sword aura"
        string items;                   // e.g., "legendary twin swords"
        uint256 mintedAt;              // Timestamp when minted
    }

    // Token ID counter
    uint256 private _nextTokenId = 1;

    // Mappings
    mapping(uint256 => uint256) public fidToTokenId;      // FID -> Token ID
    mapping(uint256 => uint256) public tokenIdToFid;      // Token ID -> FID
    mapping(uint256 => NFTMetadata) public tokenMetadata; // Token ID -> Metadata
    mapping(uint256 => bool) public hasMinted;            // FID -> Has Minted

    // Events
    event NFTMinted(
        address indexed to,
        uint256 indexed tokenId,
        uint256 indexed fid,
        string characterClass,
        string background,
        string colorPalette
    );

    constructor() ERC721("FrameFusion Genesis V2", "FFG2") Ownable(msg.sender) {}

    /**
     * @dev Mint NFT with complete metadata
     */
    function safeMint(
        address _to,
        uint256 _fid,
        string memory _tokenURI,
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
        // Check if FID has already minted
        require(!hasMinted[_fid], "FID has already minted an NFT");
        
        // Get current token ID
        uint256 tokenId = _nextTokenId++;

        // Mint the NFT
        _safeMint(_to, tokenId);
        _setTokenURI(tokenId, _tokenURI);

        // Store mappings
        fidToTokenId[_fid] = tokenId;
        tokenIdToFid[tokenId] = _fid;
        hasMinted[_fid] = true;

        // Store metadata using storage pointer (more gas efficient)
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

        // Emit event
        emit NFTMinted(_to, tokenId, _fid, _characterClass, _background, _colorPalette);

        return tokenId;
    }

    /**
     * @dev Get token ID by FID
     */
    function getTokenIdByFid(uint256 _fid) public view returns (uint256) {
        require(hasMinted[_fid], "FID has not minted yet");
        return fidToTokenId[_fid];
    }

    /**
     * @dev Get complete metadata by token ID
     */
    function getMetadata(uint256 _tokenId) public view returns (NFTMetadata memory) {
        require(_ownerOf(_tokenId) != address(0), "Token does not exist");
        return tokenMetadata[_tokenId];
    }

    /**
     * @dev Get complete metadata by FID
     */
    function getMetadataByFid(uint256 _fid) public view returns (NFTMetadata memory) {
        require(hasMinted[_fid], "FID has not minted yet");
        uint256 tokenId = fidToTokenId[_fid];
        return tokenMetadata[tokenId];
    }

    /**
     * @dev Check if FID has minted
     */
    function checkIfMinted(uint256 _fid) public view returns (bool) {
        return hasMinted[_fid];
    }

    /**
     * @dev Get total supply
     */
    function totalSupply() public view returns (uint256) {
        return _nextTokenId - 1;
    }

    // Required overrides
    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
