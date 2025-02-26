# Use an official Python runtime as a parent image
FROM python:3.10-slim

# Set the working directory to /app
WORKDIR /app

# Copy the current directory contents into the container at /app
COPY . /app

# Install any needed packages specified in requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Expose the port the app runs on
EXPOSE 8000

# Define environment variable for the port
ENV PORT 8000

# Run gunicorn server with environment variable for the port
CMD ["gunicorn", "server:app", "--bind", "0.0.0.0:8000"]
