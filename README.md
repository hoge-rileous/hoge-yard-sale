# Introducing HOGEVault: A New Tailor-Made Peer-to-Peer DeX

HOGEVault is a framework for trustless over-the-counter HOGE trades.
It functions as on-chain orderbook that achieves many of the advantages of a centralized exchange.
Instead of routing volume through a single centralized liquidity pool, **Makers** set up *vendor contracts* with fixed buy and sell rates. **Takers** come along and make trades according to the available supply and rates.

HogeVault has a number of advantages over UniSwap:

- Buys and Sells happen at the same time, so instead of a 2% tax on each step, there is a single transfer in which the 2 parties split the cost of the 2% tax.
- No .3% swap fee for Uniswap middle-man.
So already trades on HOGEVault have a 1.3% advantage. But consider further that
- Trades happen at a fixed rate, meaning price impact is 0%.
- Gas cost for buying HOGE ~123713, compared to ~250,000 for a Uniswap swap.
- Gas cost for creating vendor contract 188743, compared to 294,589 for adding LP on Uniswap.


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
