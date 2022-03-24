import React from "react";

export function CreateVendor({ createVendor }) {
  return (
    <div className="flex flex-col">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          const formData = new FormData(event.target);
          const bid = formData.get("bid");
          const ask = formData.get("ask");
          createVendor(bid, ask);
        }}
      >
        <div className="gap-4 flex flex-col items-center justify-center" >
          <label className="font-semibold">Bid:</label>
          <input 
            className="w-1/2 text-center p-1 rounded focus:outline-none border border-gray-700" type="number" step="any" name="bid" required />
          <label className="font-semibold">Ask:</label>
          <input 
            className="w-1/2 text-center p-1 rounded focus:outline-none border border-gray-700" type="number" step="any" name="ask" required />
          <input className="flex items-center justify-center text-xs cursor-pointer p-2 bg-black hover:bg-gray-800 rounded text-white w-1/2" type="submit" value="Create Vendor" />
        </div>
      </form>
    </div>
  );
}
