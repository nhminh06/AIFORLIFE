"""
Linguistic Feature Extractor for Grammar Error Detection (GED) — v2
Trích xuất các đặc trưng ngữ pháp & dị thường cú pháp phục vụ mô hình Machine Learning.
"""

import re
import numpy as np

# ─────────────────────────────────────────────────────────────────────────────
# Các regex cơ bản (v1)
# ─────────────────────────────────────────────────────────────────────────────
RE_ARTICLE_A_VOWEL = re.compile(r"\b(a)\s+([aeiou][a-z]+)", re.IGNORECASE)
RE_ARTICLE_AN_CONS = re.compile(r"\b(an)\s+([bcdfghjklmnpqrstvwxyz][a-z]+)", re.IGNORECASE)

# "did/didn't + [not] + past verb" — bắt "did not went", "didn't came"
RE_DID_PAST = re.compile(
    r"\b(did|didn't|didnt)\s+(?:not\s+)?([a-z]+ed|went|saw|bought|came|took|made|found|gave|knew|ran|flew|broke|spoke|wrote|fell|felt|left|lost|met|ate|drank|wore|held)\b",
    re.IGNORECASE,
)
# "they/we/you/I + does/has" (S-V disagreement) — KHÔNG bắt "does not have" của he/she
RE_DOES_PLURAL = re.compile(r"\b(they|we|you|i)\s+(does|doesn't|doesnt|has)\b", re.IGNORECASE)
# "he/she/it + do/don't/have" — chú ý: KHÔNG bắt "does not have" (đó là đúng)
RE_HE_SHE_DO = re.compile(r"\b(he|she|it)\s+(do|don't|dont)\b(?!\s+not)", re.IGNORECASE)
# he/she + have (không phải "has") → lỗi
RE_HE_HAVE = re.compile(r"\b(he|she|it)\s+have\b(?!\s+been)", re.IGNORECASE)
RE_MODAL_PAST = re.compile(r"\b(can|could|will|would|should|must|may|might)\s+([a-z]+ed|went|saw|bought|came|took|made|found)\b", re.IGNORECASE)
RE_BE_V_S = re.compile(r"\b(is|am|are|was|were)\s+([a-z]+s)\b", re.IGNORECASE)
RE_REPEATED_WORDS = re.compile(r"\b([a-zA-Z]{2,})\s+\1\b", re.IGNORECASE)
RE_DOUBLE_PUNCT = re.compile(r"([,;?!]){2,}")
RE_LOWER_START = re.compile(r"^[a-z]")

# ─────────────────────────────────────────────────────────────────────────────
# Regex MỚI (v2) — bắt lỗi verb form & tense
# ─────────────────────────────────────────────────────────────────────────────

# "was/were/am/is/are + bare verb" (not -ing, not past participle)
# Ví dụ: "I was wonder" → lỗi (phải là "was wondering")
# Dùng heuristic: chỉ bắt các từ không kết thúc bằng -ing/-ed/-en/-ied
RE_BE_BARE_VERB = re.compile(
    r"\b(am|is|are|was|were)\s+([a-z]{3,})\b",
    re.IGNORECASE,
)

# "have/has/had + bare verb hoặc V-ing" (phải là past participle)
# Ví dụ: "I have go" → lỗi (phải là "have gone")
# "have/has/had + word" — filter suffix in Python code
RE_HAVE_BARE = re.compile(r"\b(have|has|had)\s+([a-z]{3,})\b", re.IGNORECASE)

# "to + V-ing" (infinitive nhưng dùng gerund)
# Ví dụ: "I want to going" → lỗi
RE_TO_ING = re.compile(r"\bto\s+([a-z]+ing)\b", re.IGNORECASE)

# Lỗi homophone/confusion thường gặp ở người học
# "wonder/wander", "affect/effect", "then/than", "your/you're", "its/it's"
HOMOPHONE_PAIRS: list[tuple[str, str, re.Pattern]] = [
    # "was/were/am/is + wander" (phải là "wonder/wander" tuỳ nghĩa)
    ("was_wonder_error", "was/were + 'wonder' (bare, not -ing)",
     re.compile(r"\b(was|were|am|is|are)\s+wonder\b", re.IGNORECASE)),
    ("then_comparison", "then instead of than in comparison",
     re.compile(r"\b(more|less|better|worse|rather|other)\s+then\b", re.IGNORECASE)),
    ("your_youre", "your instead of you're",
     re.compile(r"\byour\s+(going|coming|doing|having|making|being|a\s+\w+)\b", re.IGNORECASE)),
    ("its_its", "its instead of it's",
     re.compile(r"\bits\s+(a|an|the|going|not|been|true|okay|fine)\b", re.IGNORECASE)),
]

