# HOGEVault: A New Tailor-Made Peer-to-Peer DeX

> That feel when even Uniswap is too centralized. Where are my fuckin pills?

\- rorih, 19/m/Cali

HOGEVault is a framework for trustless over-the-counter HOGE trades. It functions as on-chain orderbook that achieves many of the advantages of a centralized exchange. Instead of routing volume through a single centralized liquidity pool, **Makers** set up *vendor contracts* with fixed buy and sell rates. **Takers** come along and make trades according to the available supply and rates.


# IMPORTANT:

Bids and asks are set in units of WEI/TOKEN without any adjustment for decimals. In the unit test example the Bid/Ask are both set to "10" which represents a test case of 1 ETH per 100m HOGE.

1 HOGE * (10 WEI/HOGE) = 10 WEI

10 WEI / (10 WEI/HOGE) = 1 HOGE

So 

100000000000000000 HOGE = 1000000000000000000 WEI

or (since HOGE has 9 decimals and ETH has 18)

100,000,000.000000000 HOGE = 1.000000000000000000 ETH

if 1 WEI is worth more than 1 TOKEN then this rate will be zero!! Do we ever expect this to happen?
