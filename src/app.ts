import express from "express";
import cors from "cors";

console.log("app!!!!!");

const port = process.env.PORT || 3000;

// authorization for D-ID
const DID_API_URL = process.env.DID_API_URL;
const DID_API_KEY = process.env.DID_API_KEY;

// authorization for youtube
const VIDEO_ID = process.env.VIDEO_ID;
const API_KEY = process.env.API_KEY;

const app = express();
app.use(express.json());
app.use(cors());

app.post("/talks-stream", async (req, res) => {
  const { imgUrl } = req.body;
  console.log("imgUrl", imgUrl);
  console.log("req.body", req.body);

  try {
    const response = await fetch(`${DID_API_URL}/talks/streams`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${DID_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        source_url: imgUrl,
      }),
    });

    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.post("/ice", async (req, res) => {
  const { candidate, sdpMid, sdpMLineIndex, sessionId } = req.body;
  try {
    const response = await fetch(
      `${DID_API_URL}/talks/streams/${req.body.streamId}/ice`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${DID_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          candidate,
          sdpMid,
          sdpMLineIndex,
          session_id: sessionId,
        }),
      }
    );

    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.post("/sdp", async (req, res) => {
  const { streamId, sessionClientAnswer, sessionId } = req.body;

  try {
    const response = await fetch(
      `${DID_API_URL}/talks/streams/${streamId}/sdp`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${DID_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          answer: sessionClientAnswer,
          session_id: sessionId,
        }),
      }
    );

    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.delete("/stream/:streamId", async (req, res) => {
  const { streamId } = req.params;
  const { sessionId } = req.body;

  try {
    const response = await fetch(`${DID_API_URL}/talks/streams/${streamId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Basic ${DID_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ session_id: sessionId }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    res.status(200).send("Delete request successful");
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.post("/streams", async (req, res) => {
  const { streamId, script, driver_url, config, sessionId } = req.body;
  console.log("req.body >>", req.body);

  try {
    const response = await fetch(`${DID_API_URL}/talks/streams/${streamId}`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${DID_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        script,
        driver_url,
        config,
        session_id: sessionId,
      }),
    });

    const data = await response.json();
    console.log("streams data >>", data);

    res.status(200).json(data);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Internal Server Error");
  }
});

const createRegex = (initialTexts: string[]) => {
  // Escape special characters in each initial text
  const escapedInitialTexts = initialTexts.map((text) =>
    text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  );

  // Join the escaped texts with the pipe symbol (|) for the regex 'or' condition
  const initialTextsPattern = escapedInitialTexts.join("|");

  // Return the new regex, matching the literal '+1' or variations of it
  return new RegExp(`(?:${initialTextsPattern})(?:\\+1|\\+\\+|\\+{3,}|讚)`);
};

type LiveChatMessage = {
  id: string;
  snippet: {
    displayMessage: string;
  };
};

type ChatData = {
  items: LiveChatMessage[];
};

let blueCount = 0;
let whiteCount = 0;
let greenCount = 0;

const processChatMessages = (chatData: LiveChatMessage[]) => {
  const blueRegex = createRegex([
    "猴猴",
    "hoho",
    "侯友宜",
    "友宜",
    "ho",
    "侯侯",
  ]);
  const whiteRegex = createRegex([
    "柯柯",
    "KP",
    "科P",
    "柯文哲",
    "文哲",
    "kp",
    "柯P",
    "柯p",
  ]);
  const greenRegex = createRegex([
    "賴賴",
    "金孫",
    "賴功德",
    "功德",
    "賴清德",
    "清德",
    "lai",
    "lailai",
  ]);

  chatData.forEach((item) => {
    if (blueRegex.test(item.snippet.displayMessage)) {
      blueCount++;
    }
    if (whiteRegex.test(item.snippet.displayMessage)) {
      whiteCount++;
    }
    if (greenRegex.test(item.snippet.displayMessage)) {
      greenCount++;
    }
  });

  return { blueCount, whiteCount, greenCount };
};

let lastProcessedMessageId: string | null = null;

async function getLiveChatMessages(): Promise<LiveChatMessage[]> {
  try {
    console.log("getLiveChatMessages!!");

    const videoUrl = `https://www.googleapis.com/youtube/v3/videos?part=liveStreamingDetails&id=${VIDEO_ID}&key=${API_KEY}`;
    const videoResponse = await fetch(videoUrl);
    const videoData = await videoResponse.json();
    console.log("videoData", videoData);

    const liveChatId = videoData.items[0].liveStreamingDetails.activeLiveChatId;

    const chatUrl = `https://www.googleapis.com/youtube/v3/liveChat/messages?liveChatId=${liveChatId}&part=id,snippet,authorDetails&key=${API_KEY}&maxResults=2000`;
    const chatResponse = await fetch(chatUrl);
    const chatData: ChatData = await chatResponse.json();

    let newMessages: LiveChatMessage[] = chatData.items;
    if (lastProcessedMessageId) {
      const lastProcessedIndex = chatData.items.findIndex(
        (item) => item.id === lastProcessedMessageId
      );
      if (lastProcessedIndex !== -1) {
        newMessages = chatData.items.slice(lastProcessedIndex + 1);
      }
    }

    if (newMessages?.length > 0) {
      lastProcessedMessageId = newMessages[newMessages?.length - 1].id;
    }

    console.log("newMessages", newMessages);

    return newMessages;
  } catch (error) {
    console.error("Error fetching live chat messages:", error);
    throw error;
  }
}

app.get("/chat", async (req, res) => {
  try {
    const chatData = await getLiveChatMessages();
    const processChatMessagesResult = processChatMessages(chatData);
    console.log("processChatMessagesResult", processChatMessagesResult);

    res.json(processChatMessagesResult);
  } catch (error) {
    res.status(500).send("Error fetching chat data");
  }
});
