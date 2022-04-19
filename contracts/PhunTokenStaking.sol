//SPDX-License-Identifier: MIT

pragma solidity 0.8.13;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "hardhat/console.sol";

interface IWhitelist {
    function isWhitelisted(address account) external view returns (bool);
}

contract PhunTokenStakingUniswapV2 is Ownable {
    using SafeERC20 for IERC20;
    IERC20 public rewardToken;
    IERC20 public stakedToken;
    IWhitelist public whitelistContract;
    uint256 public totalSupply;
    uint256 public rewardRate;
    uint64 public periodFinish;
    uint64 public lastUpdateTime;
    uint128 public rewardPerTokenStored;
    bool public rewardsWithdrawn = false;
    uint8 public exitPercent;
    address public treasury;
    mapping (address => bool) public whitelist;
    mapping(address => uint256) private _balances;
    struct UserRewards {
        uint128 earnedToDate;
        uint128 userRewardPerTokenPaid;
        uint128 rewards;
    }
    mapping(address => UserRewards) public userRewards;
    
    event RewardAdded(uint256 reward);
    event RewardPaid(address indexed user, uint256 reward);
    event Staked(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event ExitStaked(address indexed user);
    event EnterStaked(address indexed user);

    constructor(IERC20 _rewardToken, IERC20 _stakedToken, IWhitelist _whitelistAddress, address _treasuryAddress) {
        require(address(_rewardToken) != address(0) && address(_stakedToken) != address(0) && address(_whitelistAddress) != address(0) && _treasuryAddress != address(0), "PHTK Staking: Cannot addresses to zero address");
        rewardToken = _rewardToken;
        stakedToken = _stakedToken;
        whitelistContract = _whitelistAddress;
        treasury = _treasuryAddress;
    }

    modifier onlyWhitelist(address account) {
        require(isWhitelisted(account), "PHTK Staking: User is not whitelisted.");
        _;
    }

    modifier updateReward(address account) {
        uint128 _rewardPerTokenStored = rewardPerToken();
        lastUpdateTime = lastTimeRewardApplicable();
        rewardPerTokenStored = _rewardPerTokenStored;
        console.log("address %s",account);
        console.log("reward account token %s %d",userRewards[account].rewards);
        userRewards[account].rewards = earned(account);
        console.log("reward account token %s",userRewards[account].rewards);
        userRewards[account].userRewardPerTokenPaid = _rewardPerTokenStored;
        _;
    }

    function balanceOf(address account) public view returns (uint256) {
        return _balances[account];
    }

    function lastTimeRewardApplicable() public view returns (uint64) {
        uint64 blockTimestamp = uint64(block.timestamp);
            console.log("blockTimestamp %s",blockTimestamp); 
            console.log("periodFinish %s",periodFinish); 
        return blockTimestamp < periodFinish ? blockTimestamp : periodFinish;
    }

    function rewardPerToken() public view returns (uint128) {
        uint256 totalStakedSupply = totalSupply;
        if (totalStakedSupply == 0)
            return rewardPerTokenStored;
        unchecked {
            uint256 rewardDuration = lastTimeRewardApplicable() - lastUpdateTime;
            console.log("rewardduration %s",rewardDuration); 
            console.log("periodFinish %s",periodFinish); 
            return uint128(rewardPerTokenStored + rewardDuration * rewardRate * 1e18 / totalStakedSupply);
        }
    }

    function earned(address account) public view returns (uint128) {
        unchecked {
            console.log("EArned %s",uint128(balanceOf(account) * (rewardPerToken() - userRewards[account].userRewardPerTokenPaid) /1e18 + userRewards[account].rewards));
            return uint128(balanceOf(account) * (rewardPerToken() - userRewards[account].userRewardPerTokenPaid) /1e18 + userRewards[account].rewards);
        }
    }

    function stake(uint128 amount) external onlyWhitelist(msg.sender) updateReward(msg.sender) {
        console.log("blockTimestamp after %s",block.timestamp);
        require(amount > 0, "PHTK Staking: Cannot stake 0 Tokens");
        if (_balances[msg.sender] == 0)
            emit EnterStaked(msg.sender);
        stakedToken.safeTransferFrom(msg.sender, address(this), amount);
        unchecked {
            totalSupply += amount;
            _balances[msg.sender] += amount;
        }
        console.log("address staking %s",msg.sender);
        emit Staked(msg.sender, amount);
    }

    function withdraw(uint128 amount) public updateReward(msg.sender) {
        require(amount > 0, "PHTK Staking: Cannot withdraw 0 LP Tokens");
        require(amount <= _balances[msg.sender], "PHTK Staking: Cannot withdraw more LP Tokens than user staking balance");
        if(amount == _balances[msg.sender])
            emit ExitStaked(msg.sender);
        unchecked {
            _balances[msg.sender] -= amount;
            totalSupply -= amount;
        }
        stakedToken.safeTransfer(msg.sender, amount);
        emit Withdrawn(msg.sender, amount);
    }

    function exit() external {
        if (!rewardsWithdrawn)
            claimReward();
        withdraw(uint128(balanceOf(msg.sender)));
        emit ExitStaked(msg.sender);
    }

    function claimReward() public updateReward(msg.sender) {
        unchecked {
            require(!rewardsWithdrawn, "PHTK Staking: Cannot claim rewards if rewards have been withdrawn by owner.");
            uint256 reward = userRewards[msg.sender].rewards;
            uint256 tax = 0;
            console.log("balance %s",rewardToken.balanceOf(address(this)));
                console.log("Balance of rewards %s",userRewards[msg.sender].rewards);
            if(rewardToken.balanceOf(address(this)) <= reward)
                reward = 0;
            if (reward > 0) {
                userRewards[msg.sender].rewards = 0;
                if(exitPercent != 0 && reward != 0){
                    tax = reward * exitPercent / 100;
                    rewardToken.safeTransfer(treasury, tax);
                    emit RewardPaid(treasury, tax);
                }
                console.log("Reward-tax",reward - tax);
                rewardToken.safeTransfer(msg.sender, reward - tax);
                console.log("Balance of %s",rewardToken.balanceOf(msg.sender));
                userRewards[msg.sender].earnedToDate += uint128(reward - tax);
                emit RewardPaid(msg.sender, reward - tax);
            }
        }
    }

    function setRewardParams(uint128 reward, uint64 duration) external onlyOwner {
        unchecked {
            require(reward > 0);
            rewardPerTokenStored = rewardPerToken();
            uint64 blockTimestamp = uint64(block.timestamp);
            console.log("blockTimestamp %s",blockTimestamp);
            uint256 maxRewardSupply = rewardToken.balanceOf(address(this));
            if(rewardToken == stakedToken)
                maxRewardSupply -= totalSupply;
            uint256 leftover = 0;
            if (blockTimestamp >= periodFinish) {
                rewardRate = reward/duration;
            } else {
                uint256 remaining = periodFinish-blockTimestamp;
                leftover = remaining*rewardRate;
                rewardRate = (reward+leftover)/duration;
            }
            require(reward+leftover <= maxRewardSupply, "PHTK Staking: Not enough tokens to supply Reward Pool");
            lastUpdateTime = blockTimestamp;
            periodFinish = blockTimestamp+duration;
            console.log("setrewardparam periodFinish %s",periodFinish);
            rewardsWithdrawn = false;
            emit RewardAdded(reward);
        }
    }

    function withdrawReward() external onlyOwner {
        uint256 rewardSupply = rewardToken.balanceOf(address(this));
        //ensure funds staked by users can't be transferred out - this only transfers reward token back to contract owner
        unchecked {
            if(rewardToken == stakedToken){
                rewardSupply -= totalSupply;
            }
        }
        rewardToken.safeTransfer(msg.sender, rewardSupply);
        rewardRate = 0;
        periodFinish = uint64(block.timestamp);
        rewardsWithdrawn = true;
    }
    
    function isWhitelisted(address account) public view returns (bool) {
       return whitelistContract.isWhitelisted(account);
    }

    function updateExitStake(uint8 _exitPercent) external onlyOwner() {
        require(_exitPercent <= 20, "PHTK Staking: Exit percent cannot be greater than 20%");
        exitPercent = _exitPercent;
    }

    function updateTreasury(address account) external onlyOwner() {
        require(account != address(0), "PHTK Staking: Cannot set treasury as zero address");
        treasury = account;
    }
}