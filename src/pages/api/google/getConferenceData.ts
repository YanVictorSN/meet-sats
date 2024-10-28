import type { NextApiRequest, NextApiResponse } from "next";
import { getSession } from "next-auth/react";
const session = await getSession();

interface Event {
  summary: string;
  startDateTime: string;
  endDateTime: string;
  emails: string[];
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { meetingUrl } = req.query;
  console.log(meetingUrl, "ÉOQ");

  if (!meetingUrl || typeof meetingUrl !== "string") {
    return res.status(400).json({ error: "Invalid meeting URL" });
  }

  try {
    const meetingCode = meetingUrl.split("/").pop() || "";
    const eventsData = await checkHangoutLink(meetingCode);

    if (!session || !session.accessToken) {
      throw new Error("No session or access token found.");
    }

    const meetingResponse = await fetch(
      `https://meet.googleapis.com/v2/conferenceRecords?filter=space.meeting_code=${meetingCode}`,
      {
        headers: { Authorization: `Bearer ${session.accessToken}` },
      }
    );

    const meetingData = await meetingResponse.json();
    console.log(meetingData);

    const searchResults = meetingData.conferenceRecords || [];
    console.log(eventsData, "eventos");

    const participants = await fetchParticipants(
      session.accessToken,
      searchResults[0]?.name
    );

    return res.status(200).json({ eventsData, searchResults, participants });
  } catch (error) {
    console.error("Error fetching meeting data:", error);
    return res.status(500).json({ error: "Failed to fetch meeting data" });
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
        if (hangoutLink && hangoutLink.startsWith("https://meet.google.com/")) {
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
    return participantInfo;
  }
  return [];
};
