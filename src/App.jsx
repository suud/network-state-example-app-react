import { useEffect, useState } from "react";
import { useWeb3, useSwitchNetwork } from "@3rdweb/hooks";
import config from "./config";

const App = () => {
  const { connectWallet, disconnectWallet, address, error, chainId } = useWeb3();
  const { switchNetwork } = useSwitchNetwork();
  console.log("👋 Address:", address);

  const [usesSupportedChain, setUsesSupportedChain] = useState(true);

  // Check if user is on supported chain
  useEffect(() => {
    if (error && error.name === "UnsupportedChainIdError") {
      setUsesSupportedChain(false);
      return;
    }
    if (chainId && !config.supportedChainIds.includes(chainId)) {
      setUsesSupportedChain(false);
      return;
    }
    setUsesSupportedChain(true);
  }, [chainId, error]);

  // If a unsupported chain is selected, the user will see this
  if (!usesSupportedChain) {
    return (
      <div className="unsupported-network">
        <h2>Unsupported Network</h2>
        <p>This dApp does not support your selected network.</p>
        <button onClick={() => switchNetwork(config.supportedChainIds[0])} className="btn-hero">
          Switch Network
        </button>
      </div>
    );
  }

  // When no wallet is connected, the user will see this
  if (!address) {
    return (
      <div className="connect-wallet">
        <h1>Bike Land</h1>
        <button onClick={() => connectWallet("injected")} className="btn-hero">
          Connect your wallet
        </button>
      </div>
    );
  }

  // Users with connected wallet but no auth session see this
  return (
    <div className="not-a-citizen">
      <h1>You are not a Bike Land Citizen</h1>
      <button onClick={disconnectWallet} className="btn-hero">
        Disconnect
      </button>
    </div>
  );
};

export default App;