from fastapi import FastAPI
from pydantic import BaseModel
import faiss
import json
import re
from sentence_transformers import SentenceTransformer
from tashaphyne.stemming import ArabicLightStemmer

from synonyms import (
    synonyms_dict,
    important_phrases,
    legal_keywords,
    colloquial_map
)
from clarification_rules import (
    vague_patterns,
    clarification_categories
)


app = FastAPI(title="Palestinian Legal Consultation API")


# =========================
# Load model + vector store
# =========================
model = SentenceTransformer(
    "intfloat/multilingual-e5-base"
)

index = faiss.read_index("vector_data/law_index.faiss")

with open("vector_data/metadata.json", "r", encoding="utf-8") as f:
    metadata = json.load(f)


# =========================
# Stemmer
# =========================
stemmer = ArabicLightStemmer()


# =========================
# Request model
# =========================
class QuestionRequest(BaseModel):
    question: str


# =========================
# Arabic stopwords
# =========================
arabic_stopwords = {

    "في", "من", "على", "إلى", "الى", "عن",
    "ما", "ماذا", "متى", "كيف", "هل",

    "هو", "هي", "هذا", "هذه",
    "ذلك", "تلك", "هناك", "هنا",

    "او", "أو", "ثم",

    "و", "ف", "ب", "ك", "ل",

    "التي", "الذي", "الذين",
    "اللاتي", "اللائي",

    "كان", "كانت", "يكون", "تكون",
    "تم", "إذا", "اذا",
    "إن", "ان", "أن",

    "انا", "أنا",
    "نحن",

    "انت", "أنت",
    "انتم", "أنتم",

    "هم", "هن",

    "مع", "بعد", "قبل", "عند",

    "كل", "أي", "اي",

    "أين", "اين", "لماذا",

    "لقد", "قد", "بل",

    "حتى", "بين", "ضمن",

    "حول", "أمام", "خلف",
    "تحت",

    "فقط", "أيضا", "أيضاً",

    "جدا", "جداً",

    # ranking cleanup
    "دون",
    "بدون",
    "سبب",

    "هناك",
    "يوجد",

    # common noisy words
    "عندي",
    "عنده",

    "يمكن",

    "اريد",
    "أريد",

    # filler words
    "شي",
    "اشي",
    "شيء",

    # weak connectors
    "على",
    "علي",
    "عليه",
    "عليها"
}

# =========================
# Arabic normalization
# =========================
def normalize_arabic(text: str):

    if not text:
        return ""

    text = text.strip().lower()

    # remove tashkeel
    text = re.sub(r'[\u0617-\u061A\u064B-\u0652]', '', text)

    # normalize letters
    text = re.sub(r'[إأآا]', 'ا', text)
    text = re.sub(r'ى', 'ي', text)
    text = re.sub(r'ؤ', 'و', text)
    text = re.sub(r'ئ', 'ي', text)
    text = re.sub(r'ة', 'ه', text)

    # remove tatweel
    text = re.sub(r'ـ', '', text)

    # remove non-arabic chars
    text = re.sub(r'[^\u0600-\u06FF0-9\s]', ' ', text)

    # normalize spaces
    text = re.sub(r'\s+', ' ', text).strip()

    return text


# =========================
# Colloquial normalization
# =========================
def normalize_colloquial(text: str):

    if not text:
        return ""

    normalized_text = text.strip()

    for phrase, replacement in sorted(
        colloquial_map.items(),
        key=lambda x: len(x[0]),
        reverse=True
    ):

        if len(phrase.strip()) <= 1:
            continue

        normalized_text = re.sub(
            rf"(?<!\S){re.escape(phrase)}(?!\S)",
            replacement,
            normalized_text
        )

    return normalized_text


# =========================
# Remove prefixes
# =========================
def remove_optional_prefixes(word: str):

    candidates = {word}

    prefixes = ["ال", "و", "ف", "ب", "ك", "ل"]

    for prefix in prefixes:
        if word.startswith(prefix) and len(word) > len(prefix) + 2:
            candidates.add(word[len(prefix):])

    combos = ["وال", "بال", "كال", "فال", "لل"]

    for combo in combos:
        if word.startswith(combo) and len(word) > len(combo) + 2:
            candidates.add(word[len(combo):])

    return list(candidates)


