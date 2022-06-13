import firebase_admin
from firebase_admin import credentials
from firebase_admin import storage
import os

cred = credentials.Certificate('../serviceAccountKey.json')
firebase_admin.initialize_app(cred, {
    'storageBucket': 'memoryboost-79ad5.appspot.com'
})

bucket = storage.bucket()

def download_blob(source_blob_name, destination_file_name):

    blob = bucket.blob(source_blob_name)
    blob.download_to_filename(destination_file_name)

    print(
        "Downloaded storage object {} to local file {}.".format(
            source_blob_name, destination_file_name
        )
    )

def upload_blob(source_file_name, destination_blob_name):

    blob = bucket.blob(destination_blob_name)
    blob.upload_from_filename(source_file_name)

    print(
        f"File {source_file_name} uploaded to {destination_blob_name}."
    )

def list_buckets():
    """Lists all buckets."""

    # storage_client = storage.Client()
    buckets = storage.list_buckets()

    for bucket in buckets:
        print(bucket.name)

# download_blob("face_images/kazuya.jpg","a.jpg")
# upload_blob("images/kazuya.jpg","face_images/a.jpg")
a = [i.name[len("kazuya/face_images")+1:] for i in bucket.list_blobs(prefix="kazuya/face_images")]
b = [i for i in os.listdir("images")]
diff_list = set(a) ^ set(b)
print(list(diff_list))