import json
import nltk

nltk.data.path.append("/tmp")
nltk.download("punkt", download_dir="/tmp")

max_items = 25
max_length = 4500


def lambda_handler(event, context):
    records = event["history"]
    messages = []
    for record in records:
        client_msg_id = record.get("client_msg_id")
        ts = record.get("ts")
        tokenized_sentences = nltk.sent_tokenize(record["text"])
        filtered_sentences = list(
            set(
                [
                    sentence[:max_length]
                    for sentence in tokenized_sentences
                    if len(sentence.strip()) > 1
                ]
            )
        )[:max_items]
        if client_msg_id is not None and len(filtered_sentences) > 0:
            msg = {"ts": ts, "sentences": filtered_sentences}
            messages.append(msg)

    return {"history": messages}
