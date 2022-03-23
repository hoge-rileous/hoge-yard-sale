# Introducing HOGEVault: A New Tailor-Made Peer-to-Peer DeX

> That feel when even Uniswap is too centralized. Where are my pills? - rorih, 19/m/Cali

HOGEVault is a framework for trustless over-the-counter HOGE trades.
It functions as on-chain orderbook that achieves many of the advantages of a centralized exchange.
Instead of routing volume through a single centralized liquidity pool, **Makers** set up *vendor contracts* with fixed buy and sell rates. **Takers** come along and make trades according to the available supply and rates.

HogeVault has a number of advantages over UniSwap:

- Buys and Sells happen at the same time, so instead of a 2% tax on each step, there is a single transfer. 
- The 2 parties *split the cost of the 2% tax*. A factor of 99/98 is applied so that recipients get 99% of the HOGE they were expecting (instead of 98%).
- No .3% swap fee for the Uniswap middle-man. HOGEVault has no profit model whatsoever.
- Trades happen at a fixed rate, meaning price impact is 0% for any given trade.
- Gas usage for buying HOGE 123,713, compared to ~250,000 for a Uniswap swap.
- Gas usage for selling HOGE 104,995, compared to ~250,000 for a Uniswap swap.
- Gas usage for creating vendor contract 167,447, compared to 294,589 for adding LP on Uniswap.

The only downside is the loss of automatic market-making / price discovery of the xy=k pool. But large HOGEVault Maker positions will create arbitrage opportunities that help stabilize the Uniswap pool.


# HOW TO USE

Contracts use prices denominated in HOGE/ETH with no decimal places.

## Market Makers:

First create a Vendor Contract.
Call createVendor(buyPrice, sellPrice) on the VendorFactory.

### Sell HOGE

Set an allowance for your vendor contract equal to the amount that you want to sell.

### Buy HOGE.
Send ETH to your vendor contract.

### Cancel sell
Zero out your allowance.

### Cancel buy
Call releaseFunds() on your vendor contract.

## Market Takers

Takers first identify a vendor contract to interact with.

### Buy HOGE

Call buyHOGE()

### Sell HOGE

Call sellHOGE()
