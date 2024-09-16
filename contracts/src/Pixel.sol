// SPDX-License-Identifier: MIT
pragma solidity 0.8.22;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Pixel is ERC20 {
    IERC20 public usdcToken;
    address public treasury;
    uint256 public totalSupplyPixels;
    uint256 public constant maxSupply = 1e6; // 1 million PIXEL tokens total
    uint256 public constant treasurySupply = 5e4; // 50,000 PIXEL tokens for treasury
    uint256 public constant k = 0.1 ether; // Base price, starts at 0.1 USDC
    uint256 public constant a = 1e-12 ether; // Scaling factor for quadratic growth
    uint256 public constant FEE_RATE = 100; // Fee rate in basis points (100 = 1%)

    // Mapping to track how many pixels an address has the right to paint
    mapping(address => uint256) public paintingRights;

    // Mapping to track delegated rights (who has painting rights for whom)
    mapping(address => address) public delegatedTo;

    constructor(address _usdcToken, address _treasury) ERC20("Pixel", "PIXEL") {
        usdcToken = IERC20(_usdcToken);
        treasury = _treasury;

        _mint(treasury, treasurySupply);
        totalSupplyPixels = treasurySupply;

        // Treasury initially has full painting rights for its minted supply
        paintingRights[treasury] = treasurySupply;
    }

    // Function to buy PIXEL tokens using USDC and bonding curve
    function buy(uint256 usdcAmount) external {
        require(usdcAmount > 0, "Amount must be greater than zero");

        // Calculate tokens to mint based on quadratic bonding curve
        uint256 tokensToMint = calculateTokens(usdcAmount);

        // Ensure the total supply does not exceed 1 million tokens
        require(totalSupplyPixels + tokensToMint <= maxSupply, "Exceeds maximum token supply");

        // Transfer USDC from buyer to contract
        require(
            usdcToken.transferFrom(msg.sender, address(this), usdcAmount),
            "USDC transfer failed"
        );

        // Calculate fee and amount after fee
        uint256 fee = (usdcAmount * FEE_RATE) / 10000;

        // Transfer fee to treasury
        require(
            usdcToken.transfer(treasury, fee),
            "Fee transfer to treasury failed"
        );

        // Mint tokens to buyer and update painting rights
        _mint(msg.sender, tokensToMint);
        totalSupplyPixels += tokensToMint;
        paintingRights[msg.sender] += tokensToMint;
    }

    // Function to sell PIXEL tokens for USDC
    function sell(uint256 tokenAmount) external {
        require(tokenAmount > 0, "Amount must be greater than zero");
        require(balanceOf(msg.sender) >= tokenAmount, "Insufficient tokens");

        // Calculate USDC to return based on quadratic bonding curve
        uint256 usdcToReturn = calculatePrice(tokenAmount);

        // Calculate fee and amount after fee
        uint256 fee = (usdcToReturn * FEE_RATE) / 10000;
        uint256 amountAfterFee = usdcToReturn - fee;

        // Burn tokens from seller and update painting rights
        _burn(msg.sender, tokenAmount);
        totalSupplyPixels -= tokenAmount;
        paintingRights[msg.sender] -= tokenAmount;

        // Transfer USDC to seller
        require(
            usdcToken.transfer(msg.sender, amountAfterFee),
            "USDC transfer to seller failed"
        );

        // Transfer fee to treasury
        require(
            usdcToken.transfer(treasury, fee),
            "Fee transfer to treasury failed"
        );
    }

    // Delegate painting rights to another address
    function delegatePaintingRights(address delegatee) external {
        require(delegatee != address(0), "Invalid delegatee address");
        require(delegatedTo[msg.sender] == address(0), "Rights already delegated");

        // Delegate painting rights to another address
        paintingRights[delegatee] = paintingRights[msg.sender];
        paintingRights[msg.sender] = 0;

        delegatedTo[msg.sender] = delegatee;
    }

    // Revoke delegated painting rights
    function revokeDelegation() external {
        address delegatee = delegatedTo[msg.sender];
        require(delegatee != address(0), "No delegation found");

        // Transfer painting rights back to the original holder
        paintingRights[msg.sender] = paintingRights[delegatee];
        paintingRights[delegatee] = 0;

        delegatedTo[msg.sender] = address(0);
    }

    // Prevent sending tokens while rights are delegated
    function _beforeTokenTransfer(
        address from,
        address,
        uint256 
    ) internal view{
        // Prevent transfers if the sender has delegated their rights
        require(delegatedTo[from] == address(0), "Cannot transfer tokens while rights are delegated");
    }

    // Calculate tokens to mint based on USDC amount using quadratic bonding curve
    function calculateTokens(uint256 usdcAmount) public view returns (uint256) {
        return usdcAmount / (k + a * totalSupplyPixels ** 2);
    }

    // Calculate USDC to return based on tokens sold using quadratic bonding curve
    function calculatePrice(uint256 tokenAmount) public view returns (uint256) {
        return tokenAmount * (k + a * totalSupplyPixels ** 2);
    }
}