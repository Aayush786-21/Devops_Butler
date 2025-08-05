FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt ./
RUN pip install -r requirements.txt

COPY downloader.py ./
COPY database.py ./
COPY README.md ./
COPY main.py ./
COPY gui.py ./

EXPOSE 5000

CMD ["python", "main.py"]