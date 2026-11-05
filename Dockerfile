FROM python:3.13-slim
WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 HOST=0.0.0.0 DATABASE_PATH=/data/lab.db
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY app.py orchestrator.py ./
COPY templates ./templates
COPY static ./static
COPY challenges ./challenges
EXPOSE 5000
CMD ["python", "app.py"]
