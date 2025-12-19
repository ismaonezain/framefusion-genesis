// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title WeaponNFT
 * @notice Weapon NFTs for FrameFusion Genesis with 20 weapon types matching character classes
 * @dev Unlimited minting, tradeable on OpenSea, costs go to reserve
 * 
 * Features:
 * - 20 weapon classes (one per FrameFusion character class)
 * - 4 rarity tiers (Common, Rare, Epic, Legendary)
 * - Equipment system (attach to FrameFusions)
 * - Level 1-10 upgrade system (off-chain calculated, on-chain stored)
 * - Weapon breaking mechanic (level 6+ can break on failed upgrades)
 * - All payments go to reserve address
 */
contract WeaponNFT is ERC721, ERC721URIStorage, Ownable, Pausable {
    // Enums
    enum WeaponClass { 
        Swordmaster, ShadowAssassin, HolyKnight, BattleMage, ArcherRanger,
        TechHacker, StreetFighter, MusicianBard, ChefArtisan, PhotographerScout,
        Gunslinger, MedicHealer, EngineerBuilder, DetectiveInvestigator, AthleteChampion,
        BeastTamer, AlchemistSage, SamuraiDuelist, NinjaOperative, DragonKnight
    }
    enum Rarity { Common, Rare, Epic, Legendary }
    
    // Events
    event WeaponMinted(
        address indexed to,
        uint256 indexed tokenId,
        WeaponClass weaponClass,
        string weaponType,
        Rarity rarity,
        uint256 attackPower,
        uint256 paid
    );
    event WeaponEquipped(uint256 indexed weaponTokenId, uint256 indexed frameFusionTokenId, address indexed owner);
    event WeaponUnequipped(uint256 indexed weaponTokenId, uint256 indexed frameFusionTokenId, address indexed owner);
    event WeaponBroken(uint256 indexed weaponTokenId, address indexed owner, uint256 level);
    event MintCostUpdated(Rarity rarity, uint256 newCost);
    event ReserveAddressUpdated(address indexed newReserve);
    
    // State variables
    uint256 private _tokenIdCounter;
    address public reserveAddress;
    
    // Adjustable mint costs (in wei)
    mapping(Rarity => uint256) public mintCosts;
    
    // Weapon stats
    mapping(uint256 => WeaponClass) public weaponClass;
    mapping(uint256 => string) public weaponType;
    mapping(uint256 => Rarity) public weaponRarity;
    mapping(uint256 => uint8) public weaponLevel; // 1-10
    mapping(uint256 => uint256) public attackPower;
    mapping(uint256 => uint256) public equippedTo; // FrameFusion tokenId (0 if unequipped)
    mapping(uint256 => bool) public isBroken;
    
    constructor(address _reserveAddress) ERC721("FrameFusion Weapons", "FWEAP") Ownable(msg.sender) {
        require(_reserveAddress != address(0), "Invalid reserve address");
        reserveAddress = _reserveAddress;
        _tokenIdCounter = 1;
        
        // Set initial mint costs (adjustable by owner)
        mintCosts[Rarity.Common] = 0.0001 ether;       // 100 $SHADOW equivalent
        mintCosts[Rarity.Rare] = 0.0003 ether;         // 300 $SHADOW
        mintCosts[Rarity.Epic] = 0.0008 ether;         // 800 $SHADOW
        mintCosts[Rarity.Legendary] = 0.002 ether;     // 2000 $SHADOW
    }
    
    /**
     * @notice Mint new weapon NFT (PUBLIC PAYABLE)
     * @dev Cost goes to reserve address
     */
    function mintWeapon(
        WeaponClass _weaponClass,
        string memory _weaponType,
        Rarity _rarity,
        uint256 _attackPower,
        string memory _tokenURI
    ) public payable whenNotPaused returns (uint256) {
        uint256 cost = mintCosts[_rarity];
        require(msg.value >= cost, "Insufficient payment");
        
        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;
        
        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, _tokenURI);
        
        weaponClass[tokenId] = _weaponClass;
        weaponType[tokenId] = _weaponType;
        weaponRarity[tokenId] = _rarity;
        weaponLevel[tokenId] = 1; // All weapons start at level 1
        attackPower[tokenId] = _attackPower;
        equippedTo[tokenId] = 0; // Unequipped
        
        // Transfer payment to reserve
        (bool success, ) = payable(reserveAddress).call{value: msg.value}("");
        require(success, "Transfer to reserve failed");
        
        emit WeaponMinted(msg.sender, tokenId, _weaponClass, _weaponType, _rarity, _attackPower, msg.value);
        
        return tokenId;
    }
    
    /**
     * @notice Owner mint (free, for admin/testing)
     */
    function ownerMint(
        address _to,
        WeaponClass _weaponClass,
        string memory _weaponType,
        Rarity _rarity,
        uint256 _attackPower,
        string memory _tokenURI
    ) public onlyOwner returns (uint256) {
        require(_to != address(0), "Cannot mint to zero address");
        
        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;
        
        _safeMint(_to, tokenId);
        _setTokenURI(tokenId, _tokenURI);
        
        weaponClass[tokenId] = _weaponClass;
        weaponType[tokenId] = _weaponType;
        weaponRarity[tokenId] = _rarity;
        weaponLevel[tokenId] = 1;
        attackPower[tokenId] = _attackPower;
        equippedTo[tokenId] = 0;
        
        emit WeaponMinted(_to, tokenId, _weaponClass, _weaponType, _rarity, _attackPower, 0);
        return tokenId;
    }
    
    /**
     * @notice Equip weapon to FrameFusion NFT
     * @dev Only owner can equip, weapon must be unequipped
     */
    function equipWeapon(uint256 _weaponTokenId, uint256 _frameFusionTokenId) external {
        require(ownerOf(_weaponTokenId) == msg.sender, "Not weapon owner");
        require(equippedTo[_weaponTokenId] == 0, "Weapon already equipped");
        require(!isBroken[_weaponTokenId], "Weapon is broken");
        
        equippedTo[_weaponTokenId] = _frameFusionTokenId;
        emit WeaponEquipped(_weaponTokenId, _frameFusionTokenId, msg.sender);
    }
    
    /**
     * @notice Unequip weapon from FrameFusion NFT
     */
    function unequipWeapon(uint256 _weaponTokenId) external {
        require(ownerOf(_weaponTokenId) == msg.sender, "Not weapon owner");
        require(equippedTo[_weaponTokenId] != 0, "Weapon not equipped");
        
        uint256 frameFusionId = equippedTo[_weaponTokenId];
        equippedTo[_weaponTokenId] = 0;
        emit WeaponUnequipped(_weaponTokenId, frameFusionId, msg.sender);
    }
    
    /**
     * @notice Update weapon stats after upgrade (off-chain calculated)
     * @dev Called by backend after successful upgrade
     */
    function updateWeaponStats(
        uint256 _tokenId,
        uint8 _newLevel,
        uint256 _newAttackPower
    ) external onlyOwner {
        require(_ownerOf(_tokenId) != address(0), "Token does not exist");
        require(!isBroken[_tokenId], "Weapon is broken");
        require(_newLevel >= weaponLevel[_tokenId], "Cannot decrease level");
        require(_newLevel <= 10, "Max level is 10");
        
        weaponLevel[_tokenId] = _newLevel;
        attackPower[_tokenId] = _newAttackPower;
    }
    
    /**
     * @notice Mark weapon as broken and burn it (failed upgrade at level 6+)
     * @dev Called by backend when upgrade fails with break condition
     */
    function breakWeapon(uint256 _tokenId) external onlyOwner {
        require(_ownerOf(_tokenId) != address(0), "Token does not exist");
        require(!isBroken[_tokenId], "Weapon already broken");
        
        address owner = ownerOf(_tokenId);
        uint256 level = weaponLevel[_tokenId];
        
        // Unequip if equipped
        if (equippedTo[_tokenId] != 0) {
            equippedTo[_tokenId] = 0;
        }
        
        isBroken[_tokenId] = true;
        
        // Burn the token
        _burn(_tokenId);
        
        emit WeaponBroken(_tokenId, owner, level);
    }
    
    /**
     * @notice Get all token IDs owned by an address
     */
    function tokensOfOwner(address _owner) external view returns (uint256[] memory) {
        uint256 tokenCount = balanceOf(_owner);
        uint256[] memory tokenIds = new uint256[](tokenCount);
        uint256 index = 0;
        
        for (uint256 i = 1; i < _tokenIdCounter && index < tokenCount; i++) {
            if (_ownerOf(i) != address(0) && ownerOf(i) == _owner && !isBroken[i]) {
                tokenIds[index] = i;
                index++;
            }
        }
        
        return tokenIds;
    }
    
    /**
     * @notice Get weapon stats
     */
    function getWeaponStats(uint256 _tokenId) external view returns (
        WeaponClass class,
        string memory typeStr,
        Rarity rarity,
        uint8 level,
        uint256 attack,
        uint256 equipped,
        bool broken
    ) {
        require(_ownerOf(_tokenId) != address(0), "Token does not exist");
        
        return (
            weaponClass[_tokenId],
            weaponType[_tokenId],
            weaponRarity[_tokenId],
            weaponLevel[_tokenId],
            attackPower[_tokenId],
            equippedTo[_tokenId],
            isBroken[_tokenId]
        );
    }
    
    /**
     * @notice Get total supply minted
     */
    function totalSupply() external view returns (uint256) {
        return _tokenIdCounter - 1;
    }
    
    /**
     * @notice Update mint cost for a rarity tier (admin only)
     */
    function updateMintCost(Rarity _rarity, uint256 _newCost) external onlyOwner {
        require(_newCost > 0, "Cost must be greater than 0");
        mintCosts[_rarity] = _newCost;
        emit MintCostUpdated(_rarity, _newCost);
    }
    
    /**
     * @notice Update reserve address (admin only)
     */
    function updateReserveAddress(address _newReserve) external onlyOwner {
        require(_newReserve != address(0), "Invalid reserve address");
        reserveAddress = _newReserve;
        emit ReserveAddressUpdated(_newReserve);
    }
    
    /**
     * @notice Emergency pause (admin only)
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @notice Unpause (admin only)
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @notice Update token URI (for metadata updates)
     */
    function updateTokenURI(uint256 _tokenId, string memory _newTokenURI) external onlyOwner {
        require(_ownerOf(_tokenId) != address(0), "Token does not exist");
        _setTokenURI(_tokenId, _newTokenURI);
    }
    
    // Required overrides
    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }
    
    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
