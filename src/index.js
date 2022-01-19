import React from "react";
import ReactDOM from "react-dom";
import { ThirdwebWeb3Provider } from "@3rdweb/hooks";

import "./index.css";
import App from "./App";
import config from "./config";

ReactDOM.render(
  <React.StrictMode>
    <ThirdwebWeb3Provider
      connectors={config.connectors}
      supportedChainIds={config.supportedChainIds}
    >
      <App />
    </ThirdwebWeb3Provider>
  </React.StrictMode>,
  document.getElementById("root")
);