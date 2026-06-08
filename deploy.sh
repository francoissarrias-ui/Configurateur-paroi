#!/bin/bash

# Configuration
SERVICE_NAME="simulateur-paroi-bioclimatique"
REGION="europe-west1" # Vous pouvez changer pour une autre région (ex. europe-west9 pour Paris)

echo "=============== CUSTOM GOOGLE CLOUD RUN DEPLOYER ==============="
echo "Ce script va compiler et héberger votre outil sur Google Cloud Run."
echo "================================================================="

# Vérification de l'authentification gcloud
PROJECT_ID=$(gcloud config get-value project 2>/dev/null)

if [ -z "$PROJECT_ID" ]; then
  echo "❌ Erreur : Aucun projet Google Cloud n'est sélectionné."
  echo "Veuillez vous connecter et définir un projet avec :"
  echo "  gcloud auth login"
  echo "  gcloud config set project MON_PROJECT_ID"
  exit 1
fi

echo "📍 Projet GCP détecté : $PROJECT_ID"
echo "⚙️ Nom du service Run  : $SERVICE_NAME"
echo "🌍 Région sélectionnée   : $REGION"
echo "-----------------------------------------------------------------"

# Étape 1 : Envoi des sources vers Cloud Build pour générer l'image Docker de manière sécurisée
echo "📦 Compilation de l'image Docker via Google Cloud Build..."
gcloud builds submit --tag gcr.io/$PROJECT_ID/$SERVICE_NAME

# Étape 2 : Déploiement sur Cloud Run
echo "⚡ Déploiement en cours sur Google Cloud Run..."
gcloud run deploy $SERVICE_NAME \
  --image gcr.io/$PROJECT_ID/$SERVICE_NAME \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated

if [ $? -eq 0 ]; then
  echo "-----------------------------------------------------------------"
  echo "🎉 SUCCÈS : Votre application est maintenant en ligne sur Google Cloud Run !"
  echo "================================================================="
else
  echo "❌ Échec du déploiement. Veuillez vérifier les logs d'erreurs ci-dessus."
fi
