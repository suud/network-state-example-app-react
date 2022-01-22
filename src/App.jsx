import { useEffect, useState } from "react";
import { useWeb3, useSwitchNetwork } from "@3rdweb/hooks";
import config from "./config";
import awsconfig from "./aws-exports";
import useAmplifyWalletAuth from "./hooks/useAmplifyWalletAuth";

const App = () => {
  const { connectWallet, address, error, chainId, provider } = useWeb3();
  const { switchNetwork } = useSwitchNetwork();
  const { signIn, signOut, user } = useAmplifyWalletAuth(awsconfig);
  console.log("👋 Address:", address);
  console.log("👋 User:   ", user ? user.username : undefined);

  // Show loading screen during the first second
  // That's necessary because it takes some time to load
  // previously connected wallet addresses and users
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => {
      // This will run after 1 second
      setLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  // The signer is required to sign transactions on the blockchain
  // Without it we can only read data, not write
  const signer = provider ? provider.getSigner() : undefined;

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

  // Sign out of AWS when address changes
  useEffect(() => {
    if (loading) {
      return;
    }
    if (!address && user) {
      signOut();
      return;
    }
    if (address && user && address !== user.username) {
      signOut();
      return;
    }
  }, [loading, address, user, signOut]);

  // If the dApp is loading, the user will see this
  if (loading) {
    return (
      <div className="loading">
        <h1>Loading...</h1>
        <p>This should only take a second.</p>
      </div>
    );
  }

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

  // Authenticated users will see this
  if (user) {
    return (
      <div className="authenticated-user">
        <h1>Bike Land</h1>
        <p>You're in!</p>
      </div>
    );
  }

  // Users with connected wallet but no auth session see this
  return (
    <div className="sign-in">
      <h1>Sign In</h1>
      <p>You'll be asked to sign a message to verify it's you!</p>
      <button onClick={() => signIn({ pubKey: address, signer: signer })} className="btn-hero">
        Authenticate
      </button>
    </div>
  );
};

export default App;