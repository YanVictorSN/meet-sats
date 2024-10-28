"use client";
import { useSession, signIn, signOut } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import {
  Search,
  Bitcoin,
  Clock,
  Users,
  Zap,
  Calendar,
  Info,
  Award,
  Edit3,
} from "lucide-react";
import SatoshiRevolution from "@/components/SatoshiMain";
import InvoiceGenerator from "@/components/UserData";
import Header from "@/components/Header";
import QRCode from "qrcode";

export default function Home() {
  const { data: session } = useSession();
  const [userChecked, setUserChecked] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [title, setTitle] = useState("");
  const [dollarAmount, setDollarAmount] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const [events, setEvents] = useState<Event[]>([]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSearch = async () => {
    await searchMeetings(searchQuery);
  };

  const initializationDone = useRef(false);

  useEffect(() => {
    const checkAndCreateUser = async () => {
      session && session.user?.email && !initializationDone.current;

      try {
        const userExists = await checkUserExists(session?.user?.email || "");
        console.log("User check completed");

        if (!userExists) {
          await createWallet(session?.user?.name || "");
          console.log("Wallet created");
        }
        initializationDone.current = true;
      } catch (error) {
        console.error("Failed to initialize user:", error);
      }
    };
    if (session && session.user?.email && !initializationDone.current) {
      checkAndCreateUser();
    }
  }, [session]);

  // Emails
  const handleReward = () => {
    const rewardAmount = parseFloat(amount);

    if (rewardAmount > 0 && title.trim() !== "") {
      setIsOpen(false);
      setAmount("");
      setTitle("");
      setDollarAmount(null);
      handleRewardEmail(title, amount);
    }
  };

  const handleRewardEmail = async (meetingSummary: string, amount: string) => {
    if (events.length === 0) {
      console.error("No events available");
      return;
    }

    const emails = events[0].emails;
    if (!emails) {
      console.error("No emails found in the first event");
      return;
    }

    console.log(emails);

    // Create promises to send emails
    const emailPromises = emails.map(async (email) => {
      try {
        const rewardEmail = await createRewardWithdraw(amount); // Pass amount to createRewardWithdraw
        console.log(rewardEmail);
        return sendEmail(email, rewardEmail.lnurl, meetingSummary);
      } catch (error) {
        console.error(`Error processing email for ${email}:`, error);
      }
    });

    try {
      const results = await Promise.all(emailPromises);
      console.log("All reward emails sent successfully:", results);
    } catch (error) {
      console.error("Error sending reward emails:", error);
    }
  };

  const createRewardWithdraw = async (amount: string) => {
    // Check if the user's email is available
    if (!session?.user?.email) {
      throw new Error("User email not found");
    }

    const user = await checkUserExists(session.user.email);
    const url = "https://demo.lnbits.com/withdraw/api/v1/links";

    // Function to create withdraw link
    const createWithdrawLink = async () => {
      try {
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Api-Key": user.adminKey,
          },
          body: JSON.stringify({
            title: "Summary",
            min_withdrawable: amount,
            max_withdrawable: amount,
            uses: 1,
            wait_time: 1,
            is_unique: true,
            webhook_url: "",
            webhook_headers: "",
            webhook_body: "",
            custom_url: "",
          }),
        });

        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }

        const data = await response.json();
        console.log("Withdrawal link created:", data);
        return data;
      } catch (error) {
        console.error("Error creating withdrawal link:", error);
      }
    };

    return createWithdrawLink();
  };

  const sendEmail = async (
    email: string,
    message: string | QRCode.QRCodeSegment[],
    meetingSummary: string
  ) => {
    try {
      const qrCodeDataUrl = await QRCode.toDataURL(message);
      console.log(qrCodeDataUrl);

      const response = await fetch("api/email/sendEmail", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email,
          subject: `Reward from ${meetingSummary} Meeting`,
          message: message,
          qrCode: qrCodeDataUrl,
        }),
      });

      if (!response.ok) {
        throw new Error("Error sending email");
      }

      const data = await response.json(); // Await the response
      return data;
    } catch (error) {
      console.error("Error in sendEmail:", error);
    }
  };

  ///Rewards Links

  const createRewardWithdrawForAllEmails = async (events: Event[]) => {
    const createWithdrawLink = async (
      adminKey: string,
      title: string,
      satsAmount: number
    ) => {
      const url = "https://demo.lnbits.com/withdraw/api/v1/links";
      try {
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Api-Key": adminKey,
          },
          body: JSON.stringify({
            title,
            min_withdrawable: satsAmount,
            max_withdrawable: satsAmount,
            uses: 1,
            wait_time: 1,
            is_unique: true,
            webhook_url: "",
            webhook_headers: "",
            webhook_body: "",
            custom_url: "",
          }),
        });

        if (!response.ok) {
          throw new Error(`Erro: ${response.status}`);
        }

        const data = await response.json();
        console.log("Link de retirada criado:", data);
        return data.url;
      } catch (error) {
        console.error("Erro ao criar o link de retirada:", error);
        return null;
      }
    };
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

  interface Event {
    summary: string;
    startDateTime: string;
    endDateTime: string;
    emails: string[];
  }

  async function searchMeetings(meetingUrl: string) {
    const meetingCode = meetingUrl.split("/").pop() || "";
    const eventsData = await checkHangoutLink(meetingCode);
    if (!session || !session.accessToken) {
      throw new Error("No session or access token found.");
    }
    setEvents(eventsData);
    const res = await fetch(
      `https://meet.googleapis.com/v2/conferenceRecords?filter=space.meeting_code=${meetingCode}`,
      {
        headers: { Authorization: `Bearer ${session.accessToken}` },
      }
    );
    const data = await res.json();
    console.log(data);
    setSearchResults(data.conferenceRecords);
    console.log(events, "eventos");
    fetchParticipants(
      session?.accessToken ?? "",
      data.conferenceRecords[0].name
    );
  }

  async function fetchMeetingData(meetingUrl: string) {
    console.log("entrou");
    try {
      const response = await fetch("/api/google/getConferenceData", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ meetingUrl }),
      });

      if (!response.ok) {
        throw new Error("Erro ao buscar dados da conferência");
      }

      const data = await response.json();
      console.log(data);
    } catch (error) {
      console.error("Erro ao fazer a requisição:", error);
    }
  }

  async function checkHangoutLink(expectedLink: string): Promise<Event[]> {
    let nextPageToken: string | null = null;
    let foundEvent = false;
    const eventsData: Event[] = [];

    do {
      const url = new URL(
        "https://www.googleapis.com/calendar/v3/calendars/primary/events"
      );
      if (nextPageToken) {
        url.searchParams.append("pageToken", nextPageToken);
      }

      if (!session || !session.accessToken) {
        throw new Error("No session or access token found.");
      }

      const response = await fetch(url.toString(), {
        method: "GET",
        headers: { Authorization: `Bearer ${session.accessToken}` },
      });

      if (!response.ok) {
        console.error("Erro ao buscar eventos:", response.statusText);
        return [];
      }

      const data = await response.json();

      data.items.forEach(
        (event: {
          hangoutLink: any;
          summary: any;
          start: { dateTime: any };
          end: { dateTime: any };
          attendees: any[];
        }) => {
          const hangoutLink = event.hangoutLink;
          if (
            hangoutLink &&
            hangoutLink.startsWith("https://meet.google.com/")
          ) {
            const linkPart = hangoutLink.split("/").pop();

            if (linkPart === expectedLink) {
              foundEvent = true;

              const eventData: Event = {
                summary: event.summary,
                startDateTime: event.start.dateTime,
                endDateTime: event.end.dateTime,
                emails: event.attendees
                  ? event.attendees.map(
                      (attendee: { email: any }) => attendee.email
                    )
                  : [],
              };

              eventsData.push(eventData);
            }
          }
        }
      );

      nextPageToken = data.nextPageToken;
    } while (nextPageToken);

    if (!foundEvent) {
      console.log("Nenhum evento encontrado com o link especificado.");
    }

    return eventsData;
  }

  const fetchParticipants = async (accessToken: string, parent: string) => {
    const res = await fetch(
      `https://meet.googleapis.com/v2/${parent}/participants`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
    const data = await res.json();
    console.log("Participants", data);
    if (data && data.participants) {
      const participantInfo = data.participants.map(
        (participant: {
          signedinUser: { displayName: any; user: any };
          earliestStartTime: any;
          latestEndTime: any;
        }) => ({
          displayName: participant.signedinUser.displayName,
          user: participant.signedinUser.user,
          earliestStartTime: participant.earliestStartTime,
          latestEndTime: participant.latestEndTime,
        })
      );
      setParticipants(participantInfo);
    }
  };

  //Wallets
  async function createWallet(name: string) {
    try {
      const response = await fetch("/api/wallet/createWallet", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name }),
      });

      if (!session || !session.accessToken) {
        throw new Error("No session or access token found.");
      }

      const data = await response.json();
      console.log(data);
      if (response.ok) {
        const walletData = {
          name: session.user?.name,
          email: session.user?.email,
          address: data.wallet.id,
          adminKey: data.wallet.adminKey,
          invoiceKey: data.wallet.invoiceKey,
        };
        await createWalletOnBackend(walletData);
      } else {
        console.error("Erro ao criar wallet:", data.error);
      }
    } catch (error) {
      console.error("Erro na requisição:", error);
    }
  }

  async function createWalletOnBackend(walletData: any) {
    try {
      const response = await fetch("/api/database/wallet/addWallet", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(walletData),
      });

      const data = await response.json();

      if (response.ok) {
        console.log("Wallet criada com sucesso no backend:", data);
      } else {
        console.error("Erro ao criar wallet no backend:", data.error);
      }
    } catch (error) {
      console.error("Erro na requisição ao backend:", error);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!session ? (
          <SatoshiRevolution />
        ) : (
          <div className="space-y-6">
            <div className="flex flex-col justify-between h-full">
              <InvoiceGenerator />
              <div className="w-full max-w-4xl mx-auto space-y-6">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    placeholder="Search meetings..."
                    className="flex-grow px-4 py-3 border-2 border-orange-300 rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition duration-300 ease-in-out text-orange-800 bg-white placeholder-orange-300"
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <button
                    className="px-6 py-3 bg-gradient-to-r from-orange-400 to-orange-600 text-white rounded-full shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition duration-300 ease-in-out transform hover:scale-105"
                    onClick={handleSearch}
                  >
                    <Search className="h-4 w-4 mr-2 inline" />
                    Search
                  </button>
                </div>
              </div>
            </div>
            {searchResults.length > 0 && (
              <div className="w-full max-w-4xl mx-auto space-y-6">
                {events.map((meeting: any, index) => (
                  <div
                    key={index}
                    className="bg-white shadow-lg rounded-lg overflow-hidden transition duration-300 ease-in-out transform hover:scale-102 hover:shadow-xl"
                  >
                    <div className="px-6 py-4 bg-gradient-to-r from-orange-500 to-yellow-500">
                      <h3 className="text-2xl font-semibold text-white">
                        {meeting.summary}
                      </h3>
                    </div>
                    <div className="p-6">
                      <div className="flex items-center mb-4">
                        <Calendar className="h-5 w-5 text-orange-500 mr-2" />
                        <span className="text-base text-gray-600">
                          {new Date(meeting.startDateTime).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-start mb-4">
                        <Info className="h-5 w-5 text-orange-500 mr-2 mt-1 flex-shrink-0" />
                        <p className="text-base text-gray-700">
                          {meeting.summary}
                        </p>
                      </div>
                      <div className="flex items-center mb-4">
                        <Users className="h-5 w-5 text-orange-500 mr-2" />
                        <span className="text-base text-gray-600">
                          {meeting.emails.length} participants
                        </span>
                      </div>
                      <div className="mt-6">
                        <h4 className="text-lg font-medium text-gray-900 mb-3">
                          Participants:
                        </h4>
                        <ul className="space-y-3">
                          {participants.map(
                            (participant: any, pIndex: number) => (
                              <li
                                key={pIndex}
                                className="flex items-center justify-between bg-gray-50 p-3 rounded-md shadow-sm"
                              >
                                <div className="flex items-center">
                                  <div className="bg-orange-100 rounded-full p-2 mr-3">
                                    <Users className="h-4 w-4 text-orange-500" />
                                  </div>
                                  <div>
                                    <span className="font-medium text-gray-900 text-base">
                                      {participant.displayName}
                                    </span>
                                    <p className="text-xs text-gray-500">
                                      Arrived:{" "}
                                      {new Date(
                                        participant.earliestStartTime
                                      ).toLocaleTimeString()}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      Left:{" "}
                                      {new Date(
                                        participant.latestEndTime
                                      ).toLocaleTimeString()}
                                    </p>
                                  </div>
                                </div>
                                {/* <button 
                      className="px-3 py-1 border border-orange-500 rounded-full text-sm font-medium text-orange-500 hover:bg-orange-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition duration-150 ease-in-out"
                      onClick={() => {setIsOpen(true)}}
                    >
                      <Zap className="h-4 w-4 mr-1 inline" />
                      Reward
                    </button> */}
                              </li>
                            )
                          )}
                        </ul>
                        <div className="mt-6 flex justify-center">
                          <button
                            onClick={() => {
                              setIsOpen(true);
                            }}
                            className="px-3 py-1 border border-orange-500 rounded-full text-sm font-medium text-orange-500 hover:bg-orange-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition duration-150 ease-in-out flex items-center mx-auto"
                          >
                            <svg
                              className="h-4 w-4 mr-1"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                              />
                            </svg>
                            Reward All via E-mail
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {isOpen && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div
                  ref={modalRef}
                  className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md"
                >
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Reward {}
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <div className="relative">
                        <Edit3 className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          placeholder="Enter reward title"
                          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        />
                      </div>
                    </div>
                    <div>
                      <div className="relative">
                        <Bitcoin className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                          type="number"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          placeholder="Enter amount in sats"
                          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        />
                      </div>
                    </div>
                    {error && <p className="text-sm text-red-500">{error}</p>}
                  </div>
                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      onClick={() => setIsOpen(false)}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition duration-150 ease-in-out"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleReward}
                      className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition duration-150 ease-in-out"
                    >
                      Send Reward
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
      <footer className="bg-white border-t border-gray-200 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-gray-500">
          © 2023 MeetSats. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
