"use client";

import { useState, useEffect } from "react";
import { Bitcoin, X, Zap } from "lucide-react";
import { useSession } from "next-auth/react";
import QRCode from "qrcode";

const InvoiceGenerator: React.FC = () => {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [userName, setUserName] = useState("");
  const [balance, setBalance] = useState("");
  const [isHovering, setIsHovering] = useState(false);
  const [walletData, setWalletData] = useState(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null);

  interface InvoiceData {
    checking_id: string;
    lnurl_response: any;
    payment_hash: string;
    payment_request: string;
  }

  useEffect(() => {
    const fetchData = async () => {
      console.log("Olá");
      try {
        if (!session?.user?.email) {
          throw new Error("User email not found");
        }
        const userExists = await checkUserExists(session?.user?.email);
        if (!userExists) {
          throw new Error("User does not exist");
        }
        const url = "https://demo.lnbits.com/api/v1/wallet";
        const apiKey = userExists.adminKey;
        const response = await fetch(url, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "X-Api-Key": apiKey,
          },
        });
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }

        const data = await response.json();
        console.log(data, "Dados da Carteira");
        setWalletData(data);
        setBalance(data.balance);
        setUserName(data.name);
      } catch (error) {
        console.log(error);
      } finally {
        console.log("Finnaly");
      }
    };

    fetchData();
  }, [session, showQRModal]);

  const generateInvoice = async (amount: string) => {
    if (!session?.user?.email) {
      throw new Error("User email not found");
    }
    const user = await checkUserExists(session.user?.email);
    const url = "https://demo.lnbits.com/api/v1/payments";

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Api-Key": user.adminKey,
        },
        body: JSON.stringify({
          unit: "sat",
          internal: false,
          amount: amount,
          out: false,
          memo: "Funding Wallet - (MeetSats)",
          description_hash: "",
          unhashed_description: "",
          expiry: 30,
          extra: {},
          webhook: "",
          lnurl_callback: "",
        }),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();
      console.log(data);
      setInvoiceData(data);
      const bolt11Invoice = data.payment_request;

      QRCode.toDataURL(bolt11Invoice, (err, url) => {
        if (err) {
          console.error("Error generating QR code:", err);
        } else {
          setQrCodeUrl(url);
          setShowQRModal(true);
        }
      });
    } catch (error) {
      console.error("Error managing payment:", error);
    }
  };

  async function checkUserExists(email: string) {
    try {
      const response = await fetch("/api/database/wallet/checkWalletExists", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        if (data.exists) {
          console.log("Usuário já existe:", data.user);
          return data.user;
        } else {
          console.log("Usuário não encontrado");
          return false;
        }
      } else {
        console.error("Erro:", data.error);
      }
    } catch (error) {
      console.error("Erro na requisição:", error);
    }
  }

  const handleGenerateInvoice = () => {
    generateInvoice(amount);
    setIsOpen(false);
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div
        className="relative overflow-hidden rounded-lg shadow-lg transition-all duration-300 ease-in-out transform hover:scale-105"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-orange-400 via-orange-500 to-yellow-500 opacity-90"></div>
        <div className="relative p-6 z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className="relative w-16 h-16 rounded-full overflow-hidden border-4 border-white shadow-inner mr-4">
                <img
                  src={session?.user?.image || "/default-profile.png"}
                  alt="Profile"
                  className="object-cover w-full h-full"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-30"></div>
              </div>

              <h2 className="text-3xl font-bold text-white">{userName}</h2>
            </div>
            <div className="flex items-center">
              <span className="text-4xl font-bold text-white mr-2">
                {Number(balance) / 1000}
              </span>
              <span className="text-2xl text-white">sats</span>
              <Zap
                className={`ml-2 ${
                  isHovering ? "animate-pulse text-yellow-300" : "text-white"
                }`}
              />
            </div>
          </div>
        </div>
      </div>
      <button
        onClick={() => setIsOpen(true)}
        className="w-full bg-gradient-to-r from-orange-400 to-orange-600 text-white font-bold py-3 px-4 rounded-full transition duration-300 ease-in-out transform hover:scale-105 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-300 mt-4 mb-4"
      >
        Fund Wallet
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md transform transition-all duration-300 ease-out">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-orange-600">
                Fund Wallet
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition duration-150 ease-in-out"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="mb-6">
              <label
                htmlFor="amount"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Amount (sats)
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Bitcoin className="h-5 w-5 text-orange-400" />
                </div>
                <input
                  type="text"
                  id="amount"
                  value={amount}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (/^[0-9]*$/.test(value)) {
                      setAmount(value);
                    }
                  }}
                  className="block w-full pl-10 pr-12 py-3 border-2 border-orange-300 rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition duration-300 ease-in-out text-orange-800 bg-white placeholder-orange-300"
                  placeholder="Enter amount in sats"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 border-2 border-orange-300 rounded-full text-orange-500 hover:bg-orange-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition duration-300 ease-in-out"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerateInvoice}
                className="px-4 py-2 bg-gradient-to-r from-orange-400 to-orange-600 text-white rounded-full shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition duration-300 ease-in-out transform hover:scale-105"
              >
                Generate
              </button>
            </div>
          </div>
        </div>
      )}
      {showQRModal && invoiceData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl shadow-2xl p-4 w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h3
                className="text-3xl font-extrabold text-orange-600"
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                Invoice Details
              </h3>
              <button
                onClick={() => setShowQRModal(false)}
                className="text-orange-400 hover:text-orange-600 transition duration-150 ease-in-out"
                aria-label="Close modal"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="flex flex-col items-center space-y-6">
              {qrCodeUrl && (
                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r rounded-lg blur opacity-50 group-hover:opacity-75 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
                  <img
                    src={qrCodeUrl}
                    alt="QR Code"
                    className="relative w-64 h-64 rounded-lg"
                  />
                </div>
              )}
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600">
                  {amount} sats
                </p>
              </div>
              <button
                onClick={() => setShowQRModal(false)}
                className="mt-6 px-6 py-3 bg-gradient-to-r from-orange-400 to-orange-600 text-white rounded-full shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition duration-300 ease-in-out transform hover:-translate-y-1 hover:scale-105"
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceGenerator;