# Double "to" pattern: "to to go"
RE_DOUBLE_TO = re.compile(r"\bto\s+to\b", re.IGNORECASE)

# Preposition trước article kép: "in the a", "on the an"
RE_DOUBLE_ART = re.compile(r"\b(a|an|the)\s+(a|an|the)\b", re.IGNORECASE)

# "go + V-ed" sau modal: "should went", "must came"
RE_MODAL_INF = re.compile(
    r"\b(should|must|can|could|will|would|may|might|shall)\s+(went|came|saw|bought|took|made|found|gave|knew|had|was|were)\b",
    re.IGNORECASE,
)

# Lỗi "be + adjective mạo danh từ" thường gặp: "he is very intelligence"
# Đây là heuristic: từ kết thúc -ence, -ity, -ment, -ness sau "be + very/quite/so"
RE_ADJ_NOUN_CONFUSION = re.compile(
    r"\b(is|am|are|was|were)\s+(very|quite|so|too|really)\s+([a-z]+(ence|ity|ment|ness|ism))\b",
    re.IGNORECASE,
)

# Sau "to" phải là bare verb, không phải V-ed/V-s
RE_TO_PAST = re.compile(
    r"\bto\s+(went|came|saw|bought|took|made|found|gave|knew|ran|flew|broke|spoke|wrote)\b",
    re.IGNORECASE,
)

