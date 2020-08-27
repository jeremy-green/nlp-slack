import os
import boto3
import json
import nltk

nltk.data.path.append("/tmp")
nltk.download("punkt", download_dir="/tmp")

max_items = 25
max_length = 4500


def lambda_handler(event, context):
    client = boto3.client("s3")

    bucket = event["bucket"]
    s3_range = event["range"]
    key = event["key"]

    response = client.get_object(
        Bucket=bucket,
        Key=key,
    )

    messages = json.dumps(response["Body"].read().decode("utf-8"))
    print(messages)
    objects = []
    for message in messages:
        print(message)
        client_msg_id = message.get("client_msg_id")
        ts = message.get("ts")
        tokenized_sentences = nltk.sent_tokenize(message["text"])
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
            format = "txt"
            s3_key = "{}/{}/{}.{}".format(
                os.getenv("S3_PREFIX"),
                s3_range,
                ts,
                format,
            )
            arn = "arn:aws:s3:::{}/{}".format(bucket, s3_key)

            client.put_object(
                Body="\n".join(filtered_sentences),
                Bucket=bucket,
                Key=s3_key,
            )

            objects.append(
                {
                    "bucket": bucket,
                    "format": format,
                    key: s3_key,
                    range: s3_range,
                    arn: arn,
                }
            )

    return {"objects": objects, "range": s3_range}
