"""
Museum.Bingo data pipeline on Tower + S3.

Architecture:
Admin input (URL/CSV) -> Tower trigger -> Nimble crawl -> S3 raw/resized images
-> CLIP embeddings -> FAISS index -> S3 index artifacts -> mobile app download.

Flow:
1) Admin submits museum source metadata.
2) Firestore onboarding job created and Tower workflow starts.
3) Nimble crawl extracts artwork metadata and image URLs.
4) Images are downloaded, normalized to RGB, and resized to 224x224.
5) CLIP ViT-B/32 generates 512-d normalized embeddings.
6) FAISS IndexFlatIP builds cosine-similarity search index.
7) Index + id mapping are uploaded to S3.
8) Mobile app downloads artifacts through pre-signed URLs for offline search.
9) Incremental updates append new vectors and publish fresh mapping/index.
10) Monitoring handles retries, logging, webhook validation, and stale rebuilds.
"""

