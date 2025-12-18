// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title FrameShadows
 * @notice Monster NFT contract with payable minting and ETH withdrawal
 * @dev Payment collection and withdrawal functionality included
 */
contract FrameShadows is ERC721, ERC721URIStorage, Ownable {
    // Events
    event MonsterMinted(
        address indexed to,
        uint256 indexed tokenId,
        uint256 indexed monsterId,
        string monsterType,
        string rarity,
        uint256 paid
    );
    event MonsterDefeated(
        uint256 indexed monsterTokenId,
        uint256 indexed characterTokenId,
        address indexed winner
    );
    event MetadataUpdated(uint256 indexed tokenId, string newTokenURI);
    event FundsWithdrawn(address indexed owner, uint256 amount);

    // State variables
    uint256 private _tokenIdCounter;
    uint256 public constant MAX_SUPPLY = 300; // Limited monster supply
    uint256 public constant MINT_PRICE = 0.0001 ether; // 0.0001 ETH per mint
    
    // Mappings
    mapping(uint256 => uint256) public tokenIdToMonsterId; // Token ID => Monster ID (for trait generation)
    mapping(uint256 => uint256) public monsterPowerLevel; // Token ID => Power Level
    mapping(uint256 => uint256) public monsterLevel; // Token ID => Monster Level (starts at 1)
    mapping(uint256 => uint256) public defeatedCount; // Token ID => Times defeated in battle
    mapping(uint256 => bool) public isWildMonster; // Token ID => Is wild (not owned by player)

    constructor() ERC721("FrameShadows", "FSHD") Ownable(msg.sender) {
        _tokenIdCounter = 1; // Start from 1
    }

    /**
     * @notice Get monster ID by token ID
     */
    function getMonsterIdByTokenId(uint256 _tokenId) external view returns (uint256) {
        require(_ownerOf(_tokenId) != address(0), "Token does not exist");
        return tokenIdToMonsterId[_tokenId];
    }

    /**
     * @notice Get all token IDs owned by an address
     */
    function tokensOfOwner(address _owner) external view returns (uint256[] memory) {
        uint256 tokenCount = balanceOf(_owner);
        uint256[] memory tokenIds = new uint256[](tokenCount);
        uint256 index = 0;
        
        for (uint256 i = 1; i < _tokenIdCounter && index < tokenCount; i++) {
            if (_ownerOf(i) == _owner) {
                tokenIds[index] = i;
                index++;
            }
        }
        
        return tokenIds;
    }

    /**
     * @notice Mint new monster NFT (PUBLIC PAYABLE)
     * @dev Anyone can mint by paying MINT_PRICE (0.0001 ETH)
     */
    function mintMonster(
        uint256 _monsterId,
        uint256 _powerLevel,
        string memory _tokenURI,
        bool _isWild
    ) public payable returns (uint256) {
        require(_tokenIdCounter <= MAX_SUPPLY, "Max supply reached");
        require(msg.value >= MINT_PRICE, "Insufficient payment");

        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;

        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, _tokenURI);

        tokenIdToMonsterId[tokenId] = _monsterId;
        monsterPowerLevel[tokenId] = _powerLevel;
        monsterLevel[tokenId] = 1; // All monsters start at level 1
        isWildMonster[tokenId] = _isWild;

        emit MonsterMinted(msg.sender, tokenId, _monsterId, "FrameShadow", "TBD", msg.value);
        
        // Refund excess payment
        if (msg.value > MINT_PRICE) {
            payable(msg.sender).transfer(msg.value - MINT_PRICE);
        }
        
        return tokenId;
    }

    /**
     * @notice Owner mint (free, for admin/testing)
     */
    function ownerMint(
        address _to,
        uint256 _monsterId,
        uint256 _powerLevel,
        string memory _tokenURI,
        bool _isWild
    ) public onlyOwner returns (uint256) {
        require(_tokenIdCounter <= MAX_SUPPLY, "Max supply reached");
        require(_to != address(0), "Cannot mint to zero address");

        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;

        _safeMint(_to, tokenId);
        _setTokenURI(tokenId, _tokenURI);

        tokenIdToMonsterId[tokenId] = _monsterId;
        monsterPowerLevel[tokenId] = _powerLevel;
        monsterLevel[tokenId] = 1;
        isWildMonster[tokenId] = _isWild;

        emit MonsterMinted(_to, tokenId, _monsterId, "FrameShadow", "TBD", 0);
        return tokenId;
    }

    /**
     * @notice Withdraw all ETH from contract to owner
     * @dev Only owner can withdraw
     */
    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        
        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Withdrawal failed");
        
        emit FundsWithdrawn(owner(), balance);
    }

    /**
     * @notice Withdraw specific amount of ETH
     */
    function withdrawAmount(uint256 _amount) external onlyOwner {
        require(_amount > 0, "Amount must be greater than 0");
        require(address(this).balance >= _amount, "Insufficient balance");
        
        (bool success, ) = payable(owner()).call{value: _amount}("");
        require(success, "Withdrawal failed");
        
        emit FundsWithdrawn(owner(), _amount);
    }

    /**
     * @notice Get contract balance
     */
    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }

    /**
     * @notice Record monster defeat in battle
     * @dev Called by battle system contract
     */
    function recordDefeat(uint256 _monsterTokenId, uint256 _characterTokenId, address _winner) external onlyOwner {
        require(_ownerOf(_monsterTokenId) != address(0), "Monster does not exist");
        
        defeatedCount[_monsterTokenId]++;
        
        emit MonsterDefeated(_monsterTokenId, _characterTokenId, _winner);
    }

    /**
     * @notice Update monster power level (from battle system)
     */
    function updatePowerLevel(uint256 _tokenId, uint256 _newPowerLevel) external onlyOwner {
        require(_ownerOf(_tokenId) != address(0), "Token does not exist");
        monsterPowerLevel[_tokenId] = _newPowerLevel;
    }

    /**
     * @notice Update monster level (from battle/training system)
     */
    function updateMonsterLevel(uint256 _tokenId, uint256 _newLevel) external onlyOwner {
        require(_ownerOf(_tokenId) != address(0), "Token does not exist");
        require(_newLevel > 0, "Level must be greater than 0");
        monsterLevel[_tokenId] = _newLevel;
    }

    /**
     * @notice Update token URI
     */
    function updateTokenURI(uint256 _tokenId, string memory _newTokenURI) external onlyOwner {
        require(_ownerOf(_tokenId) != address(0), "Token does not exist");
        _setTokenURI(_tokenId, _newTokenURI);
        emit MetadataUpdated(_tokenId, _newTokenURI);
    }

    /**
     * @notice Batch update token URIs
     */
    function batchUpdateTokenURI(uint256[] memory _tokenIds, string[] memory _newTokenURIs) external onlyOwner {
        require(_tokenIds.length == _newTokenURIs.length, "Arrays length mismatch");
        
        for (uint256 i = 0; i < _tokenIds.length; i++) {
            require(_ownerOf(_tokenIds[i]) != address(0), "Token does not exist");
            _setTokenURI(_tokenIds[i], _newTokenURIs[i]);
            emit MetadataUpdated(_tokenIds[i], _newTokenURIs[i]);
        }
    }

    /**
     * @notice Get total supply minted
     */
    function totalSupply() external view returns (uint256) {
        return _tokenIdCounter - 1;
    }

    /**
     * @notice Get monster stats
     */
    function getMonsterStats(uint256 _tokenId) external view returns (
        uint256 monsterId,
        uint256 powerLevel,
        uint256 level,
        uint256 defeatedTimes,
        bool wild
    ) {
        require(_ownerOf(_tokenId) != address(0), "Token does not exist");
        
        return (
            tokenIdToMonsterId[_tokenId],
            monsterPowerLevel[_tokenId],
            monsterLevel[_tokenId],
            defeatedCount[_tokenId],
            isWildMonster[_tokenId]
        );
    }

    // Allow contract to receive ETH
    receive() external payable {}
    fallback() external payable {}

    // Required overrides
    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
