import json
import os

import clip
import torch
from PIL import Image
from torch.utils.data import DataLoader, Dataset


class MuseumArtworkDataset(Dataset):
    """Custom dataset for museum artworks."""

    def __init__(self, metadata_path, image_dir, transform=None):
        with open(metadata_path, encoding="utf-8") as f:
            self.metadata = json.load(f)  # list of {image_path, text_description}
        self.image_dir = image_dir
        self.transform = transform or clip.load("ViT-B/32")[1]

    def __len__(self):
        return len(self.metadata)

    def __getitem__(self, idx):
        item = self.metadata[idx]
        image = Image.open(os.path.join(self.image_dir, item["image_path"])).convert("RGB")
        text = item["text_description"]
        image = self.transform(image)
        text_tokens = clip.tokenize([text])[0]
        return image, text_tokens


def finetune(model, dataloader, device, epochs=3, lr=5e-6):
    optimizer = torch.optim.Adam(model.parameters(), lr=lr)
    loss_img = torch.nn.CrossEntropyLoss()
    loss_txt = torch.nn.CrossEntropyLoss()

    model.train()
    for epoch in range(epochs):
        total_loss = 0.0
        for images, texts in dataloader:
            images = images.to(device)
            texts = texts.to(device)
            logits_per_image, logits_per_text = model(images, texts)
            ground_truth = torch.arange(len(images), device=device)
            loss = (
                loss_img(logits_per_image, ground_truth)
                + loss_txt(logits_per_text, ground_truth)
            ) / 2
            optimizer.zero_grad()
            loss.backward()
            optimizer.step()
            total_loss += loss.item()

        print(f"Epoch {epoch + 1}, Loss: {total_loss / len(dataloader):.4f}")

    torch.save(model.state_dict(), "finetuned_clip_museum.pt")


if __name__ == "__main__":
    device = "cuda" if torch.cuda.is_available() else "cpu"
    model, preprocess = clip.load("ViT-B/32", device=device)
    dataset = MuseumArtworkDataset("museum_metadata.json", "images/", preprocess)
    loader = DataLoader(dataset, batch_size=32, shuffle=True)
    finetune(model, loader, device=device)
