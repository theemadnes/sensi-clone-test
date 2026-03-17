# Deploying to Google Cloud Run

Follow these steps to deploy your Sensible Soccer clone to Google Cloud Run.

## 1. Prerequisites
- [Google Cloud SDK (gcloud)](https://cloud.google.com/sdk/docs/install) installed and initialized.
- A Google Cloud Project with billing enabled.

## 2. Prepare Your Project
Run the following commands in your terminal:

```bash
# Set your project ID
export PROJECT_ID="YOUR_PROJECT_ID"
gcloud config set project $PROJECT_ID

# Enable the necessary APIs
gcloud services enable artifactregistry.googleapis.com \
    run.googleapis.com \
    cloudbuild.googleapis.com
```

## 3. Create an Artifact Registry Repository
Create a repository for your container image:

```bash
gcloud artifacts repositories create soccer-repo \
    --repository-format=docker \
    --location=us-central1 \
    --description="Docker repository for soccer game"
```

## 4. Build and Push the Image
Use Cloud Build to build the image and push it to the registry:

```bash
gcloud builds submit --tag us-central1-docker.pkg.dev/$PROJECT_ID/soccer-repo/sensible-soccer:latest .
```

## 5. Deploy to Cloud Run
Finally, deploy the image as a Cloud Run service:

```bash
gcloud run deploy sensible-soccer \
    --image us-central1-docker.pkg.dev/$PROJECT_ID/soccer-repo/sensible-soccer:latest \
    --region us-central1 \
    --platform managed \
    --allow-unauthenticated \
    --port 8080
```

## 6. Access the Game
Once the deployment is complete, `gcloud` will provide a **Service URL** (e.g., `https://sensible-soccer-xxxx-uc.a.run.app`). Open this URL in any browser to play your game online!

---
**Note:** The provided `Dockerfile` is configured to listen on port **8080**, which is the Cloud Run default.
