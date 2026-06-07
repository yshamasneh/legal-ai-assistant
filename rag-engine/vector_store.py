from sentence_transformers import SentenceTransformer
import faiss
import json
import numpy as np
import os

# تحميل الموديل
model = SentenceTransformer(
    "intfloat/multilingual-e5-base"
)

documents = []
metadata = []

data_folder = "data"

# قراءة جميع ملفات JSON
for filename in os.listdir(data_folder):

    if not filename.endswith(".json"):
        continue

    file_path = os.path.join(data_folder, filename)

    print(f"Loading: {filename}")

    with open(file_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    for item in data:

        article = str(
            item.get(
                "article",
                item.get("article_number", "")
            )
        ).strip()

        law = str(item.get("law", "")).strip()

        title = str(
            item.get("title", "")
        ).strip()

        keywords = item.get(
            "keywords",
            []
        )

        article_text = str(
            item.get("article_text", "")
        ).strip()

        explanation = str(
            item.get("explanation", "")
        ).strip()

        # النص الذي سيتم تحويله إلى embedding
        combined_text = f"""
        القانون: {law}
        المادة: {article}
        العنوان: {title}
        الكلمات المفتاحية: {' '.join(keywords)}
        النص: {article_text}
        الشرح: {explanation}
        """

        documents.append(f"passage: {combined_text}")

        metadata.append({
            "article": article,
            "article_id": item.get("article_id", ""),
            "title": title,
            "keywords": keywords,
            "law": law,
            "article_text": article_text,
            "explanation": explanation
        })

# تحويل النصوص إلى embeddings
embeddings = model.encode(
    documents,
    convert_to_numpy=True
)

embeddings = np.array(
    embeddings
).astype("float32")

# إنشاء index
dimension = embeddings.shape[1]

index = faiss.IndexFlatL2(dimension)

index.add(embeddings)

# إنشاء المجلد إذا لم يكن موجوداً
os.makedirs(
    "vector_data",
    exist_ok=True
)

# حفظ index
faiss.write_index(
    index,
    "vector_data/law_index.faiss"
)

# حفظ metadata
with open(
    "vector_data/metadata.json",
    "w",
    encoding="utf-8"
) as f:

    json.dump(
        metadata,
        f,
        ensure_ascii=False,
        indent=2
    )

print("\nVector store saved successfully.")
print(f"Total documents indexed: {len(documents)}")
print(f"Total laws loaded: {len(set(item['law'] for item in metadata))}")