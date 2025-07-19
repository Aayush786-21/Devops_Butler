FROM python:3.11-slim
WORKDIR /app/api
COPY api/requirements.txt ./
RUN pip install -r requirements.txt
COPY api/. .
EXPOSE 5000
CMD ["python", "app.py"] 