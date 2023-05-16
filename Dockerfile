# Use the official Python base image
FROM python:3.10.4

# Install Node.js and npm
RUN apt-get update && apt-get install -y curl && curl -sL https://deb.nodesource.com/setup_14.x | bash - && apt-get install -y nodejs

RUN curl https://sh.rustup.rs -sSf | sh -s -- -y
ENV PATH="/root/.cargo/bin:$PATH"

# Update the package list and install required packages
RUN apt-get update && apt-get install -y \
    curl \
    build-essential


# Set the working directory
WORKDIR /app

# Set OpenAI API key environment variable
ARG OPENAI_API_KEY
ENV OPENAI_API_KEY=${OPENAI_API_KEY}


# Install system dependencies
RUN apt-get update && apt-get install -y ffmpeg gcc
RUN pip install --upgrade setuptools
RUN apt-get update && apt-get install -y --no-install-recommends apt-utils
RUN pip install numpy==1.23.5
RUN pip install tokenizers
RUN npm install pg
RUN apt-get install -y build-essential && \
    pip install --upgrade pip && \
    pip install setuptools-rust && \
    pip install wheel && \
    pip install openai



# Copy the requirements file into the container
COPY requirements.txt .

# Copy package.json and package-lock.json into the working directory
COPY package*.json ./

# Make script executable
COPY log_backup.sh /app/
RUN chmod +x log_backup.sh

# Install the Python dependencies
RUN pip install -r requirements.txt && \
    pip install spacy && \
    python -m spacy download en_core_web_sm && \
    pip install tokenizers

    
# Set the PYTHONUNBUFFERED environment variable
ENV PYTHONUNBUFFERED=1
ENV PORT=5000

# Copy the rest of the application code into the container
COPY . .

# Expose the port the app will run on
EXPOSE 5000

# Install meyda using npm
RUN npm install
RUN npm install aws-sdk
RUN npm install express


# Start the application using Gunicorn
CMD ["node", "server.js"]
CMD gunicorn --timeout 120 --workers 1 --bind 0.0.0.0:${PORT:-5000} --log-level debug comedygpt:app



