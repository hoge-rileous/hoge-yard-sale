import React from "react";
import { ethers } from "ethers";

export class Vendor extends React.Component {
  constructor(props) {
    super(props);
    this.vendor = props.vendor;
    this.initialState = {
      bid: ethers.BigNumber.from(0),
      ask: ethers.BigNumber.from(0),
    };
    this.state = this.initialState;
  }

  render() {

    const bid = ethers.utils.formatUnits(this.state.bid, 0);
    const ask = ethers.utils.formatUnits(this.state.ask, 0);


    return (
      <div className="flex flex-col">
        Hi. {bid} --- {ask}
      </div>
    );
  }

  componentDidMount() {
    console.log("HI!");
    this._startPollingData();
  }
  _startPollingData() {
    this._pollDataInterval = setInterval(() => this._updateBalances(), 1000);
    this._updateBalances();
  }

  _stopPollingData() {
    clearInterval(this._pollDataInterval);
    this._pollDataInterval = undefined;
  }

  async _updateBalances() {
    const bid = await this.vendor.bid();
    const ask = await this.vendor.ask();
    console.log(bid, ask)
    this.setState({
     bid: bid,
     ask: ask
   });
  }


}
