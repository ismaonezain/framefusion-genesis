// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

interface IShadowToken {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

interface IFrameShadows {
    function ownerOf(uint256 tokenId) external view returns (address);
    function getMonsterStats(uint256 tokenId) external view returns (
        uint256 monsterId,
        uint256 powerLevel,
        uint256 level,
        uint256 defeatedTimes,
        bool wild
    );
}

interface IWeaponNFT {
    function ownerOf(uint256 tokenId) external view returns (address);
    function getWeaponStats(uint256 tokenId) external view returns (
        uint8 class,
        string memory typeStr,
        uint8 rarity,
        uint8 level,
        uint256 attack,
        uint256 equipped,
        bool broken
    );
}

/**
 * @title BattleArena
 * @notice On-chain battle system for FrameFusion Genesis
 */
contract BattleArena is AccessControl, ReentrancyGuard, Pausable {
    
    bytes32 public constant BATTLE_OPERATOR_ROLE = keccak256("BATTLE_OPERATOR_ROLE");
    bytes32 public constant TREASURY_MANAGER_ROLE = keccak256("TREASURY_MANAGER_ROLE");
    
    IShadowToken public shadowToken;
    IFrameShadows public frameShadowsNFT;
    IWeaponNFT public weaponNFT;
    
    address public treasuryWallet;
    address public rafflePoolWallet;
    
    uint16 public constant FEE_WINNER = 5000;
    uint16 public constant FEE_MONSTER_OWNER = 2500;
    uint16 public constant FEE_TREASURY = 1500;
    uint16 public constant FEE_RAFFLE = 1000;
    
    uint256 public constant FREE_REWARD = 100 * 1e18;
    uint256 public constant STANDARD_MIN = 5000 * 1e18;
    uint256 public constant STANDARD_MAX = 500000 * 1e18;
    uint256 public constant PREMIUM_MIN = 500000 * 1e18;
    uint256 public constant PREMIUM_MAX = 5000000 * 1e18;
    uint256 public constant PREMIUM_MULTIPLIER = 120;
    
    uint16 public constant POWER_COMMON = 150;
    uint16 public constant POWER_UNCOMMON = 200;
    uint16 public constant POWER_RARE = 300;
    uint16 public constant POWER_EPIC = 500;
    uint16 public constant POWER_LEGENDARY = 800;
    
    uint16 public constant ELEMENT_SUPER_EFFECTIVE = 300;
    uint16 public constant ELEMENT_EFFECTIVE = 200;
    uint16 public constant ELEMENT_NEUTRAL = 100;
    uint16 public constant ELEMENT_NOT_EFFECTIVE = 50;
    
    uint16 public constant WEAPON_RARITY_COMMON = 110;
    uint16 public constant WEAPON_RARITY_RARE = 130;
    uint16 public constant WEAPON_RARITY_EPIC = 150;
    uint16 public constant WEAPON_RARITY_LEGENDARY = 200;
    uint16 public constant WEAPON_LEVEL_BONUS = 5;
    uint16 public constant WEAPON_CLASS_MATCH = 50;
    
    struct BattleResult {
        address frameFusionOwner;
        address monsterOwner;
        uint256 monsterTokenId;
        uint256 entryFee;
        uint256 frameFusionReward;
        uint256 monsterOwnerReward;
        uint256 treasuryAmount;
        uint256 raffleAmount;
        uint8 frameFusionClass;
        uint8 monsterElement;
        uint16 powerMultiplier;
        uint16 elementMultiplier;
        uint16 weaponMultiplier;
        uint256 timestamp;
    }
    
    mapping(bytes32 => BattleResult) public battles;
    mapping(address => uint256) public dailyBattleCount;
    mapping(address => uint256) public lastBattleDate;
    uint256 public constant MAX_DAILY_BATTLES = 3;
    uint256 public totalBattles;
    
    event BattleExecuted(
        bytes32 indexed battleId,
        address indexed frameFusionOwner,
        address indexed monsterOwner,
        uint256 entryFee,
        uint256 frameFusionReward
    );
    
    event RewardsDistributed(
        bytes32 indexed battleId,
        uint256 frameFusionReward,
        uint256 monsterOwnerReward,
        uint256 treasuryAmount,
        uint256 raffleAmount
    );
    
    event TreasuryUpdated(address indexed oldTreasury, address indexed newTreasury);
    event RafflePoolUpdated(address indexed oldPool, address indexed newPool);
    
    constructor(
        address _shadowToken,
        address _frameShadowsNFT,
        address _weaponNFT,
        address _treasuryWallet,
        address _rafflePoolWallet
    ) {
        require(_shadowToken != address(0), "Invalid shadow token");
        require(_frameShadowsNFT != address(0), "Invalid monsters NFT");
        require(_weaponNFT != address(0), "Invalid weapon NFT");
        require(_treasuryWallet != address(0), "Invalid treasury");
        require(_rafflePoolWallet != address(0), "Invalid raffle pool");
        
        shadowToken = IShadowToken(_shadowToken);
        frameShadowsNFT = IFrameShadows(_frameShadowsNFT);
        weaponNFT = IWeaponNFT(_weaponNFT);
        treasuryWallet = _treasuryWallet;
        rafflePoolWallet = _rafflePoolWallet;
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(BATTLE_OPERATOR_ROLE, msg.sender);
        _grantRole(TREASURY_MANAGER_ROLE, msg.sender);
    }
    
    function executeBattle(
        uint256 monsterTokenId,
        uint8 frameFusionClass,
        uint8 monsterElement,
        uint256 entryFee,
        uint256 weaponTokenId
    ) external nonReentrant whenNotPaused returns (bytes32) {
        _checkDailyLimit(msg.sender);
        address monsterOwner = _validateBattleEntry(monsterTokenId, entryFee);
        
        (uint16 pMul, uint16 eMul, uint16 wMul) = _calculateMultipliers(
            monsterTokenId,
            frameFusionClass,
            monsterElement,
            weaponTokenId
        );
        
        return _processRewards(
            monsterTokenId,
            frameFusionClass,
            monsterElement,
            entryFee,
            monsterOwner,
            pMul,
            eMul,
            wMul
        );
    }
    
    function _validateBattleEntry(uint256 monsterTokenId, uint256 entryFee) internal returns (address) {
        address monsterOwner = frameShadowsNFT.ownerOf(monsterTokenId);
        require(monsterOwner != msg.sender, "Cannot battle your own monster");
        require(
            entryFee == 0 || 
            (entryFee >= STANDARD_MIN && entryFee <= STANDARD_MAX) ||
            (entryFee >= PREMIUM_MIN && entryFee <= PREMIUM_MAX),
            "Invalid entry fee"
        );
        
        if (entryFee > 0) {
            require(shadowToken.transferFrom(msg.sender, address(this), entryFee), "Entry fee transfer failed");
        }
        
        return monsterOwner;
    }
    
    function _calculateMultipliers(
        uint256 monsterTokenId,
        uint8 frameFusionClass,
        uint8 monsterElement,
        uint256 weaponTokenId
    ) internal view returns (uint16, uint16, uint16) {
        (, uint256 monsterPower, , , ) = frameShadowsNFT.getMonsterStats(monsterTokenId);
        
        uint16 powerMul = _getPowerMultiplier(monsterPower);
        uint16 elementMul = _getElementMultiplier(frameFusionClass, monsterElement);
        uint16 weaponMul = weaponTokenId > 0 ? _getWeaponMultiplier(weaponTokenId, msg.sender, frameFusionClass) : 100;
        
        return (powerMul, elementMul, weaponMul);
    }
    
    function _processRewards(
        uint256 monsterTokenId,
        uint8 frameFusionClass,
        uint8 monsterElement,
        uint256 entryFee,
        address monsterOwner,
        uint16 pMul,
        uint16 eMul,
        uint16 wMul
    ) internal returns (bytes32) {
        bool isPremium = entryFee >= PREMIUM_MIN;
        (uint256 ffReward, uint256 moReward, uint256 tAmount, uint256 rAmount) = _calcRewards(entryFee, pMul, eMul, wMul, isPremium);
        
        _distributeRewards(ffReward, moReward, tAmount, rAmount, msg.sender, monsterOwner);
        
        bytes32 battleId = keccak256(abi.encodePacked(msg.sender, monsterTokenId, block.timestamp, totalBattles));
        
        battles[battleId] = BattleResult({
            frameFusionOwner: msg.sender,
            monsterOwner: monsterOwner,
            monsterTokenId: monsterTokenId,
            entryFee: entryFee,
            frameFusionReward: ffReward,
            monsterOwnerReward: moReward,
            treasuryAmount: tAmount,
            raffleAmount: rAmount,
            frameFusionClass: frameFusionClass,
            monsterElement: monsterElement,
            powerMultiplier: pMul,
            elementMultiplier: eMul,
            weaponMultiplier: wMul,
            timestamp: block.timestamp
        });
        
        totalBattles++;
        
        emit BattleExecuted(battleId, msg.sender, monsterOwner, entryFee, ffReward);
        emit RewardsDistributed(battleId, ffReward, moReward, tAmount, rAmount);
        
        return battleId;
    }
    
    function _checkDailyLimit(address user) internal {
        uint256 today = block.timestamp / 1 days;
        uint256 lastDay = lastBattleDate[user] / 1 days;
        
        if (today > lastDay) {
            dailyBattleCount[user] = 0;
            lastBattleDate[user] = block.timestamp;
        }
        
        require(dailyBattleCount[user] < MAX_DAILY_BATTLES, "Daily battle limit reached");
        dailyBattleCount[user]++;
    }
    
    function _getPowerMultiplier(uint256 power) internal pure returns (uint16) {
        if (power >= 1600) return POWER_LEGENDARY;
        if (power >= 800) return POWER_EPIC;
        if (power >= 400) return POWER_RARE;
        if (power >= 200) return POWER_UNCOMMON;
        return POWER_COMMON;
    }
    
    function _getElementMultiplier(uint8 classType, uint8 element) internal pure returns (uint16) {
        uint256 seed = uint256(keccak256(abi.encodePacked(classType, element)));
        uint256 matchup = seed % 100;
        
        if (matchup < 10) return ELEMENT_SUPER_EFFECTIVE;
        if (matchup < 30) return ELEMENT_EFFECTIVE;
        if (matchup < 80) return ELEMENT_NEUTRAL;
        return ELEMENT_NOT_EFFECTIVE;
    }
    
    function _getWeaponMultiplier(uint256 weaponTokenId, address owner, uint8 frameFusionClass) internal view returns (uint16) {
        require(weaponNFT.ownerOf(weaponTokenId) == owner, "Not weapon owner");
        
        (uint8 weaponClass, , uint8 rarity, uint8 level, , , bool broken) = weaponNFT.getWeaponStats(weaponTokenId);
        require(!broken, "Weapon is broken");
        
        uint16 rarityMul = rarity == 0 ? WEAPON_RARITY_COMMON : rarity == 1 ? WEAPON_RARITY_RARE : rarity == 2 ? WEAPON_RARITY_EPIC : WEAPON_RARITY_LEGENDARY;
        uint16 levelMul = 100 + (uint16(level) * WEAPON_LEVEL_BONUS);
        uint16 classBonus = weaponClass == frameFusionClass ? WEAPON_CLASS_MATCH : 0;
        
        return uint16(uint256(rarityMul) * uint256(levelMul) * (100 + uint256(classBonus)) / 10000);
    }
    
    function _calcRewards(
        uint256 entryFee,
        uint16 pMul,
        uint16 eMul,
        uint16 wMul,
        bool isPremium
    ) internal pure returns (uint256, uint256, uint256, uint256) {
        if (entryFee == 0) return (FREE_REWARD, 0, 0, 0);
        
        uint256 basePool = entryFee * FEE_WINNER / 10000;
        uint256 ffReward = basePool * pMul * eMul * wMul / 1000000;
        
        if (isPremium) ffReward = ffReward * PREMIUM_MULTIPLIER / 100;
        
        return (
            ffReward,
            entryFee * FEE_MONSTER_OWNER / 10000,
            entryFee * FEE_TREASURY / 10000,
            entryFee * FEE_RAFFLE / 10000
        );
    }
    
    function _distributeRewards(
        uint256 ffReward,
        uint256 moReward,
        uint256 tAmount,
        uint256 rAmount,
        address ffOwner,
        address moOwner
    ) internal {
        if (ffReward > 0) require(shadowToken.transfer(ffOwner, ffReward), "FF reward failed");
        if (moReward > 0) require(shadowToken.transfer(moOwner, moReward), "MO reward failed");
        if (tAmount > 0) require(shadowToken.transfer(treasuryWallet, tAmount), "Treasury failed");
        if (rAmount > 0) require(shadowToken.transfer(rafflePoolWallet, rAmount), "Raffle failed");
    }
    
    function getRemainingBattles(address user) external view returns (uint256) {
        uint256 today = block.timestamp / 1 days;
        uint256 lastDay = lastBattleDate[user] / 1 days;
        return today > lastDay ? MAX_DAILY_BATTLES : MAX_DAILY_BATTLES - dailyBattleCount[user];
    }
    
    function getBattle(bytes32 battleId) external view returns (BattleResult memory) {
        return battles[battleId];
    }
    
    function updateTreasuryWallet(address newTreasury) external onlyRole(TREASURY_MANAGER_ROLE) {
        require(newTreasury != address(0), "Invalid treasury");
        address oldTreasury = treasuryWallet;
        treasuryWallet = newTreasury;
        emit TreasuryUpdated(oldTreasury, newTreasury);
    }
    
    function updateRafflePoolWallet(address newPool) external onlyRole(TREASURY_MANAGER_ROLE) {
        require(newPool != address(0), "Invalid pool");
        address oldPool = rafflePoolWallet;
        rafflePoolWallet = newPool;
        emit RafflePoolUpdated(oldPool, newPool);
    }
    
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }
    
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }
    
    function emergencyWithdraw(address token, uint256 amount) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(IShadowToken(token).transfer(msg.sender, amount), "Emergency withdraw failed");
    }
}
