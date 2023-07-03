FROM python:3.11

WORKDIR /usr/app

COPY ./requirements.txt ./requirements.txt

RUN pip3 install --no-cache-dir --upgrade -r ./requirements.txt

COPY . .

EXPOSE 8080

CMD ["uvicorn", "server:app", "--reload", "--host", "0.0.0.0", "--port", "8080"]