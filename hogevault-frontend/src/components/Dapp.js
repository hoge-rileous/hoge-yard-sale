import React from "react";
import { ethers } from "ethers";
import HogeVendorArtifact from "../contracts/HogeVendor.json";
import VendorFactoryArtifact from "../contracts/VendorFactory.json";
import hogeABI from "../contracts/hogeABI.json";
import { NoWalletDetected } from "./NoWalletDetected";
import { ConnectWallet } from "./ConnectWallet";
import { Loading } from "./Loading";
import { ContractButton } from "./ContractButton";
import { CreateVendor } from "./CreateVendor";
import { Vendor } from "./Vendor";
import { TransactionErrorMessage } from "./TransactionErrorMessage";
import { WaitingForTransactionMessage } from "./WaitingForTransactionMessage";
const factoryAddress = require("../contracts/factory-address.json");
const vendorAddresses = require("../contracts/vendors.json");

const ERROR_CODE_TX_REJECTED_BY_USER = 4001;

export class Dapp extends React.Component {
  constructor(props) {
    super(props);

    this.initialState = {

      tokenData: undefined,
      selectedAddress: undefined,
      initialized: false,
      vendors:vendorAddresses.addresses,
      vendorContracts:[],
      txBeingSent: undefined,
      transactionError: undefined,
      networkError: undefined,
    };
    this.vendorContracts = [];
    this.state = this.initialState;
  }



  render() {

    const hogeBalance = "0.0";
    const hoge2Balance = "0.0";//ethers.utils.formatUnits(this.state.hoge2Balance, 9);

    let errorMsg = null
    if (this.state.transactionError) {
      if (this.state.transactionError.error && this.state.transactionError.error.message) {
        errorMsg = this.state.transactionError.error.message;
      } else {
        errorMsg = "Transaction Canceled.";
      }
    }

    return (
      <div className="p-10 h-full w-full inline-flex flex-col dark:text-gray-200 bg-gray-900 items-center justify-between gap-8">
        <div className="text-2xl text-center text-white">HOGE<sup>2</sup> UN/WRAPPING STATION</div>

        {(window.ethereum === undefined) &&
          <div className="border bg-red-600 rounded text-center p-2 flex justify-center text-1xl flex-col items-center">
            <NoWalletDetected />
          </div>
        }

        <div className="text-center flex items-center justify-center h-full">
          <div className="h-auto font-bold p-1 bg-orange-300 rounded-xl text-black flex flex-col gap-2 items-center justify-between">
            <img src="hoge.png" alt="Hoge" />
            <div> Create a Vendor</div>
            {this.state.initialized && <CreateVendor createVendor={(bid,ask) => this._createVendor(bid, ask)} />}
          </div>
          <div className="flex items-center justify-center w-1/6"> <img className="inverted w-2/3" src="arrow.png" /></div>

          <div className="h-auto font-bold p-1 bg-cyan-200 rounded-xl text-black flex flex-col gap-2 items-center justify-between">
            <img src="hoge2.png" alt="Hoge2" />
            <div>CONTRACTS: </div>
            {this.state.vendorContracts.map((vendorContract) => {
              return <Vendor vendor={vendorContract} />})}
            {this.state.vendorContracts.length}
          </div>
        </div>
        <div className="row">
          <div className="col-12">
            {this.state.txBeingSent && (
              <WaitingForTransactionMessage txHash={this.state.txBeingSent} />
            )}
            {this.state.transactionError && (
              <TransactionErrorMessage
                message={errorMsg}
                dismiss={() => this._dismissTransactionError()}
              />
            )}
          </div>
        </div>

        {this.state.initialized ? <div className="text-center flex flex-col items-center gap-2 text text-white">
          <div className="text-sm">Using address:</div>
          <div className="text-xs w-auto break-words">
            <a className="underline" target="_blank" href={`https://etherscan.io/address/` + this.state.selectedAddress}>{this.state.selectedAddress}</a>
          </div>
        </div> : <ConnectWallet
          connectWallet={() => this._connectWallet()}
          networkError={this.state.networkError}
          dismiss={() => this._dismissNetworkError()}
        />}
        <div className="text-gray-400 text-xs text-center">
          HOGE<sup>2</sup> is a tax-free token backed 1-to-1 by HOGE. It is compatible with <a href="https://app.uniswap.org/#/swap?use=V3&inputCurrency=0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2&outputCurrency=0x25699C4b6bbF148A8FDb4b5823e8D9BbA44C8090&chain=mainnet">Uniswap V3</a> and makes it cheaper to speculate on HOGE without touching a centralized exchange.
          Please see the code on <a className="underline" href="https://etherscan.io/address/0x25699c4b6bbf148a8fdb4b5823e8d9bba44c8090#code#F1#L1">EtherScan</a>.
          Wrapping requires an "approve" step due to line 19.</div>
      </div>
    );
  }

