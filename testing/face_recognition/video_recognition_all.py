import face_recognition
import cv2
import numpy as np
import os
import datetime
import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore
from firebase_admin import storage
import moviepy.editor as mp
import deepspeech_local

# run this script after the video is uploaded through website
class VideoRecognition:
    def __init__(self, compress_factor, username, videoname):
        # firebase
        self.username = username
        self.videoname = videoname
        self.cred = credentials.Certificate("../serviceAccountKey.json")
        firebase_admin.initialize_app(self.cred, {
            'storageBucket': 'memoryboost-79ad5.appspot.com'
        })
        self.bucket = storage.bucket()
        self.db = firestore.client()
        self.user_ref = self.db.collection(u'users').document(self.username)
        self.faces_ref = self.db.collection(u'users').document(self.username).collection(u'faces')

        # download the specified video
        videos_local = [i for i in os.listdir("videos")]
        if self.videoname not in videos_local:
            self.download_blob(self.username+"/videos/"+self.videoname,"videos/"+self.videoname)
        self.video_capture = cv2.VideoCapture("videos/"+self.videoname)
        self.compress_factor = compress_factor

    def load_faces(self):
        self.known_face_encodings = []
        self.known_face_names = []
        # get list of face_images from storage and download ones not found locally
        face_images_storage = [i.name[len(self.username+"/face_images")+1:] for i in self.bucket.list_blobs(prefix=self.username+"/face_images")]
        face_images_local = [i for i in os.listdir("images")]
        face_images_diff = list(set(face_images_storage) ^ set(face_images_local))
        for image in face_images_diff:
            if image != "":
                print(self.username+"/face_images/"+image)
                print("images/"+image)
                self.download_blob(self.username+"/face_images/"+image,"images/"+image)

        # learn faces
        for image in os.listdir("images"):
            name = image.split(".")[0]
            print("loading this face: ", name)
            try:
                exec('{}_image = face_recognition.load_image_file("images/{}")'.format(name, image))
                exec('{}_face_encoding = face_recognition.face_encodings({}_image)[0]'.format(name, name))
                exec('self.known_face_encodings.append({}_face_encoding)'.format(name))
                self.known_face_names.append(name)
            except Exception as e:
                print(name, e)
                print("probably face not found")
                continue
        print("loaded these faces: ", self.known_face_names)

    def process(self, display):
        face_locations = []
        face_encodings = []
        face_names = []
        face_names_firestore = {}
        frame_count = 0
        while True:
            frame_count += 1

            # Grab a single frame of video
            ret, frame = self.video_capture.read()
            if not ret:
                break

            original_frame = frame.copy()

            # Resize frame of video to 1/compress_factor size for faster face recognition processing
            small_frame = cv2.resize(frame, (0, 0), fx=1/self.compress_factor, fy=1/self.compress_factor)
            
            # Convert the image from BGR color (which OpenCV uses) to RGB color (which face_recognition uses)
            rgb_small_frame = small_frame[:, :, ::-1]

            # Only process 1/20 frame of video to save time
            if frame_count%20 == 0:
                # Find all the faces and face encodings in the current frame of video
                face_locations = face_recognition.face_locations(rgb_small_frame)
                face_encodings = face_recognition.face_encodings(rgb_small_frame, face_locations)

                face_names = []
                for face_encoding in face_encodings:
                    # See if the face is a match for the known face(s)
                    matches = face_recognition.compare_faces(self.known_face_encodings, face_encoding)
                    name = "Unknown"

                    # Or instead, use the known face with the smallest distance to the new face
                    face_distances = face_recognition.face_distance(self.known_face_encodings, face_encoding)
                    best_match_index = np.argmin(face_distances)
                    if matches[best_match_index]:
                        name = self.known_face_names[best_match_index]

                    face_names.append(name)
            
            # make thumbnail
            if frame_count == 100:
                self.make_thumbnail(original_frame)

            # firestore
            # stores the first timestamp of the appearance
            for face_name in face_names:
                if face_name not in face_names_firestore.keys():
                    face_names_firestore[face_name] = frame_count

            if display:
                # Display the results
                for (top, right, bottom, left), name in zip(face_locations, face_names):
                    # Scale back up face locations since the frame we detected in was scaled to 1/4 size
                    top *= self.compress_factor
                    right *= self.compress_factor
                    bottom *= self.compress_factor
                    left *= self.compress_factor

                    # Draw a box around the face
                    cv2.rectangle(frame, (left, top), (right, bottom), (0, 0, 255), 2)

                    # Draw a label with a name below the face
                    cv2.rectangle(frame, (left, bottom - 35), (right, bottom), (0, 0, 255), cv2.FILLED)
                    font = cv2.FONT_HERSHEY_DUPLEX
                    cv2.putText(frame, name, (left + 6, bottom - 6), font, 1.0, (255, 255, 255), 1)

                # Display the resulting image
                cv2.imshow('Video', frame)

            key = cv2.waitKey(1) & 0xFF

            # Hit 'q' on the keyboard to quit!, 's' to save a new face image
            if key == ord('s'):
                self.learn_new_face(original_frame)
            elif key == ord('q'):
                break

        videos_faces_ref = self.db.collection(u'users').document(self.username).collection(u'videos').document(self.videoname)
        for face in face_names_firestore.keys():
            
            videos_faces_ref.collection(u'faces').document(face).set({u'timestamp': face_names_firestore[face]})
        
            appeared_videos_ref = self.db.collection(u'users').document(self.username).collection(u'profiles').document(face)
            doc = appeared_videos_ref.get()
            if doc.to_dict()["videos"] is None:
                new_appeared_videos = [self.videoname]
            else:
                new_appeared_videos = doc.to_dict()["videos"]
                new_appeared_videos.append(self.videoname)
            appeared_videos_ref.update({u'videos':new_appeared_videos})
        videos_faces_ref.update({
            u'faces': [str(key) for key in face_names_firestore.keys()],
            u'thumbnail_url': "{}/thumbnails/{}_thumbnail.jpg".format(self.username,self.videoname[:-4]),
            u'video_url': "{}/videos/{}".format(self.username,self.videoname)})

    def stop(self):
        # Release handle to the webcam
        self.video_capture.release()
        cv2.destroyAllWindows()

    def learn_new_face(self, img):
        cv2.imshow('learning new face', img)
        cv2.waitKey(1)
        print("who is this (type q to abort): ")
        name = input()
        if name == "q":
            cv2.destroyWindow('learning new face')
            print("learning new face aborted")
        else:
            cv2.imwrite("images/{}.jpg".format(name), img)
            self.upload_blob("images/"+name+".jpg", self.username+"/face_images/"+name+".jpg")
            cv2.destroyWindow('learning new face')
            self.load_faces()
    
    def make_thumbnail(self, img):
        cv2.imshow('making thumbnail', img)
        cv2.waitKey(1)
        cv2.imwrite("thumbnails/{}_thumbnail.jpg".format(self.videoname[:-4]), img)
        self.upload_blob("thumbnails/"+self.videoname[:-4]+"_thumbnail.jpg", self.username+"/thumbnails/"+self.videoname[:-4]+"_thumbnail.jpg")
        cv2.destroyWindow('making thumbnail')

    def download_blob(self, source_blob_name, destination_file_name):
        blob = self.bucket.blob(source_blob_name)
        blob.download_to_filename(destination_file_name)
        print(
            "Downloaded storage object {} to local file {}.".format(
                source_blob_name, destination_file_name
            )
        )

    def upload_blob(self, source_file_name, destination_blob_name):

        blob = self.bucket.blob(destination_blob_name)
        blob.upload_from_filename(source_file_name)

        print(
            f"File {source_file_name} uploaded to {destination_blob_name}."
        )
    
    def convert_video_to_audio(self):
        my_clip = mp.VideoFileClip("videos/"+self.videoname)
        my_clip.audio.write_audiofile("audio/"+self.videoname[:-4]+".wav", fps=16000, ffmpeg_params=["-ac", "1"])
    
    def speech2text(self):
        text = deepspeech_local.main(model_arg="deepspeech-0.9.3-models.pbmm",scorer_arg="deepspeech-0.9.3-models.scorer",audio_arg="audio/"+self.videoname[:-4]+".wav")
        videos_faces_ref = self.db.collection(u'users').document(self.username).collection(u'videos').document(self.videoname)
        videos_faces_ref.update({u'text': text})

        

def main():
    videoRecognition = VideoRecognition(2, "kazuya", "lmg.mp4")
    videoRecognition.load_faces()
    videoRecognition.process(display=True)
    videoRecognition.stop()
    videoRecognition.convert_video_to_audio()
    videoRecognition.speech2text()

if __name__ == "__main__":
    main()
