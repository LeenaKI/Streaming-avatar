import { AVATARS, KNOWLWEDGE, VOICES } from "@/app/lib/constants";
import {
  Configuration,
  NewSessionData,
  StreamingAvatarApi,
} from "@heygen/streaming-avatar";
import {
  Button,
//   Card,
//   CardBody,
//   CardFooter,
//   Divider,
  Input,
//   Select,
//   SelectItem,
  Spinner,
  Tooltip,
} from "@nextui-org/react";
import { Microphone, MicrophoneStage } from "@phosphor-icons/react";
import { useChat } from "ai/react";
import clsx from "clsx";
import OpenAI from "openai";
import { useEffect, useRef, useState } from "react";
import "./navbar.css";
import InteractiveAvatarTextInput from "./InteractiveAvatarTextInput";

import Groq from "groq-sdk";

const openai = new Groq({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

// Define a type for chat messages
type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};


export default function InteractiveAvatar() {
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [isLoadingSession, setIsLoadingSession] = useState(false);
  const [isLoadingRepeat, setIsLoadingRepeat] = useState(false);
  const [isLoadingChat, setIsLoadingChat] = useState(false);
  const [stream, setStream] = useState<MediaStream>();
  const [debug, setDebug] = useState<string>();
  const [avatarId, setAvatarId] = useState<string>("Anna_public_3_20240108");
  const [voiceId, setVoiceId] = useState<string>("1bd001e7e50f421d891986aad5158bc8");
  const [data, setData] = useState<NewSessionData>();
  const [text, setText] = useState<string>("");
  const [initialized, setInitialized] = useState(false); // Track initialization
  const [recording, setRecording] = useState(false); // Track recording state
  const mediaStream = useRef<HTMLVideoElement>(null);
  const avatar = useRef<StreamingAvatarApi | null>(null);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [newInput, setNewInput] = useState("");
  const [gptoutput , setGptOutput] = useState<string>("");
  const [startInitial, setStartInitial] = useState(false)
  const { input, setInput, handleSubmit } = useChat({
    onFinish: async (message) => {
      console.log("Response:", message);

      if (!initialized || !avatar.current) {
        setDebug("Avatar API not initialized");
        return;
      }

      //send the ChatGPT response to the Interactive Avatar
      await avatar.current
        .speak({
          taskRequest: { text: message.content, sessionId: data?.sessionId },
        })
        .catch((e) => {
          setDebug(e.message);
        });
      setIsLoadingChat(false);
    },
    initialMessages: [
      {
        id: "1",
        role: "system",
        content: "You are a helpful assistant.",
      },
    ],
  });

 
  async function fetchAccessToken() {
    try {
      const response = await fetch("/api/get-access-token", {
        method: "POST",
      });
      const token = await response.text();
      console.log("Access Token:", token); // Log the token to verify
      return token;
    } catch (error) {
      console.error("Error fetching access token:", error);
      return "";
    }
  }

  async function startSession() {
    setIsLoadingSession(true);
    await updateToken();
    if (!avatar.current) {
      setDebug("Avatar API is not initialized");
      return;
    }
    try {
      const res = await avatar.current.createStartAvatar(
        {
          newSessionRequest: {
            quality: "medium",
            avatarName: "Tyler-incasualsuit-20220721",
            voice: { voiceId: "aee6c1539b7745a5a7e2f4e537d9bff4" },
            knowledgeBase: KNOWLWEDGE
          },
        },
        setDebug
      );
      setData(res);
      setStream(avatar.current.mediaStream);
      setIsSessionActive(true); // Set session as active
      setStartInitial(true)
    } catch (error) {
      alert("Limit Expired, Please try after some time")
      setDebug(
        `There was an error starting the session. ${
          voiceId ? "This custom voice ID may not be supported." : ""}`
      );
    }
    setIsLoadingSession(false);
  }

  async function endSession() {
    if (!initialized || !avatar.current) {
      setDebug("Avatar API not initialized");
      return;
    }
    await avatar.current.stopAvatar(
      { stopSessionRequest: { sessionId: data?.sessionId } },
      setDebug
    );
    setStream(undefined);
    setIsSessionActive(false); // Set session as inactive
  }

  async function updateToken() {
    const newToken = await fetchAccessToken();
    console.log("Updating Access Token:", newToken); // Log token for debugging
    avatar.current = new StreamingAvatarApi(
      new Configuration({ accessToken: newToken })
    );

    const startTalkCallback = (e: any) => {
      console.log("Avatar started talking", e);
    };

    const stopTalkCallback = (e: any) => {
      console.log("Avatar stopped talking", e);
      setNewInput("")
    };

    console.log("Adding event handlers:", avatar.current);
    avatar.current.addEventHandler("avatar_start_talking", startTalkCallback);
    avatar.current.addEventHandler("avatar_stop_talking", stopTalkCallback);

    setInitialized(true);
  }

  async function handleInterrupt() {
    if (!initialized || !avatar.current) {
      setDebug("Avatar API not initialized");
      return;
    }
    setNewInput("")
    await avatar.current
      .interrupt({ interruptRequest: { sessionId: data?.sessionId } })
    
      .catch((e) => {
        setDebug(e.message);
      
      });
     
  }

  async function handleSpeak() {
    setIsLoadingRepeat(true);
    if (!initialized || !avatar.current) {
      setDebug("Avatar API not initialized");
      return;
    }
    await avatar.current
      .speak({ taskRequest: { text: text, sessionId: data?.sessionId } })
      .catch((e) => {
        setDebug(e.message);
      });
    setIsLoadingRepeat(false);
  }

  useEffect(() => {
    async function init() {
      const newToken = await fetchAccessToken();
      console.log("Initializing with Access Token:", newToken); // Log token for debugging
      avatar.current = new StreamingAvatarApi(
        new Configuration({ accessToken: newToken, jitterBuffer: 200 })
      );
      setInitialized(true); // Set initialized to true
    }
    init();

    return () => {
      endSession();
    };
  }, []);

  useEffect(() => {
    if (stream && mediaStream.current) {
      mediaStream.current.srcObject = stream;
      mediaStream.current.onloadedmetadata = () => {
        mediaStream.current!.play();
        setDebug("Playing");
      };
    }
  }, [mediaStream, stream]);

  function startRecording() {
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        mediaRecorder.current = new MediaRecorder(stream);
        mediaRecorder.current.ondataavailable = (event) => {
          audioChunks.current.push(event.data);
        };
        mediaRecorder.current.onstop = () => {
          const audioBlob = new Blob(audioChunks.current, {
            type: "audio/wav",
          });
          audioChunks.current = [];
          transcribeAudio(audioBlob);
        };
        mediaRecorder.current.start();
        setRecording(true);
      })
      .catch((error) => {
        console.error("Error accessing microphone:", error);
      });
  }

  function stopRecording() {
    if (mediaRecorder.current) {
      mediaRecorder.current.stop();
      setRecording(false);
    }
  }

  useEffect(() => {
    // Define an async function
    
    const fetchData = async () => {
  
      console.log("useEffect triggered");
      
      try {
      setTimeout(async()=>{
        if (isSessionActive && data?.sessionId && avatar.current && !isLoadingSession) {
          setIsLoadingChat(false)
          console.log("Enter inside the code", isSessionActive)
          // Update the Gpt Output Showing
          const name = localStorage.getItem("name")
          const text = `Hi ${name}, great to have you here! Let me assist you in finding the perfect Hyundai. Would you like to know more about the Venue, Alcazar, or Creta?`
          console.log("sessionId", data.sessionId);

          const newUserMessage: ChatMessage = {
            role: 'user',
            content: text
          };

          const updatedHistory = [...chatHistory, newUserMessage];

          
          await avatar.current
            .speak({
              taskRequest: { text: text, sessionId: data?.sessionId },
            })
            .catch(async (e) => {
              // Check if the error is an object with a response field
              if (e && e.response) {
                try {
                  // Await the JSON response
                  const error = await e.response.json();
                  const errorMessage = error.message || e.response.statusText || "Unknown error occurred";
                  console.log("Error code:", error.code, " - ", errorMessage);
  
                  if(error.code == 10005){
                    alert("Session Expired")
                    window.location.reload()
                  }
                  else if(error.code == 10015){
                    alert("Limit Expired , Please come after some time")
                    window.location.reload()
                  }
                  // Optionally, you can set the debug message here if needed
                  setDebug(`Error code: ${error.code} - ${errorMessage}`);
                } catch (jsonError) {
                  // Handle any errors that occur while parsing the JSON
                  console.log("Error parsing JSON response:", jsonError);
                  setDebug("An error occurred while parsing the error response.");
                }
              } else {
                // If it's not a structured response, handle it as a generic error
                console.log("Error is ", e);
                setDebug(e.message || "An unknown error occurred.");
              }
            });

            setChatHistory(updatedHistory)
          
        } else {
          setDebug("Avatar API not initialized");
        }
      },2000) 
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
  
    // Immediately call the async function inside useEffect
    fetchData();
  
    // Return nothing or a cleanup function
  }, [isSessionActive, isLoadingSession]);  // The dependency array for the effect

  async function transcribeAudio(audioBlob: Blob) {
    try {
      // Convert Blob to File
      const audioFile = new File([audioBlob], "recording.wav", {
        type: "audio/wav",
      });
      // const response = await openai.audio.transcriptions.create({
      //   model: "whisper-1",
      //   file: audioFile,
      // });
      const response = await openai.audio.transcriptions.create({
        file: audioFile,
        model: "whisper-large-v3",
        prompt: "Specify context or spelling", // Optional
        response_format: "json", // Optional
        language: "en", // Optional
        temperature: 0.0, // Optional
      });
      const transcription = response.text;
      console.log("Transcription: ", transcription);
      setNewInput(transcription);
      handleGetResponse(transcription)
    } catch (error) {
      console.error("Error transcribing audio:", error);
    }
  }

  async function handleGetResponse(inp : string) {
    console.log("handleGetResponse triggered", newInput, inp);
    let accumulatedText = "";
    const chunkSize = 100; // Adjust based on your needs

    setIsLoadingChat(true)
    try {
      // Add the new user message to the chat history
    const newUserMessage: ChatMessage = {
      role: 'user',
      content: inp ? inp : newInput
    };

    const updatedHistory = [...chatHistory, newUserMessage];

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json", // Ensure the content type is set to JSON
        },
        body: JSON.stringify({ messages: updatedHistory }),
      });

    //   const reader = response.body?.getReader();
    //   console.log()
    // if (!reader) throw new Error("Failed to get reader from response");

    // while (true) {
    //   const { done, value } = await reader.read();
    //   if (done) break;
      
    //   const chunk = new TextDecoder().decode(value);
    //   accumulatedText += chunk;
    //   console.log("Received chunk:", chunk);

    //   // If we've accumulated enough text, send it to the avatar
    //   if (accumulatedText.length >= chunkSize) {
    //     if (avatar.current) {
    //       try {
    //         await avatar.current.speak({
    //           taskRequest: { text: accumulatedText, sessionId: data?.sessionId },
    //         });
    //       } catch (e) {
    //         setDebug(`Error sending chunk to avatar: ${e.message}`);
    //       }
    //     } else {
    //       setDebug("Avatar API not initialized");
    //     }
    //     accumulatedText = ""; // Reset accumulated text
    //   }
    // }

    // // Send any remaining text to the avatar
    // if (accumulatedText.length > 0 && avatar.current) {
    //   try {
    //     await avatar.current.speak({
    //       taskRequest: { text: accumulatedText, sessionId: data?.sessionId },
    //     });
    //   } catch (e) {
    //     setDebug(`Error sending final chunk to avatar: ${e.message}`);
    //   }
    // }


      console.log("response", response); // Log the token to verify
      // return token;
      const dataFromApi = await response.text()
      // Sanitize the text to remove any special characters
    const sanitizedData = dataFromApi.replace(/[*_~`]/g, '');

      console.log("data", dataFromApi);
      setChatHistory([...updatedHistory])

      if (isSessionActive && avatar.current) {
        setIsLoadingChat(false)
        setGptOutput(sanitizedData)
        await avatar.current
          .speak({
            taskRequest: { text: sanitizedData, sessionId: data?.sessionId },
          })
          .catch(async (e) => {
            // Check if the error is an object with a response field
            if (e && e.response) {
              try {
                // Await the JSON response
                const error = await e.response.json();
                const errorMessage = error.message || e.response.statusText || "Unknown error occurred";
                console.log("Error code:", error.code, " - ", errorMessage);

                if(error.code == 10005){
                  alert("Session Expired")
                  window.location.reload()
                }
                else if(error.code == 10015){
                  alert("Limit Expired , Please come after some time")
                  window.location.reload()
                }
                // Optionally, you can set the debug message here if needed
                setDebug(`Error code: ${error.code} - ${errorMessage}`);
              } catch (jsonError) {
                // Handle any errors that occur while parsing the JSON
                console.log("Error parsing JSON response:", jsonError);
                setDebug("An error occurred while parsing the error response.");
              }
            } else {
              // If it's not a structured response, handle it as a generic error
              console.log("Error is ", e);
              setDebug(e.message || "An unknown error occurred.");
            }
          });
      } else {
        setDebug("Avatar API not initialized");
      }
      
    } catch (error) {
      console.error("Error fetching response from AI:", error);
      return "";
    }
  }

  return (
    <div className="w-full flex flex-col gap-4" id="avatar-card">
      <div>
        <div className="" >
          {stream ? (
            <div className="justify-center items-center flex rounded-lg overflow-hidden">
              <video
              className="video"
                ref={mediaStream}
                autoPlay
                playsInline
                style={{
                  width: "86%",
                  height: "335px",
                  objectFit: "contain",
                  filter:'hue-rotate(5deg)',
                  marginTop:'1.10rem'
                }}
              >
                <track kind="captions" />
              </video>
              <div className="flex flex-row gap-10 absolute" id="avatarsession-btn"style={{marginTop:'24rem'}}>
                <Button
                  size="md"
                  style={{
                    width:"9rem"
                  }}
                  onClick={handleInterrupt}
                  className="bg-gradient-to-tr from-indigo-500 to-indigo-300 text-white rounded-lg"
                  variant="shadow"
                >
                  Interrupt task
                </Button>
                <Button
                  size="md"
                  style={{
                    width:"9rem"
                  }}
                  onClick={endSession}
                  className="bg-gradient-to-tr from-indigo-500 to-indigo-300  text-white rounded-lg"
                  variant="shadow"
                >
                  End session
                </Button>
              </div>
            </div>
          ) : !isLoadingSession ? (
            <div className="session-card">
              <div>
                <p className="custom-avatar">
                  Custom Avatar ID
                </p>
                <Input
                  value="Tyler-incasualsuit-20220721"
                  // onChange={(e) => setAvatarId(e.target.value)}
                  placeholder="Enter a custom avatar ID"
                />
                {/* <Select
                  placeholder="Or select one from these example avatars"
                  size="md"
                  onChange={(e) => {
                    setAvatarId(e.target.value);
                  }}
                > */}
                  {/* {AVATARS.map((avatar) => (
                    <SelectItem
                      key={avatar.avatar_id}
                      textValue={avatar.avatar_id}
                    >
                      {avatar.name}
                    </SelectItem>
                  ))}
                </Select> */}
              </div>
              <div style={{marginTop:"1rem"}}>
                <p className="custom-avatar">
                  Custom Voice ID
                </p>
                <Input
                  value="aee6c1539b7745a5a7e2f4e537d9bff4"
                  // onChange={(e) => setVoiceId(e.target.value)}
                  placeholder="Enter a custom voice ID"
                />
                {/* <Select
                  placeholder="Or select one from these example voices"
                  size="md"
                  onChange={(e) => {
                    setVoiceId(e.target.value);
                  }}
                >
                  {VOICES.map((voice) => (
                    <SelectItem key={voice.voice_id} textValue={voice.voice_id}>
                      {voice.name} | {voice.language} | {voice.gender}
                    </SelectItem>
                  ))}
                </Select> */}
              </div>
              <Button
                size="md"
                onClick={startSession}
                className="bg-gradient-to-tr from-indigo-500 to-indigo-300 w-full text-white"
                id="session-btn"
                variant="shadow"
              >
                Start session
              </Button>
            </div>
          ) : (
            <Spinner size="lg" color="default" />
          )}
        </div>
        {isSessionActive && ( // Only show input when session is active
        <div className="flex flex-col" id="textInput" style={{paddingRight:'0.5rem',paddingLeft:'0.5rem'}}>
          {/* <Divider /> */}
            <InteractiveAvatarTextInput
              label=" "
              placeholder="Chat with the avatar"
              input={newInput}
              onSubmit={() => {
                setIsLoadingChat(true);
                if (!newInput) {
                  setDebug("Please enter text");
                  return;
                }
                // handleSubmit();
                handleGetResponse("");
              }}
              setInput={setNewInput}
              loading={isLoadingChat}
              endContent={
                <Tooltip
                  content={!recording ? "Start recording" : "Stop recording"}
                >
                  <Button
                    onClick={!recording ? startRecording : stopRecording}
                    isDisabled={!stream}
                    isIconOnly
                    className={clsx(
                      "mr-4 text-white",
                      !recording
                        ? "bg-gradient-to-tr from-indigo-500 to-indigo-300"
                        : ""
                    )}
                    size="sm"
                    variant="shadow"
                  >
                    {!recording ? (
                      <Microphone size={20} />
                    ) : (
                      <>
                        <div className="absolute h-full w-full bg-gradient-to-tr from-indigo-500 to-indigo-300 animate-pulse -z-10"></div>
                        <MicrophoneStage size={20} />
                      </>
                    )}
                  </Button>
                </Tooltip>
              }
              disabled={!stream}
            />
        </div>
          )}
      </div>
      {
        gptoutput && <p>
            {gptoutput}
        </p>
      }
    </div>
  );
}