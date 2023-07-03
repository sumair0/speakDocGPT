"use client";

import { useEffect, useRef, useState } from "react";
import { useChat } from "ai/react";

import { IconAI, IconCheck, IconFinal, IconPlay, IconSmiley, IconSpinner, IconUser, SendIcon } from "@/components/ui/icon";


import clsx from "clsx";


import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const docMessageExamples = [
    "> Upload any textual PDF document",
    "> Summarize the { .... } section of the uploaded research paper PDF",
    "> What are required steps to form a habit?",
  ];


export default function Chat(){

    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [fileUploaded, setFileUploaded] = useState<Boolean>(false);
    const [fileLoading, setFileLoading] = useState<Boolean>(false);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);

    const formRef = useRef<HTMLFormElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const { messages, input, setInput, handleSubmit, isLoading } = useChat({
      api: "http://localhost:80/query"
    });

    const disabled = isLoading || input.length === 0 || !fileUploaded;

    // File upload logic and code sits here
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files && event.target.files[0];
        setSelectedFile(file);
    };


    // File upload sending code sits here
    const handleFileUpload = async (event: React.FormEvent) => {

        event.preventDefault();
    
        if (selectedFile) {
          try {
            setFileLoading(true);
            const formData = new FormData();
            formData.append('file', selectedFile);
    
            console.log(selectedFile.name);
    
            console.log(formData);
    
            // Make a request to the server API
            const response = await fetch('http://localhost:80/upload', {
              method: 'POST',
              body: formData,
            });
    
            // Handle the response from the server
            if (response.ok) {
                setFileLoading(false);
                setFileUploaded(true)
              console.log('File uploaded successfully!');
            } else {
              console.error('Failed to upload file.');
            }
          } catch (error) {
            console.error('Error uploading file:', error);
          }
        }
    };


    const fetchAudio = async (msgv: string) => {
      try {
        const response = await fetch('http://localhost:80/audio', {
          method: 'POST',
          body: msgv
        });
        if (response.ok) {
          const blob = await response.blob();
          const audioUrl = URL.createObjectURL(blob);
          setAudioUrl(audioUrl);
          const audio = new Audio(audioUrl);
          audio.play();
        } else {
          console.error('Failed to fetch audio file:', response.status);
        }
      } catch (error) {
        console.error('Error fetching audio file:', error);
      }
    };



    useEffect(() => {
      const handlePageUnload = () => {
        // Send a request to the backend to notify about page refresh or closure
        // Use fetch or any other HTTP library to make the request
        fetch('http://localhost:80/pageunmounted', {
          method: 'POST'
        });
      };
  
      // Attach the event listener to the 'beforeunload' event
      window.addEventListener('beforeunload', handlePageUnload);
  
      // Clean up the event listener when the component is unmounted
      return () => {
        window.removeEventListener('beforeunload', handlePageUnload);
      };
    }, []);
  




    return(
        <main className="flex flex-col items-center justify-between pb-40 ">
            <div className="absolute top-5 hidden w-full justify-between px-5 sm:flex ">
                <a className="rounded-lg p-2 transition-colors duration-100 hover:bg-stone-200 sm:bottom-auto">
                    <IconFinal />
                </a>
                <a className="rounded-xl p-1 transition-colors duration-100 hover:bg-stone-200 sm:bottom-auto"
                   href="https://www.sumairbashir.com"
                   target="_blank"
                   rel="noopener noreferrer">
                    <IconSmiley />
                </a>
            </div>
            <div className="border-indigo-950sm:mx-0 mx-5 mt-20 max-w-screen-sm  shadow-md rounded-md border sm:w-full">
                <div className="flex flex-col space-y-4 p-7 sm:p-10">
                    <h1 className="text-2xl font-semibold text-center text-black antialiased">Welcome to speakDocGPT!</h1>
                    <p className="text-gray-500 ">Ask questions to your document and hear it out.</p>
                    <p className="text-gray-500 text-sm">Begin by uploading your pdf document below </p>
                </div>
                {/* <div className="flex flex-col space-y-4 border-t border-gray-200 bg-gray-50 p-7 sm:p-10">
                    {docMessageExamples.map((example,i) => (
                        <p className="text-gray-400 text-xs">{example}</p>
                    ))
                    } 
                </div> */}
                <div className="flex w-full flex-row items-center p-5 pb-3 border-t border-gray-200">
                    {/* TODO button handlers 
                        UPDATE done*/}
                    <input type="file" className="px-4 mx-8 pb-3 pt-3 block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-stone-100 file:text-red-500 hover:file:bg-stone-200 " 
                           onChange={handleFileChange}/>
                    <button className="border-0 mr-4 py-2 px-4 items-center justify-center rounded-full text-white bg-stone-500 text-sm font-semibold hover:bg-black"
                            onClick={handleFileUpload} >
                         Upload
                    </button>
                    {fileLoading ? (
                    <div className="items-center justify-center text-gray-400 text-sm"> 
                        <IconSpinner /> 
                    </div> ) : (<div></div>)
                    }
                    {fileUploaded ? (
                    <div className="items-center justify-center text-green-500 text-sm">
                        <IconCheck /> 
                    </div> ) : (<div></div>)
                    }
                </div>
            </div>
            {messages.length > 0 ? (
                    messages.map((message, i) => (
                        <div 
                            key = {i}
                            className={clsx(
                                "flex w-full items-center justify-center border-b border-gray-200 py-8",
                                message.role === "user" ? "bg-white" : "bg-gray-100",
                              )} >
                                <div className="flex w-full max-w-screen-md items-start space-x-4 px-5 sm:px-0">
                                    <div className={clsx("p-1.5 text-white",message.role === "assistant" ? "bg-green-500" : "bg-black",)}>
                                        {message.role == "user" ? (<IconUser />) : (<IconAI />)}
                                    </div>
                                    <ReactMarkdown className="prose mt-1 w-full break-words prose-p:leading-relaxed" remarkPlugins={[remarkGfm]}>
                                        {message.content}
                                    </ReactMarkdown>
                                    <div className={clsx("p-3 text-indigo","rounded-lg transition-colors duration-50 hover:bg-stone-300 sm:bottom-auto")}>
                                        {message.role == "assistant" && i == messages.length - 1 ? (
                                        <div>
                                          <button onClick={() => fetchAudio(message.content)}>
                                            <IconPlay />
                                          </button> 
                                        </div>) : (<div></div>)} 
                                    </div>
                                    <div>
                                    
                                    </div>
                                </div>

                        </div>
                    ))
                ):(
                    <div></div>
                )
            }
            <div className="fixed bottom-0 flex w-full flex-col items-center space-y-3 bg-gradient-to-b from-transparent via-gray-100 to-gray-100 p-5 pb-3 sm:px-0">
                {/* TODO: input and button handlers */}
                <form ref={formRef} onSubmit={handleSubmit} className="relative w-full max-w-screen-md rounded-xl border border-gray-200 bg-white px-4 pb-2 pt-3 shadow-lg sm:pb-3 sm:pt-4">
                    <input type="text" ref={inputRef} tabIndex={0} required autoFocus placeholder="Ask a question" value={input}
                           onChange={(e) => setInput(e.target.value)} className="w-full pr-10 focus:outline-none" />
                    <button className={clsx("absolute inset-y-0 right-3 my-auto flex h-8 w-8 items-center justify-center rounded-md transition-all", disabled ? "cursor-not-allowed bg-white": "bg-green-500 hover:bg-green-600",)}
                            disabled={disabled} >
                                {isLoading ? (<IconSpinner />) : (<SendIcon className={clsx("h-4 w-4",input.length === 0 ? "text-gray-300" : "text-white",)} />)}
                    </button>
                </form>
                <p className="text-center text-xs text-stone-400">
          Built with{" "}
          <a
            href="https://gpt4all.io/index.html"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-black"
          >
            GPT4All
          </a>{" "}
          ,{" "}
          <a
            href="https://nextjs.org/"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-black"
          >
            NextJS
          </a>{" "}
          ,{" "}
          <a
            href="https://www.python.org/"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-black"
          >
            Python
          </a>{" "}
          ,{" "}
          <a
            href="https://fastapi.tiangolo.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-black"
          >
            FastAPI
          </a>{" "}
          ,{" "}
          <a
            href="https://python.langchain.com/docs/get_started/introduction.html"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-black"
          >
            LangChain
          </a>{" "}
          ,{" "}
          <a
            href="https://www.trychroma.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-black"
          >
            Chroma
          </a>
          .{" "}
          and{" "}
          <a
            href="https://beta.elevenlabs.io/"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-black"
          >
            ElevenLabs
          </a>
          .{" "}
        </p>
        </div>
        </main>
    )

}