  componentWillUnmount() {
    this._stopPollingData();
  }

  async _connectWallet() {
    const [selectedAddress] = await window.ethereum.request({ method: 'eth_requestAccounts' });
    if (!this._checkNetwork()) {
      return;
    }

    this._initialize(selectedAddress);

    window.ethereum.on("accountsChanged", ([newAddress]) => {
      this._stopPollingData();

      if (newAddress === undefined) {
        return this._resetState();
      }

      this._initialize(newAddress);
    });

    window.ethereum.on("chainChanged", ([networkId]) => {
      this._stopPollingData();
      this._resetState();
    });
  }

  _initialize(userAddress) {
    // This method initializes the dapp

    this.setState({
      selectedAddress: userAddress,
      initialized: true
    });

    this._initializeEthers();
    this._startPollingData();
  }

  async _initializeEthers() {
    this._provider = new ethers.providers.Web3Provider(window.ethereum);


    this._factory = new ethers.Contract(
      factoryAddress.address,
      VendorFactoryArtifact.abi,
      this._provider.getSigner(0)
    );

    console.log(this.state.vendors);
    this.setState({vendorContracts: this.state.vendors.map((vendorAddress) => 
      new ethers.Contract(
        vendorAddress,
        HogeVendorArtifact.abi,
        this._provider.getSigner(0)
      ))});
    console.log(this.state);
  }

  async _createVendor(bid,ask) {
    try {

      this._dismissTransactionError();

      bid = ethers.utils.parseUnits(bid, 0);
      ask = ethers.utils.parseUnits(ask, 0);


      const tx = await this._factory.createVendor(bid, ask);
      this.setState({ txBeingSent: tx.hash });


      const receipt = await tx.wait();
      console.log(receipt);
      if (receipt.status === 0) {
        throw new Error("Transaction failed");
      }
      await this._updateBalances();
    } catch (error) {
      if (error.code === ERROR_CODE_TX_REJECTED_BY_USER) {
        return;
      }

      console.error(error);
      this.setState({ transactionError: error });
    } finally {
      this.setState({ txBeingSent: undefined });
    }
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
    this.state.vendorContracts.forEach(async (vendorContract) => {
      const ask = await vendorContract.ask();
    });
  }




  // This method just clears part of the state.
  _dismissTransactionError() {
    this.setState({ transactionError: undefined });
  }

  // This method just clears part of the state.
  _dismissNetworkError() {
    this.setState({ networkError: undefined });
  }

  // This is an utility method that turns an RPC error into a human readable
  // message.
  _getRpcErrorMessage(error) {
    if (error.data) {
      return error.data.message;
    }
    return error.message;
  }

  // This method resets the state
  _resetState() {
    this.setState(this.initialState);
  }

  // This method checks if Metamask selected network is Localhost:8545 
  _checkNetwork() {
    console.log(window.ethereum.networkVersion);
    return true;
    const netv = window.ethereum.networkVersion;
    if (netv === "1" || netv === 1) {
      return true;
    }

    this.setState({
      networkError: 'Please connect Metamask to ETH MAINNET'
    });

    return false;
  }
}
