# Staking Contract

## FAQs

1.  **Does this staking contract have a vesting period?** No, users can withdraw their stake / claim their rewards at any time.  
      
    
2.  **Does this staking contract have a tax?** Yes, there is a configurable variable that only the deployer/owner of the contract can change. The tax is only taken out when a user withdraws their earned rewards. If the tax is 10% when users claim their earned rewards, 10% goes to the PhunToken treasury, and the remaining 90% goes to the user. Tax can be toggled to 0% as well.  
      
    
3.  **What is the APY?** APY cannot be directly set. APY is dynamic based on the number of users in the staking pool, length of staking reward distribution, and amount of reward tokens for distribution.  
      
    
4.  **Is there a whitelist feature?** There is an external contract used to whitelist users for staking. There is an external contract for whitelisting users because there are plans to have multiple LP Staking pool contracts. Having one central whitelist contract is more efficient than individual contract whitelists. A user cannot stake if they aren't whitelisted.  
      
    If a user was whitelisted before and staked their LP tokens, then the contract owner decided to remove their whitelist then they will still be able to claim their rewards / LP stake, but they cannot stake more tokens. They will continue to earn PHTK rewards until they unstake or the remaining duration of the staking period.  
      
    
5.  **Can I (as the deployer) withdraw the PhunToken Rewards sitting in the contract?** Yes, you can withdraw your tokens in the pot anytime you want. If you withdraw the tokens, then anybody who has already claimed their rewards will still have them as they won't be in the contract if they were claimed. Anybody who has not yet claimed their tokens will now have 0 earned tokens that they can withdraw, but the UI will still show the number of tokens they would've been able to claim, but since the Owner / Deployer has withdrawn the rewards, they cannot claim rewards, only claim LP back.
      
      
    The users will still be able to claim their LP stake if the Owner / Deployer withdraws the PHTK (reward token) from the pot.

## UI Testing
The staking contract can be tested on **Rinkeby** here: https://dev.phuntoken.com/rewards/provide-liquidity/stake-lp-tokens/

**Rinkeby** Testnet Addresses
 - RewardToken:  `0x0D793DEf7586807ba9e69aA6BC46ae3F674F9b6F` *REEETOKEN (REEEE)*
 - LP Staking Token: `0x5C3d622BFD4d443ad8355e55A3257edCCc97e95C`
 - Staking Contract Address:
  `0xf1d855d3a507e62FeBbFf97aE2d6eEFAb4e492A0`
- Whitelist Contract Address:
   `0xe870a13D782d5aC79bdeb72CdD62567E948cb3f2`

**Mainnet** Testnet Addresses
 - RewardToken:  `0x1FEE5588cb1De19c70B6aD5399152D8C643FAe7b`
 - LP Staking Token: `N/A`
 - Staking Contract Address:
  `N/A`
- Whitelist Contract Address:
  `N/A`

**Note**: You need to be whitelisted to stake/interact with the UI. Please get in touch with an admin for whitelist.


## Using Write Functions
### Staking Contract Functions
#### Write Functions
**claimReward**
 - Executing this function claims the earned reward tokens for the user
   who is staking.
   
- Note: If tax is currently greater than 0, then the earned rewards
   tokens sent to the user on a claim will have the tax taken out.

 **exit**
 - Executing this function claims the earned reward tokens for the user AND
   claims their LP that is staked in the contract.
   
- Note: If tax is currently greater than 0, then the earned rewards
   tokens sent to the user on exit will have the tax taken out.

 **stake**
 - Accepts one parameter of uint128 The parameter is the amount of LP
   tokens you want to stake (decimals included) 
   - **i.e.,** An LP token with 18 decimals would be `10000000000000000000000` if you were staking 10,000 tokens

**setRewardParams**

 - Accepts two paramters. One uint128 and one uint64
 - The ***reward*** parameter is the number of Reward Tokens to stake (decimals included)
   - **, i.e.,** `5000000000000000000000000` would be 5 Million tokens on a token with 18 decimals.
- The ***duration*** parameter is the duration of
   the staking rewards in seconds. 
   - **i.e.** *2592000* seconds is one
   month of staking rewards from the 5 Million tokens distributed at
   about 166,666 tokens a day.

**updateExitStake**

 - Accepts one paramter of uint8
 - Allows the Owner / Deployer to write the current tax rate. Tax cannot be greater than 20%

**updateTreasury**

 - Accepts one parameter of an address
 - Allows the Owner / Deployer to change the treasury address that receives the tax (if tax is enabled)

**withdraw**

 - Accepts one paramter of uint128
 - Allows anybody who has LP tokens staked to withdraw the specified amount of tokens (including decimals) back into their wallet

**withdrawReward**

 - Only the Owner / Deployer can withdraw the remaining Reward Tokens in the Rewards Staking Pool. 
-- Withdrawing these tokens makes APY go to 0 and will result in the staking pool user only being able to withdraw their LP and will receive 0 Reward Tokens (even if the UI says they have earned Reward Tokens)