# =========================
# Tokenization + stemming
# =========================
def tokenize_arabic(text: str):

    text = normalize_arabic(text)

    raw_tokens = text.split()

    processed_tokens = []

    for token in raw_tokens:

        if token in arabic_stopwords:
            continue

        if len(token) <= 1:
            continue

        variants = remove_optional_prefixes(token)

        for variant in variants:

            if variant in arabic_stopwords:
                continue

            if len(variant) <= 1:
                continue

            processed_tokens.append(variant)

            try:
                stemmer.light_stem(variant)

                stem = stemmer.get_stem()

                if stem and len(stem) > 1:
                    processed_tokens.append(stem)

            except:
                pass

    return list(set(processed_tokens))


# =========================
# Expand tokens with synonyms
# =========================
def expand_tokens(tokens):

    expanded = set()

    for token in tokens:

        expanded.add(token)

        variants = remove_optional_prefixes(token)

        for variant in variants:

            expanded.add(variant)

            if variant in synonyms_dict:

                for syn in synonyms_dict[variant]:
                    expanded.add(normalize_arabic(syn))

    return list(expanded)


# =========================
# Build expanded query
# =========================
def build_expanded_query(question: str):

    tokens = tokenize_arabic(question)

    expanded_tokens = expand_tokens(tokens)

    normalized_question = normalize_arabic(question)

    law_in_question = None

    if "الاحوال الشخصيه" in normalized_question:
        law_in_question = "Palestinian Personal Status Law"

    for phrase in important_phrases:

        norm_phrase = normalize_arabic(phrase)

        if norm_phrase in normalized_question:

            # أضف العبارة كاملة
            expanded_tokens.append(norm_phrase)

            # وأضف كلماتها منفصلة
            for word in norm_phrase.split():
                expanded_tokens.append(word)

    expanded_tokens = list(set(expanded_tokens))

    print("EXPANDED QUERY =", expanded_tokens)

    return " ".join(expanded_tokens), tokens, expanded_tokens

# =========================
# Semantic score
# =========================
def semantic_score_from_distance(distance: float):
    import math
    return math.exp(-float(distance) / 2.0)

# =========================
# Build document text
# =========================
def build_document_text(item):

    article = str(item.get("article", ""))
    law = str(item.get("law", ""))

    title = str(item.get("title", ""))

    keywords = " ".join(
        item.get("keywords", [])
    )

    article_text = str(item.get("article_text", ""))

    explanation = str(item.get("explanation", ""))

    return (
        f"القانون: {law} "
        f"المادة: {article} "
        f"العنوان: {title} "
        f"الكلمات المفتاحية: {keywords} "
        f"النص: {article_text} "
        f"الشرح: {explanation}"
    )


# =========================
# Phrase matches
# =========================
def count_phrase_matches(question: str, doc_text: str):

    q = normalize_arabic(question)
    d = normalize_arabic(doc_text)

    matched = []
    print("IMPORTANT PHRASES =", important_phrases)

    for phrase in important_phrases:

        p = normalize_arabic(phrase)

        if p in q and p in d:
            matched.append(phrase)

    return matched


# =========================
# Keyword overlap
# =========================
def keyword_overlap_score(query_tokens, doc_text):

    doc_tokens = set(tokenize_arabic(doc_text))

    q_tokens = set(query_tokens)

    if not q_tokens:
        return 0.0, []

    matched = sorted(list(q_tokens.intersection(doc_tokens)))

    score = len(matched) / len(q_tokens)

    return score, matched


