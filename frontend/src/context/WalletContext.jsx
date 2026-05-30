import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import axios from "axios";
import toast from "react-hot-toast";

const WalletContext = createContext(null);

export const useWallet = () => {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used within WalletProvider");
  return ctx;
};

export const WalletProvider = ({ children }) => {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem("veritasid_token"));
  const [loading, setLoading] = useState(false);
  const [chainId, setChainId] = useState(null);

  // Set axios default auth header
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common["Authorization"];
    }
  }, [token]);

  // Restore session on load
  useEffect(() => {
    if (token) fetchMe();
  }, []);

  const fetchMe = async () => {
    try {
      const res = await axios.get("/api/auth/me");
      setUser(res.data.user);
    } catch {
      logout();
    }
  };

  const connectWallet = useCallback(async () => {
    if (!window.ethereum) {
      toast.error("MetaMask not installed! Please install MetaMask.");
      window.open("https://metamask.io/download/", "_blank");
      return;
    }

    setLoading(true);
    try {
      const web3Provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await web3Provider.send("eth_requestAccounts", []);

      if (!accounts.length) throw new Error("No accounts found");

      const web3Signer = await web3Provider.getSigner();
      const network = await web3Provider.getNetwork();
      const address = accounts[0];

      setProvider(web3Provider);
      setSigner(web3Signer);
      setAccount(address);
      setChainId(Number(network.chainId));

      // Get nonce and sign
      const nonceRes = await axios.get(`/api/auth/nonce/${address}`);
      const { message } = nonceRes.data;

      toast.loading("Please sign the message in MetaMask...", { id: "sign" });
      const signature = await web3Signer.signMessage(message);
      toast.dismiss("sign");

      // Verify signature
      const authRes = await axios.post("/api/auth/verify", {
        walletAddress: address,
        signature,
        message,
      });

      const { token: newToken, user: userData } = authRes.data;
      localStorage.setItem("veritasid_token", newToken);
      setToken(newToken);
      setUser(userData);

      toast.success(`Connected: ${address.slice(0, 6)}...${address.slice(-4)}`);
    } catch (error) {
      console.error("Wallet connect error:", error);
      if (error.code === 4001) {
        toast.error("Signature rejected");
      } else {
        toast.error(error.message || "Connection failed");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setAccount(null);
    setProvider(null);
    setSigner(null);
    setUser(null);
    setToken(null);
    localStorage.removeItem("veritasid_token");
    delete axios.defaults.headers.common["Authorization"];
    toast.success("Disconnected");
  }, []);

  // Listen for account/chain changes
  useEffect(() => {
    if (!window.ethereum) return;
    const handleAccountsChanged = (accounts) => {
      if (accounts.length === 0) logout();
      else if (accounts[0] !== account) logout();
    };
    const handleChainChanged = () => window.location.reload();
    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);
    return () => {
      window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
      window.ethereum.removeListener("chainChanged", handleChainChanged);
    };
  }, [account, logout]);

  const isConnected = !!account && !!token;

  return (
    <WalletContext.Provider value={{
      account, provider, signer, user, token,
      loading, chainId, isConnected,
      connectWallet, logout, fetchMe, setUser,
    }}>
      {children}
    </WalletContext.Provider>
  );
};
