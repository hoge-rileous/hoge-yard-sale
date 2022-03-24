import React from "react";

import { NetworkErrorMessage } from "./NetworkErrorMessage";

export function ConnectWallet({ connectWallet, networkError, dismiss }) {
  return (
    <div className="w-1/2">
      <div>
        {/* Metamask network should be set to Localhost:8545. */}
        {networkError && (
          <NetworkErrorMessage
            message={networkError}
            dismiss={dismiss}
          />
        )}
      </div>
      <div className="inline-flex flex-col gap-6 items-center w-full">
        <button
          className="flex-none items-center justify-center flex text-sm border text-white font-bold bg-black-400 hover:bg-black-600 rounded p-3 w-full min-w-64"
          type="button"
          onClick={connectWallet}
        >
          Connect Wallet
        </button>
      </div>
    </div>
  );
}