# =========================
# Exact substring boost
# =========================
def exact_substring_boost(question: str, doc_text: str):
    q = normalize_arabic(question)
    d = normalize_arabic(doc_text)

    boost = 0.0

    if q and q in d:
        boost += 0.15

    q_tokens = tokenize_arabic(question)

    if len(q_tokens) >= 2:
        for i in range(len(q_tokens) - 1):
            phrase = f"{q_tokens[i]} {q_tokens[i+1]}"
            if phrase in d:
                boost += 0.05

    return min(boost, 0.20)

# =========================
# Law boost
# =========================
def law_name_boost(question: str, law_name: str):

    q = normalize_arabic(question)
    law = normalize_arabic(law_name)

    boost = 0.0

    if "القانون الاساسي" in q and "الاساسي" in law:
        boost += 0.18

    if "الاحوال الشخصيه" in q and "الاحوال الشخصيه" in law:
        boost += 0.18

    if "الاجراءات الجزائيه" in q and "الاجراءات الجزائيه" in law:
        boost += 0.18

    if "جزائي" in q and "جزائي" in law:
        boost += 0.15

    if "مدني" in q and "مدني" in law:
        boost += 0.15

    if ("عمل" in q or "عمال" in q) and ("عمل" in law or "عمال" in law):
        boost += 0.15

    return boost


# =========================
# Legal question detection
# =========================
def is_probably_legal_question(question: str):

    tokens = tokenize_arabic(question)

    legal_hits = 0

    for token in tokens:

        if token in legal_keywords:
            legal_hits += 1

        for variant in remove_optional_prefixes(token):

            if variant in legal_keywords:
                legal_hits += 1

    legal_patterns = [
        "حق",
        "حقوق",
        "اعتقال",
        "توقيف",
        "تفتيش",
        "محكمه",
        "شرطه",
        "دعوي",
        "قانون",
        "حبس",
        "قاضي",
        "نيابه",
        "مذكره",
        "مخفر",
        "سجن"
    ]

    normalized_question = normalize_arabic(question)

    for pattern in legal_patterns:

        if pattern in normalized_question:
            legal_hits += 1

    return legal_hits >= 1
# =========================
# Clarification detection
# =========================
def detect_clarification(question: str, results=None):

    normalized_question = normalize_arabic(question)

    # detect vague question
    is_vague = False

    for pattern in vague_patterns:

        normalized_pattern = normalize_arabic(pattern)

        if normalized_pattern in normalized_question:
            is_vague = True
            break

    if not is_vague:
        return None

    # =========================
    # Confidence check
    # =========================

    top_score = 0.0

    if results and len(results) > 0:
        top_score = results[0].get("score", 0.0)
        print("TOP SCORE =", top_score)

    # إذا النتيجة قوية، لا نطلب clarification
    if top_score >= 0.12:
        return None

    # =========================
    # Detect category
    # =========================

    for category_name, category_data in clarification_categories.items():

        for keyword in category_data["keywords"]:

            normalized_keyword = normalize_arabic(keyword)

            if normalized_keyword in normalized_question:

                return {
                    "needs_clarification": True,
                    "question": category_data["question"],
                    "options": category_data["options"]
                }

    # generic fallback
    return {
        "needs_clarification": True,
        "question": "يرجى توضيح نوع المشكلة القانونية.",
        "options": [
            "قضية جنائية",
            "قضية عمل",
            "قضية أسرية",
            "قضية مالية",
            "قضية عقارية"
        ]
    }
