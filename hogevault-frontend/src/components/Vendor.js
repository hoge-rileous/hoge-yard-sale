import React from "react";
import { ethers } from "ethers";
import { BuyHOGE } from "./BuyHoge";
import { SellHOGE } from "./SellHoge";

export class Vendor extends React.Component {
  constructor(props) {
    super(props);
    this.initialState = {
      eth: ethers.utils.parseUnits("3100", 18),
      bid: props.bid,
      ask: props.ask,
      name: props.name,
      owner: props.owner,
      bidMax: props.bidMax.amountHOGE,
      askMax: props.askMax.amountETH
    };
    this.state = this.initialState;
  }

  render() {
    let {name, owner, bid, ask, eth, bidMax, askMax} = this.state;

    const bidSizeMax = ethers.utils.formatUnits(bidMax, 9).substring(0,9);
    const askSizeMax = ethers.utils.formatEther(askMax).substring(0,9);    

    const bidPrice = ethers.utils.formatUnits(eth.div(bid)).substring(0,9);
    const askPrice = ethers.utils.formatUnits(eth.div(ask)).substring(0,9);

    return (
      <div className="flex flex-col">
        <hr/>
        {name}, owner: {owner}
        <p/>
        Bid price: {bidPrice}, Ask price: {askPrice} <p/>
        <SellHOGE sellHOGE={this.props.callbacks.sell} max={bidSizeMax} />
        <BuyHOGE buyHOGE={this.props.callbacks.buy} max={askSizeMax}/>
      </div>
    );
  }



}
