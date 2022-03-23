HOGEVault: A New Tailor-Made Peer-to-Peer DeX

> That feel when even Uniswap is too centralized. Where are my fuckin pills?

                                   - rorih, 19/m/Cali

HOGEVault is a framework for trustless over-the-counter HOGE trades. It functions as on-chain orderbook that achieves many of the advantages of a centralized exchange. Instead of routing volume through a single centralized liquidity pool, **Makers** set up *vendor contracts* with fixed buy and sell rates. **Takers** come along and make trades according to the available supply and rates.

HogeVault has a number of advantages over UniSwap:

* Buys and Sells happen at the same time, so instead of a 2% tax on each step, there is a single transfer.
* The 2 parties *split the cost of the 2% tax*, meaning they both realize 99% of the value of their order.
* No .3% swap fee for the Uniswap middle-man. HOGEVault has no profit model whatsoever.
* Trades happen at a fixed rate, meaning price impact is 0% for any given trade.
* Gas usage for buying HOGE 125,861, compared to ~250,000 for a Uniswap swap.
* Gas usage for selling HOGE 106,138, compared to ~250,000 for a Uniswap swap.
* Gas usage for creating vendor contract 167,447, compared to 294,589 for adding LP on Uniswap.

The only downside is the loss of automatic market-making / price discovery of the xy=k pool. But large HOGEVault Maker positions will create arbitrage opportunities that help stabilize the Uniswap pool.

# HOW TO USE

## Market Makers:

First create a HogeVendor by calling createVendor(bidPrice, askPrice) on the VendorFactory. Use 0 if you don't want a double-sided order. Prices are in HOGE per ETH using whole numbers. Approximately 46,000,000 at time of writing.

* Change your Ask order size by setting an allowance on the HOGE contract: HOGE.approve(vendor.address, amount_to_sell)
* Change your Bid order size by sending ETH to the vendor contract or calling vendor.releaseFunds(amountToRemove).

## Market Takers

Takers first identify a vendor contract to interact with. The VendorFactory emits VendorCreated events. Then call vendorBid() and vendorAsk() on the individual vendors to get the order sizes.

* Call buyQuote(amountETH) to find out how much HOGE the vendor will sell you.
* Call buyHOGE() with that value on the message to execute the buy.
* Call sellQuote(amountHOGE) to find out how much ETH the vendor will pay you.
* Call sellHOGE(amountHOGE) to execute the sell. This requires an approve call to HOGE.approve(vendor.address, amountHOGE) in order to succeed.