# =========================
# Arabic Ordinals Dictionary
# =========================
# =========================
# Arabic Ordinals Dictionary
# =========================
ARABIC_ORDINALS = {
    # الأرقام الترتيبية (المؤنث والمذكر)
    "الاول": "1",      "الاولى": "1",     "اول": "1",       "اولى": "1",
    "الثاني": "2",     "الثانيه": "2",    "ثاني": "2",      "ثانيه": "2",
    "الثالث": "3",     "الثالثه": "3",    "ثالث": "3",      "ثالثه": "3",
    "الرابع": "4",     "الرابعه": "4",    "رابع": "4",      "رابعه": "4",
    "الخامس": "5",     "الخامسه": "5",    "خامس": "5",      "خامسه": "5",
    "السادس": "6",     "السادسه": "6",    "سادس": "6",      "سادسه": "6",
    "السابع": "7",     "السابعه": "7",    "سابع": "7",      "سابعه": "7",
    "الثامن": "8",     "الثامنه": "8",    "ثامن": "8",      "ثامنه": "8",
    "التاسع": "9",     "التاسعه": "9",    "تاسع": "9",      "تاسعه": "9",
    "العاشر": "10",    "العاشره": "10",   "عاشر": "10",     "عاشره": "10",
    "الحاديه عشر": "11", "الحادي عشر": "11",
    "الثانيه عشر": "12", "الثاني عشر": "12",
    "الثالثه عشر": "13", "الثالث عشر": "13",
    "الرابعه عشر": "14", "الرابع عشر": "14",
    "الخامسه عشر": "15", "الخامس عشر": "15",
    "العشرون": "20",   "العشرين": "20",
    "الثلاثون": "30",  "الثلاثين": "30",
    "الاربعون": "40",  "الاربعين": "40",
    "الخمسون": "50",   "الخمسين": "50",
    "المئه": "100",    "المئة": "100",    "مئه": "100",
}


# =========================
# Direct article lookup
# =========================
def direct_article_lookup(question: str):

    normalized_question = normalize_arabic(question)

    # تحويل الأرقام العربية الترتيبية لأرقام إنجليزية
    sorted_ordinals = sorted(
        ARABIC_ORDINALS.items(),
        key=lambda x: len(x[0]),
        reverse=True
    )

    for arabic_word, number in sorted_ordinals:
        pattern = rf'(?<!\S){re.escape(arabic_word)}(?!\S)'
        if re.search(pattern, normalized_question):
            normalized_question = re.sub(
                pattern,
                number,
                normalized_question
            )
            break

    # استخراج القانون إذا ذكره المستخدم
    law_in_question = None

    if "الاحوال الشخصيه" in normalized_question:
        law_in_question = "Palestinian Personal Status Law"
    elif "العمل" in normalized_question and "ساعات" not in normalized_question:
        law_in_question = "Palestinian Labor Law"
    elif "المدني" in normalized_question or "مدني" in normalized_question:
        law_in_question = "Palestinian Civil Law"
    elif "الاساسي" in normalized_question:
        law_in_question = "Palestinian Basic Law"
    elif "الاجراءات الجزائيه" in normalized_question or "العقوبات" in normalized_question:
        law_in_question = "Palestinian Criminal Procedure Law"

    # نبحث عن: "المادة 5" أو "المادة رقم 5"
    match = re.search(
        r'الماده\s*(رقم)?\s*(\d+)',
        normalized_question
    )

    if not match:
        return None

    article_number = match.group(2)

    matched_results = []

    for item in metadata:

        item_article = str(item.get("article", "")).strip()

        if item_article != article_number:
            continue

        if law_in_question:
            item_law = item.get("law", "")
            if item_law != law_in_question:
                continue

        matched_results.append({
            "score": 1.0,
            "vector_score": 1.0,
            "keyword_score": 1.0,
            "phrase_matches": ["direct_article_match"],
            "matched_keywords": [article_number],
            "article": item_article,
            "law": item.get("law", ""),
            "article_text": item.get("article_text", ""),
            "explanation": item.get("explanation", "")
        })

    if matched_results:
        return matched_results

    return []


