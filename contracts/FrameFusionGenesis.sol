haha
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title FrameFusion Genesis
 * @dev NFT Collection with max supply of 3000
 * @notice Each NFT is generated from user's profile picture
 * @author ismaone.farcaster.eth
 */
contract FrameFusionGenesis is ERC721, ERC721URIStorage, Ownable {
    uint256 private _nextTokenId;
    uint256 public constant MAX_SUPPLY = 3000;
    
    // Mapping from FID to token ID
    mapping(uint256 => uint256) public fidToTokenId;
    
    // Mapping from token ID to FID
    mapping(uint256 => uint256) public tokenIdToFid;
    
    event NFTMinted(address indexed to, uint256 indexed tokenId, uint256 indexed fid);
    
    constructor() ERC721("FrameFusion Genesis", "FFG") Ownable(msg.sender) {
        _nextTokenId = 1; // Start token IDs from 1
    }
    
    /**
     * @dev Mint a new NFT with FID tracking
     * @param _to Address to mint to
     * @param _tokenURI Metadata URI (IPFS)
     * @param _fid Farcaster ID of the user
     */
    function safeMint(address _to, string memory _tokenURI, uint256 _fid) public onlyOwner returns (uint256) {
        require(_nextTokenId <= MAX_SUPPLY, "Max supply reached");
        require(fidToTokenId[_fid] == 0, "FID already minted");
        
        uint256 tokenId = _nextTokenId++;
        
        _safeMint(_to, tokenId);
        _setTokenURI(tokenId, _tokenURI);
        
        // Track FID mapping
        fidToTokenId[_fid] = tokenId;
        tokenIdToFid[tokenId] = _fid;
        
        emit NFTMinted(_to, tokenId, _fid);
        
        return tokenId;
    }
    
    /**
     * @dev Get total supply of minted NFTs
     */
    function totalSupply() public view returns (uint256) {
        return _nextTokenId - 1;
    }
    
    /**
     * @dev Check if FID has already minted
     */
    function hasMinted(uint256 _fid) public view returns (bool) {
        return fidToTokenId[_fid] != 0;
    }
    
    /**
     * @dev Get token ID by FID
     */
    function getTokenIdByFid(uint256 _fid) public view returns (uint256) {
        require(fidToTokenId[_fid] != 0, "FID has not minted");
        return fidToTokenId[_fid];
    }
    
    /**
     * @dev Get FID by token ID
     */
    function getFidByTokenId(uint256 _tokenId) public view returns (uint256) {
        require(_tokenId > 0 && _tokenId < _nextTokenId, "Invalid token ID");
        return tokenIdToFid[_tokenId];
    }
    
    /**
     * @dev Returns remaining NFTs available to mint
     */
    function remainingSupply() public view returns (uint256) {
        uint256 minted = totalSupply();
        return minted >= MAX_SUPPLY ? 0 : MAX_SUPPLY - minted;
    }
    
    // Override required functions
    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }
    
    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
