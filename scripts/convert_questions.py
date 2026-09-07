"""
Converts the raw JEE-style JSONL question dataset (Question data set/) into
our game's Question schema (src/types.ts). Run manually whenever the raw
dataset changes:

    python3 scripts/convert_questions.py

Rules (per user instruction):
- "module" (the `exercise` field) sets difficulty: higher exercise = harder.
  Exercise 1 -> 2, Exercise 2 -> 3, Exercise 3 -> 4, HLP -> 5 (on our 1-5 scale).
- The chapter (derived from the filename / folder) becomes the `topic`.
- Only single-answer multiple-choice entries are usable by our combat system
  (it needs one correct option) - question_type/type of
  'Single Choice' / 'single_correct' only. Everything else (Subjective,
  Numerical, Multiple Choice/multi_correct, Comprehension, Match the Column,
  Assertion/Reason) is skipped, as is any entry with no answer on record.
"""

import json
import os
import re
import sys

BASE = os.path.join(os.path.dirname(__file__), "..")
DATASET_DIR = os.path.join(BASE, "Question data set")
OUT_PATH = os.path.join(BASE, "src", "data", "questions-jee.json")

FOLDER_TO_SUBJECT = {"math": "Math", "phy": "Physics", "chem": "Chemistry"}

# Friendly chapter names, hand-mapped from the raw filenames.
CHAPTER_NAMES = {
    "2._goc-i_ex_e_questions": "General Organic Chemistry I",
    "ec_exercise_fc_resosir_questions": "Environmental Chemistry",
    "circle": "Circle",
    "sequence_and_series": "Sequence and Series",
    "circular_motion": "Circular Motion",
    "fluid_mechanics": "Fluid Mechanics",
    "chemical_kinetics": "Chemical Kinetics",
    "electrochemistry": "Electrochemistry",
    "definite_integration": "Definite Integration",
    "limits_continuity_derivability": "Limits, Continuity and Derivability",
    "current_electricity_questions": "Current Electricity",
    "electrostatics_questions": "Electrostatics",
}

EXERCISE_TO_DIFFICULTY = {
    "1": 2,
    "exercise-1": 2,
    "2": 3,
    "exercise-2": 3,
    "3": 4,
    "exercise-3": 4,
    "hlp": 5,
    "high level problems (hlp)": 5,
}

USABLE_TYPES = {"single choice", "single_correct"}

OPTION_ECHO_RE = re.compile(r"\n?\(A\).*", re.DOTALL | re.IGNORECASE)
OPTION_ECHO_NUMERIC_RE = re.compile(r"\n?\(1\).*", re.DOTALL)
EXAM_TAG_RE = re.compile(r"\s*\[[A-Za-z].*?\]\s*$")


def clean_question_text(question: str) -> str:
    q = OPTION_ECHO_RE.split(question)[0]
    q = OPTION_ECHO_NUMERIC_RE.split(q)[0]
    q = EXAM_TAG_RE.sub("", q)
    return q.strip()


def resolve_correct_index(answer_key: str, options: dict) -> int | None:
    if not answer_key:
        return None
    key = re.sub(r"[^A-Za-z0-9]", "", answer_key).strip()
    keys = list(options.keys())
    if key in keys:
        return keys.index(key)
    return None


def chapter_name(filename: str) -> str:
    stem = filename.replace(".jsonl", "").lower()
    return CHAPTER_NAMES.get(stem, stem.replace("_", " ").title())


def convert_file(path: str, subject: str, topic: str) -> list:
    out = []
    skipped_no_answer = 0
    total = 0
    with open(path, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            total += 1
            d = json.loads(line)
            qtype = (d.get("question_type") or d.get("type") or "").strip().lower()
            if qtype not in USABLE_TYPES:
                continue

            options_raw = d.get("options")
            if not isinstance(options_raw, dict) or len(options_raw) < 2:
                continue

            answer_key = d.get("answer") or d.get("correct_option")
            correct_index = resolve_correct_index(answer_key, options_raw)
            if correct_index is None:
                skipped_no_answer += 1
                continue

            exercise = str(d.get("exercise", "")).strip().lower()
            difficulty = EXERCISE_TO_DIFFICULTY.get(exercise, 3)

            question_text = clean_question_text(d.get("question", ""))
            if not question_text:
                continue

            qid_raw = d.get("qno") or d.get("question_number") or d.get("question_id") or str(total)
            qid = re.sub(r"[^a-zA-Z0-9]+", "-", f"{topic}-{exercise}-{qid_raw}").strip("-").lower()

            out.append(
                {
                    "id": qid,
                    "subject": subject,
                    "topic": topic,
                    "difficulty": difficulty,
                    "question": question_text,
                    "options": list(options_raw.values()),
                    "correctIndex": correct_index,
                }
            )

    if skipped_no_answer:
        print(f"  ! {os.path.basename(path)}: skipped {skipped_no_answer} single-choice entries with no resolvable answer")
    return out


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    all_questions = []
    seen_ids = set()

    for class_dir in sorted(os.listdir(DATASET_DIR)):
        class_path = os.path.join(DATASET_DIR, class_dir)
        if not os.path.isdir(class_path):
            continue
        for folder, subject in FOLDER_TO_SUBJECT.items():
            subject_path = os.path.join(class_path, folder)
            if not os.path.isdir(subject_path):
                continue
            for fn in sorted(os.listdir(subject_path)):
                if not fn.endswith(".jsonl"):
                    continue
                topic = chapter_name(fn)
                path = os.path.join(subject_path, fn)
                converted = convert_file(path, subject, topic)
                # de-dupe ids across class 11 / class 12 files that might collide
                for q in converted:
                    base_id = q["id"]
                    uid = base_id
                    n = 2
                    while uid in seen_ids:
                        uid = f"{base_id}-{n}"
                        n += 1
                    seen_ids.add(uid)
                    q["id"] = uid
                all_questions.extend(converted)
                print(f"{class_dir}/{folder}/{fn}: {len(converted)} usable questions")

    os.makedirs(os.path.dirname(OUT_PATH), exist_ok=True)
    with open(OUT_PATH, "w", encoding="utf-8") as f:
        json.dump(all_questions, f, ensure_ascii=False, indent=2)

    print(f"\nWrote {len(all_questions)} questions to {OUT_PATH}")


if __name__ == "__main__":
    main()