# =========================
# Main retrieval function
# =========================
def search_legal_articles(question: str, top_k: int = 20):

    # محاولة استرجاع مادة مباشرة
    direct_results = direct_article_lookup(question)

    if direct_results is not None:
        return direct_results

    expanded_query, original_tokens, expanded_tokens = build_expanded_query(question)

    query_embedding = model.encode(
        [f"query: {expanded_query}"],
        convert_to_numpy=True
    )

    distances, indices = index.search(query_embedding, top_k)

    results = []

    for rank, idx in enumerate(indices[0]):

        if idx == -1 or idx >= len(metadata):
            continue

        item = metadata[idx]

        doc_text = build_document_text(item)

        vector_score = semantic_score_from_distance(distances[0][rank])

        keyword_score, matched_keywords = keyword_overlap_score(
            expanded_tokens,
            doc_text
        )

        phrase_matches = count_phrase_matches(question, doc_text)

        phrase_score = min(0.18 * len(phrase_matches), 0.30)

        substring_score = exact_substring_boost(question, doc_text)

        law_boost = law_name_boost(question, item.get("law", ""))

        final_score = (
            0.70 * vector_score +
            0.15 * keyword_score +
            phrase_score +
            substring_score +
            law_boost
        )

        results.append({
            "score": round(float(final_score), 6),
            "vector_score": round(float(vector_score), 6),
            "keyword_score": round(float(keyword_score), 6),
            "phrase_matches": phrase_matches,
            "matched_keywords": matched_keywords,
            "article": str(item.get("article", "")),
            "law": item.get("law", ""),
            "article_text": item.get("article_text", ""),
            "explanation": item.get("explanation", "")
        })

    results.sort(key=lambda x: x["score"], reverse=True)

    return results
# =========================
# Reject weak results
# =========================
def should_reject_results(question: str, results):
    if not results:
        return True, "لم يتم العثور على نتائج."
    
    # threshold منخفض للتشخيص — نريد نشوف النتائج الفعلية
    if results[0]["score"] < 0.02:
        return True, "لم يتم العثور على مواد قانونية."
    
    return False, ""

# =========================
# Generate answer
# =========================
def generate_llm_answer(top_matches):

    if not top_matches:
        return "لم يتم العثور على مواد قانونية مناسبة."

    top = top_matches[0]

    return (
        f"استناداً إلى {top['law']}، "
        f"المادة {top['article']}، "
        f"فإن النص القانوني الأقرب للسؤال هو: "
        f"{top['article_text']} "
        f"التفسير المبسط: "
        f"{top['explanation']}"
    )


# =========================
# Endpoints
# =========================
@app.get("/")
def home():

    return {
        "message": "Palestinian Legal Consultation API is running"
    }


@app.get("/laws")
def get_laws():

    unique_laws = sorted(
        list(set(item.get("law", "") for item in metadata))
    )

    return {
        "total_articles": len(metadata),
        "laws_count": len(unique_laws),
        "sample_laws": unique_laws[:10]
    }


@app.post("/ask")
def ask_question(request: QuestionRequest):

    original_question = request.question.strip()

    question = normalize_colloquial(original_question)

    if not question:

        return {
            "original_question": original_question,
            "normalized_question": question,
            "top_matches": [],
            "llm_answer": "الرجاء إدخال سؤال قانوني.",
            "disclaimer":
                "هذه الإجابة لأغراض الإرشاد القانوني العام فقط "
                "ولا تغني عن استشارة محامٍ."
        }

    results = search_legal_articles(
        question,
        top_k=20
    )

    # clarification check
    clarification = detect_clarification(question, results)

    if clarification:

        return {
            "original_question": original_question,
            "normalized_question": question,

            "needs_clarification":
                clarification["needs_clarification"],

            "clarification_question":
                clarification["question"],

            "options":
                clarification["options"],

            "disclaimer":
                "هذه الإجابة لأغراض الإرشاد القانوني العام فقط "
                "ولا تغني عن استشارة محامٍ."
        }

    reject, message = should_reject_results(
        question,
        results
    )

    if reject:

        return {
            "original_question": original_question,
            "normalized_question": question,
            "top_matches": [],
            "llm_answer": message,
            "disclaimer":
                "هذه الإجابة لأغراض الإرشاد القانوني العام فقط "
                "ولا تغني عن استشارة محامٍ."
        }

    top_matches = results[:3]

    llm_answer = generate_llm_answer(top_matches)

    return {
        "original_question": original_question,
        "normalized_question": question,
        "top_matches": top_matches,
        "llm_answer": llm_answer,
        "disclaimer":
            "هذه الإجابة لأغراض الإرشاد القانوني العام فقط "
            "ولا تغني عن استشارة محامٍ."
    }