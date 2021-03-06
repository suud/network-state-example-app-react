import { useEffect, useState } from "react";
import { useWeb3, useSwitchNetwork } from "@3rdweb/hooks";
import config from "./config";
import awsconfig from "./aws-exports";
import useAmplifyWalletAuth from "./hooks/useAmplifyWalletAuth";
import { API } from 'aws-amplify';

const getJoke = (token) => {
  const apiName = awsconfig.API.endpoints[0].name;
  const path = "";
  const data = {
    headers: {
      Authorization: `Bearer ${token}`,
    }
  }
  return API.get(apiName, path, data);
};

const App = () => {
  const { connectWallet, address, error, chainId, provider } = useWeb3();
  const { switchNetwork } = useSwitchNetwork();
  const [user, token, signIn, signOut, signingIn, authError] = useAmplifyWalletAuth(awsconfig);
  const [joke, setJoke] = useState("You're in! Enjoy our exclusive jokes.<br />Only for citizens.")
  console.log("👋 Address:", address);
  console.log("👋 User:   ", user ? user.username : undefined);

  // Get a joke from the protected api
  const fetchJoke = (token) => {
    getJoke(token)
      .then(newJoke => setJoke(newJoke))
      .catch(err => {
        setJoke("Error getting Joke... Isn't that funny?");
        console.log("🛑 Error when trying to get joke:", err);
      });
  };

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
    if (signingIn) {
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
    if (address && !user && !authError) {
      signIn({ pubKey: address, signer: signer })
    }
  }, [loading, signingIn, address, user, authError, signIn, signOut, signer]);

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

  // While authenticating with amplify, the user will see this
  if (signingIn) {
    return (
      <div className="signing-in">
        <h1>Log In</h1>
        <p>You'll be asked to sign a message to verify it's you!</p>
      </div>
    );
  }

  // Authenticated users will see this
  if (user) {
    return (
      <div className="authenticated-user">
        <h1>Bike Land</h1>
        <p dangerouslySetInnerHTML={{ __html: joke }} />
        <button onClick={() => fetchJoke(token)} className="btn-hero">
          Get Joke
        </button>
      </div>
    );
  }

  // Users with connected wallet but no auth session see this
  return (
    <div className="not-a-citizen">
      <h1>Not Authorized</h1>
      <p>
        We were not able to verify that you're a Bike Land Citizen.
        <br />
        Make sure you have the wallet with your Bike Land Citizenship NFT connected and try again.
      </p>
      <button onClick={() => signIn({ pubKey: address, signer: signer })} className="btn-hero">
        Try again
      </button>
    </div>
  );
};

export default App;