class GrammarFeatureExtractor:
    """Trích xuất vector đặc trưng dị thường ngữ pháp từ câu văn tiếng Anh (v2)"""

    FEATURE_NAMES = [
        # v1 features
        "article_mismatch_count",
        "did_past_verb_count",
        "sv_agreement_error_count",
        "repeated_word_count",
        "double_punct_count",
        "lower_start_flag",
        "missing_terminal_punct",
        "avg_word_length",
        "comma_density",
        # v2 features (mới)
        "be_bare_verb_count",
        "have_bare_verb_count",
        "to_ing_count",
        "homophone_error_count",
        "double_to_count",
        "double_article_count",
        "modal_irregular_past_count",
        "adj_noun_confusion_count",
        "to_past_verb_count",
    ]

    def extract_sentence_features(self, text: str) -> list:
        clean = text.strip()
        words = clean.split()
        num_words = max(1, len(words))

        # ── V1 features ─────────────────────────────────────────────────────

        # 1. Lỗi mạo từ (a + nguyên âm hoặc an + phụ âm)
        a_matches = [m for m in RE_ARTICLE_A_VOWEL.finditer(clean)
                     if m.group(2).lower() not in ("user", "university", "unique", "unit", "useful", "uniform", "union", "united", "european")]
        an_matches = [m for m in RE_ARTICLE_AN_CONS.finditer(clean)
                      if m.group(2).lower() not in ("hour", "honest", "honor", "heir")]
        article_mismatch = len(a_matches) + len(an_matches)

        # 2. Lỗi did + V-ed
        did_past_count = len(RE_DID_PAST.findall(clean))

        # 3. Lỗi hòa hợp chủ vị
        sv_errors = (
            len(RE_DOES_PLURAL.findall(clean)) +
            len(RE_HE_SHE_DO.findall(clean)) +
            len(RE_HE_HAVE.findall(clean)) +
            len(RE_MODAL_PAST.findall(clean)) +
            len(RE_BE_V_S.findall(clean))
        )

        # 4. Lặp từ
        repeated = len(RE_REPEATED_WORDS.findall(clean))

        # 5. Dấu câu bất thường
        double_punct = len(RE_DOUBLE_PUNCT.findall(clean))

        # 6. Viết hoa đầu câu
        lower_start = 1.0 if RE_LOWER_START.search(clean) else 0.0

        # 7. Thiếu dấu kết thúc
        missing_end = 0.0 if clean.endswith((".", "!", "?", '"', "'")) else 1.0

        # 8. Đặc trưng từ vựng
        avg_len = sum(len(w) for w in words) / num_words
        comma_density = clean.count(",") / num_words

        # ── V2 features (MỚI) ───────────────────────────────────────────────

        # 10. "was/were/am/is/are + bare verb" → chỉ bắt khi từ là động từ rõ ràng (không phải adj/noun)
        # Ví dụ: "I was wonder" (lỗi); "I was wandering" (đúng); "he was sick" (đúng = adj)
        _OK_ENDINGS_BE = ("ing", "ed", "en", "ied", "er", "est", "ly", "ful", "ness", "tion", "ble")
        _OK_AFTER_BE = {
            # Function words
            "a", "an", "the", "not", "no", "never", "just", "also", "still", "only", "so", "very",
            # Common adjectives (không phải động từ)
            "well", "right", "wrong", "ok", "sure", "glad", "true", "ready", "aware", "afraid",
            "happy", "sad", "good", "bad", "fine", "sick", "ill", "late", "early", "old", "new",
            "young", "big", "small", "hot", "cold", "far", "near", "long", "short", "tall", "low",
            "high", "fast", "slow", "hard", "soft", "dark", "light", "real", "clear", "free", "full",
            "live", "alive", "able", "due", "born", "known", "shown", "given", "used",
            # Common nouns / pronouns after be
            "that", "this", "it", "one", "here", "there", "when", "where", "why", "how", "what",
        }
        be_bare = 0
        for m in RE_BE_BARE_VERB.finditer(clean):
            w = m.group(2).lower()
            if w in _OK_AFTER_BE:
                continue
            if any(w.endswith(sfx) for sfx in _OK_ENDINGS_BE):
                continue
            be_bare += 1

        # 11. "have/has/had + bare verb" — chỉ khi "have" là trợ động từ (perfect tense)
        # KHÔNG bắt: "does not have" (have là main verb), "will have" (modal)
        # CHỈ bắt khi subject + have/has + [bare verb không phải past participle]
        _OK_PARTICIPLES = {
            "been", "done", "gone", "seen", "come", "become", "run", "put",
            "set", "let", "cut", "hit", "hurt", "read", "held", "built",
            "bought", "caught", "brought", "thought", "taught", "kept",
            "left", "lost", "met", "meant", "sent", "spent", "felt", "won",
            "written", "begun", "ridden", "risen", "taken", "given", "shown",
        }
        _OK_AFTER_HAVE = {
            "a", "an", "the", "not", "no", "just", "already", "never", "always",
            "some", "any", "more", "much", "many", "enough", "less", "few",
            "to", "this", "that", "my", "your", "his", "her", "their", "our",
        }
        _OK_ENDINGS_HAVE = ("ed", "en", "ied")
        # Bỏ qua nếu "have" đứng trước bởi "not/does/do" (= main verb "to have")
        _MAIN_VERB_HAVE = re.compile(r"\b(do|does|did|will|would|can|could|shall|should|may|might|must)(?:\s+not)?\s+have\b", re.IGNORECASE)
        _main_have_spans = [m.span() for m in _MAIN_VERB_HAVE.finditer(clean)]
        have_bare = 0
        for m in RE_HAVE_BARE.finditer(clean):
            w = m.group(2).lower()
            # Bỏ qua nếu nằm trong span của "does not have" (main verb)
            if any(s <= m.start() <= e for s, e in _main_have_spans):
                continue
            if w in _OK_AFTER_HAVE or w in _OK_PARTICIPLES:
                continue
            if any(w.endswith(sfx) for sfx in _OK_ENDINGS_HAVE):
                continue
            have_bare += 1

        # 12. "to + V-ing"
        to_ing = len(RE_TO_ING.findall(clean))

        # 13. Homophone/confusion errors
        homo_count = sum(
            len(pat.findall(clean))
            for _, _, pat in HOMOPHONE_PAIRS
        )

        # 14. "to to" double preposition
        double_to = len(RE_DOUBLE_TO.findall(clean))

        # 15. Double article "a the", "the a"
        double_art = len(RE_DOUBLE_ART.findall(clean))

        # 16. modal + irregular past (should went)
        modal_irr = len(RE_MODAL_INF.findall(clean))

        # 17. be + adj-noun confusion (is very intelligence)
        adj_noun = len(RE_ADJ_NOUN_CONFUSION.findall(clean))

        # 18. to + past irregular (want to went)
        to_past = len(RE_TO_PAST.findall(clean))

        return [
            float(article_mismatch),
            float(did_past_count),
            float(sv_errors),
            float(repeated),
            float(double_punct),
            lower_start,
            missing_end,
            avg_len,
            comma_density,
            # v2
            float(be_bare),
            float(have_bare),
            float(to_ing),
            float(homo_count),
            float(double_to),
            float(double_art),
            float(modal_irr),
            float(adj_noun),
            float(to_past),
        ]

    def transform(self, texts: list[str]) -> np.ndarray:
        return np.array([self.extract_sentence_features(t) for t in texts], dtype=np.float32)
