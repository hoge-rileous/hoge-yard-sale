import React from "react";

export function BuyHOGE({ buyHOGE, max}) {
  return (
    <div className="flex flex-col">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          const formData = new FormData(event.target);
          const amountETH = formData.get("amountETH");
          buyHOGE(amountETH);
        }}
      >
        <div className="gap-4 flex flex-col items-center justify-center" >
          <label className="font-semibold">Buy amount in ETH (max {max}):</label>
          <input 
            className="w-1/2 text-center p-1 rounded focus:outline-none border border-gray-700" type="number" step="any" name="amountETH" required />
          <input className="flex items-center justify-center text-xs cursor-pointer p-2 bg-black hover:bg-gray-800 rounded text-white w-1/2" type="submit" value="Buy HOGE" />
        </div>
      </form>
    </div>
  );
}
