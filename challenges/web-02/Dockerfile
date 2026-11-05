FROM python:3.13-slim
WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
RUN pip install --no-cache-dir Flask==3.1.2 waitress==3.0.2
COPY app.py .
USER 10001:10001
EXPOSE 5000
CMD ["python", "app.py"]
