import os
import threading
import queue
from typing import List
from dotenv import load_dotenv
from langchain.chains import RetrievalQA
from langchain.embeddings import HuggingFaceEmbeddings
from langchain.callbacks.streaming_stdout import StreamingStdOutCallbackHandler
from langchain.vectorstores import Chroma
from langchain.llms import GPT4All
import json


from pydantic import BaseModel


from elevenlabs import generate, save

from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse, FileResponse

load_dotenv()

# Define the Chroma settings
from constants import CHROMA_SETTINGS

embeddings_model_name = os.environ.get("EMBEDDINGS_MODEL_NAME")
persist_directory = os.environ.get('PERSIST_DIRECTORY')
model_type = os.environ.get('MODEL_TYPE')
relative_model_path = os.environ.get('MODEL_PATH')
model_n_ctx = os.environ.get('MODEL_N_CTX')
model_n_batch = int(os.environ.get('MODEL_N_BATCH',8))
target_source_chunks = int(os.environ.get('TARGET_SOURCE_CHUNKS',4))
llm = None
chunk_size = 500
chunk_overlap = 50


model_path = os.path.join(os.getcwd(), relative_model_path)


router = APIRouter()

class Message(BaseModel):
    role: str
    content: str

class Messages(BaseModel):
    messages: list[Message]


class ThreadedGenerator:
    def __init__(self):
        self.queue = queue.Queue()

    def __iter__(self):
        return self

    def __next__(self):
        item = self.queue.get()
        if item is StopIteration: raise item
        return item

    def send(self, data):
        self.queue.put(data)

    def close(self):
        self.queue.put(StopIteration)

class ChainStreamHandler(StreamingStdOutCallbackHandler):
    def __init__(self, gen):
        super().__init__()
        self.gen = gen

    def on_llm_new_token(self, token: str, **kwargs):
        self.gen.send(token)




def llm_thread(g, query, retriever):
    try:
        llm = GPT4All(model=model_path, n_ctx=model_n_ctx, backend='gptj', n_batch=model_n_batch, callbacks=[ChainStreamHandler(g)], verbose=False, streaming=True)
        
        qa = RetrievalQA.from_chain_type(llm=llm, chain_type="stuff", retriever=retriever)

        qa.run(query)

    finally:
        g.close()


def chat(prompt, retriever):
    g = ThreadedGenerator()
    threading.Thread(target=llm_thread, args=(g, prompt, retriever)).start()
    return g


@router.post('/query')
async def run_query(request: Request):

    body = await request.body()

    request_body = json.loads(body.decode("utf-8")) 

    message = request_body['messages'][-1]

    assert message['role'] == 'user'

    query = message['content']

    # Create embeddings
    embeddings = HuggingFaceEmbeddings(model_name=embeddings_model_name)
   
    db = Chroma(persist_directory=persist_directory, embedding_function=embeddings, client_settings=CHROMA_SETTINGS)
    retriever = db.as_retriever(search_kwargs={"k": target_source_chunks})

    return StreamingResponse(chat(query, retriever), media_type='text/event-stream')


@router.post('/audio')
async def fetch_speech(request : Request):

    body = await request.body()

    request_body = body.decode("utf-8")

    audio_bytes = generate(text=request_body, voice="Bella", model="eleven_monolingual_v1")

    save(audio=audio_bytes, filename="output_voice.wav")

    path_audio = os.path.join(os.getcwd(), "output_voice.wav")

    return FileResponse(path_audio, media_type='audio/wav')

