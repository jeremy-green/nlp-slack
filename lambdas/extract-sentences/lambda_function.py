import os
import json
import boto3
import nltk

nltk.data.path.append('/tmp')
nltk.download('punkt', download_dir='/tmp')

max_items = 25
max_length = 4500

def lambda_handler(event, context):
    client = boto3.client('s3')
    records = event['Records']
    for record in records:
        s3 = record['s3']
        bucket = s3['bucket']
        object = s3['object']
        name = bucket['name']
        key = object['key']
        response = client.get_object(
            Bucket=name,
            Key=key,
        )

        messages = response['Body'].read().decode('utf-8').splitlines()
        for message in messages:
            parsed_message = json.loads(message)
            client_msg_id = parsed_message.get('client_msg_id')
            tokenized_sentences = nltk.sent_tokenize(parsed_message['text'])
            filtered_sentences = list(set([sentence[:max_length] for sentence in tokenized_sentences if len(sentence.strip()) > 1]))[:max_items]
            if client_msg_id is not None and len(filtered_sentences) > 0:
                client.put_object(
                    Body='\n'.join(filtered_sentences),
                    Bucket=name,
                    Key='{}/{}.txt'.format(os.getenv('S3_PREFIX'), client_msg_id),
                )

    return {
        'statusCode': 204
    }
