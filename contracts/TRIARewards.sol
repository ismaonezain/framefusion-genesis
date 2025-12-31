hahaha
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title TRIARewards
 * @dev Daily check-in and claim system for FrameFusion Genesis NFT holders
 * - Users must hold FrameFusion Genesis NFT to claim
 * - Users must check-in before claiming
 * - Max 300 claimers per day
 * - 50,000 TRIA per claim
 * - Resets daily at 00:00 UTC
 */
contract TRIARewards is Ownable, ReentrancyGuard {
    IERC20 public triaToken;
    IERC721 public nftContract;
    
    uint256 public constant CLAIM_AMOUNT = 50000 * 10**18; // 50k TRIA
    uint256 public constant MAX_DAILY_CLAIMERS = 300;
    uint256 public constant SECONDS_PER_DAY = 86400;
    
    // Track check-ins: user address => day number => checked in
    mapping(address => mapping(uint256 => bool)) public checkIns;
    
    // Track claims: user address => day number => claimed
    mapping(address => mapping(uint256 => bool)) public claims;
    
    // Track streak: user address => streak count
    mapping(address => uint256) public streaks;
    
    // Track last check-in day: user address => day number
    mapping(address => uint256) public lastCheckInDay;
    
    // Track daily claimers count: day number => count
    mapping(uint256 => uint256) public dailyClaimersCount;
    
    event CheckIn(address indexed user, uint256 indexed day, uint256 streak);
    event Claimed(address indexed user, uint256 indexed day, uint256 amount);
    event TokensDeposited(address indexed from, uint256 amount);
    event TokensWithdrawn(address indexed to, uint256 amount);
    
    constructor(address _triaToken, address _nftContract) Ownable(msg.sender) {
        triaToken = IERC20(_triaToken);
        nftContract = IERC721(_nftContract);
    }
    
    /**
     * @dev Get current day number (days since Unix epoch)
     */
    function getCurrentDay() public view returns (uint256) {
        return block.timestamp / SECONDS_PER_DAY;
    }
    
    /**
     * @dev Check if user has checked in today
     */
    function hasCheckedInToday(address user) public view returns (bool) {
        uint256 today = getCurrentDay();
        return checkIns[user][today];
    }
    
    /**
     * @dev Check if user has claimed today
     */
    function hasClaimedToday(address user) public view returns (bool) {
        uint256 today = getCurrentDay();
        return claims[user][today];
    }
    
    /**
     * @dev Get user's current streak
     */
    function getUserStreak(address user) public view returns (uint256) {
        return streaks[user];
    }
    
    /**
     * @dev Get remaining claim slots for today
     */
    function getRemainingSlots() public view returns (uint256) {
        uint256 today = getCurrentDay();
        uint256 claimed = dailyClaimersCount[today];
        if (claimed >= MAX_DAILY_CLAIMERS) {
            return 0;
        }
        return MAX_DAILY_CLAIMERS - claimed;
    }
    
    /**
     * @dev Check if user holds NFT
     */
    function holdsNFT(address user) public view returns (bool) {
        return nftContract.balanceOf(user) > 0;
    }
    
    /**
     * @dev User checks in for today
     */
    function checkIn() external nonReentrant {
        uint256 today = getCurrentDay();
        require(!checkIns[msg.sender][today], "Already checked in today");
        
        checkIns[msg.sender][today] = true;
        
        // Update streak
        uint256 lastDay = lastCheckInDay[msg.sender];
        if (lastDay == 0) {
            // First check-in ever
            streaks[msg.sender] = 1;
        } else if (lastDay == today - 1) {
            // Consecutive day
            streaks[msg.sender]++;
        } else if (lastDay < today - 1) {
            // Missed days, reset streak
            streaks[msg.sender] = 1;
        }
        // If lastDay == today, this shouldn't happen (already checked)
        
        lastCheckInDay[msg.sender] = today;
        
        emit CheckIn(msg.sender, today, streaks[msg.sender]);
    }
    
    /**
     * @dev User claims TRIA tokens
     * Requirements:
     * - Must hold NFT
     * - Must have checked in today
     * - Must not have claimed today
     * - Daily limit must not be reached
     */
    function claim() external nonReentrant {
        uint256 today = getCurrentDay();
        
        require(holdsNFT(msg.sender), "Must hold FrameFusion Genesis NFT");
        require(checkIns[msg.sender][today], "Must check in first");
        require(!claims[msg.sender][today], "Already claimed today");
        require(dailyClaimersCount[today] < MAX_DAILY_CLAIMERS, "Daily limit reached");
        require(triaToken.balanceOf(address(this)) >= CLAIM_AMOUNT, "Insufficient contract balance");
        
        // Mark as claimed
        claims[msg.sender][today] = true;
        dailyClaimersCount[today]++;
        
        // Transfer TRIA tokens
        require(triaToken.transfer(msg.sender, CLAIM_AMOUNT), "Transfer failed");
        
        emit Claimed(msg.sender, today, CLAIM_AMOUNT);
    }
    
    /**
     * @dev Owner deposits TRIA tokens to contract
     */
    function depositTokens(uint256 amount) external onlyOwner {
        require(triaToken.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        emit TokensDeposited(msg.sender, amount);
    }
    
    /**
     * @dev Owner withdraws TRIA tokens from contract
     */
    function withdrawTokens(uint256 amount) external onlyOwner {
        require(triaToken.transfer(msg.sender, amount), "Transfer failed");
        emit TokensWithdrawn(msg.sender, amount);
    }
    
    /**
     * @dev Get contract token balance
     */
    function getContractBalance() external view returns (uint256) {
        return triaToken.balanceOf(address(this));
    }
    
    /**
     * @dev Update TRIA token address (emergency use only)
     */
    function updateTriaToken(address _triaToken) external onlyOwner {
        triaToken = IERC20(_triaToken);
    }
    
    /**
     * @dev Update NFT contract address (emergency use only)
     */
    function updateNftContract(address _nftContract) external onlyOwner {
        nftContract = IERC721(_nftContract);
    }
}
