# Hoge YardSale: A DeFi Innovation

HOGE YardSale is a peer-to-peer DeX. It allows easy creation of vendor contracts for trustless buying and selling HOGE over the counter.
It functions as on-chain orderbook that achieves many of the advantages of a centralized exchange.
Instead of routing volume through a single centralized liquidity pool, proxy vendors are a cheap and easy way to spin up useful liquidity contracts that are entirely in your ownership and control.

The VendorContract is deployed at x.
The VendorFactory is deployed at y, and allows users to create "proxy vendors" at a low cost.

There are several advantages over UniSwap:
- Trades happen at a fixed rate, alleviating price impact.
- Buys and Sells happen at the same time, so instead of a 2% tax on each step, there is a single transfer in which the 2 parties split the 2% tax.
- Since UniSwap is not an intermediary, there is no .3% swap fee.
- Gas for a purchase is cheaper.

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
