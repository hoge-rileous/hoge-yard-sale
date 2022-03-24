import React from "react";

export function ContractButton({ name, description, callback, label }) {
  return (
    <div>
      <h4>{name}</h4>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          callback();
        }}
      >
        <div className="form-group">
          <label>{description}.</label>
        </div>
        <div className="form-group">
          <input className="btn btn-primary" type="submit" value={label} />
        </div>
      </form>
    </div>
  );
}
