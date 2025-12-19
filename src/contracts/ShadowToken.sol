// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ShadowToken
 * @notice $SHADOW token for FrameFusion Genesis ecosystem
 * @dev ERC20 token with burn functionality and owner minting
 */
contract ShadowToken is ERC20, ERC20Burnable, Ownable {
    
    // Constants
    uint256 public constant INITIAL_SUPPLY = 100_000_000 * 10**18; // 100 million tokens
    uint256 public constant MAX_SUPPLY = 1_000_000_000 * 10**18; // 1 billion max supply
    
    // Events
    event TokensMinted(address indexed to, uint256 amount, string reason);
    event TokensBurned(address indexed from, uint256 amount, string reason);
    event RewardDistributed(address indexed to, uint256 amount, string rewardType);
    
    constructor() ERC20("Shadow Token", "SHADOW") Ownable(msg.sender) {
        // Mint initial supply to deployer
        _mint(msg.sender, INITIAL_SUPPLY);
    }
    
    /**
     * @notice Mint new tokens (only owner)
     * @dev Respects MAX_SUPPLY cap
     */
    function mint(address to, uint256 amount, string memory reason) external onlyOwner {
        require(to != address(0), "Cannot mint to zero address");
        require(totalSupply() + amount <= MAX_SUPPLY, "Max supply exceeded");
        
        _mint(to, amount);
        emit TokensMinted(to, amount, reason);
    }
    
    /**
     * @notice Batch mint to multiple addresses
     */
    function batchMint(
        address[] memory recipients,
        uint256[] memory amounts,
        string memory reason
    ) external onlyOwner {
        require(recipients.length == amounts.length, "Arrays length mismatch");
        
        for (uint256 i = 0; i < recipients.length; i++) {
            require(recipients[i] != address(0), "Cannot mint to zero address");
            require(totalSupply() + amounts[i] <= MAX_SUPPLY, "Max supply exceeded");
            
            _mint(recipients[i], amounts[i]);
            emit TokensMinted(recipients[i], amounts[i], reason);
        }
    }
    
    /**
     * @notice Distribute rewards to users
     * @dev Helper function for game rewards
     */
    function distributeReward(address to, uint256 amount, string memory rewardType) external onlyOwner {
        require(to != address(0), "Cannot distribute to zero address");
        require(totalSupply() + amount <= MAX_SUPPLY, "Max supply exceeded");
        
        _mint(to, amount);
        emit RewardDistributed(to, amount, rewardType);
    }
    
    /**
     * @notice Burn tokens with reason tracking
     */
    function burnWithReason(uint256 amount, string memory reason) external {
        burn(amount);
        emit TokensBurned(msg.sender, amount, reason);
    }
    
    /**
     * @notice Burn tokens from address with reason
     */
    function burnFromWithReason(address account, uint256 amount, string memory reason) external {
        burnFrom(account, amount);
        emit TokensBurned(account, amount, reason);
    }
    
    /**
     * @notice Get token info
     */
    function tokenInfo() external view returns (
        string memory name_,
        string memory symbol_,
        uint8 decimals_,
        uint256 totalSupply_,
        uint256 maxSupply_
    ) {
        return (
            name(),
            symbol(),
            decimals(),
            totalSupply(),
            MAX_SUPPLY
        );
    }
}
